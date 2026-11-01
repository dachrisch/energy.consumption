import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { JWT_SECRET } from '../../api/utils';
import User from '../../models/User';
import { decrypt, encrypt } from '../encryption';

/**
 * Google scopes for the provider-intake feature.
 *
 * - `gmail.readonly` lets the app find provider mail and fetch attachments.
 *   Restricted scope: the OAuth client runs unverified, which Google explicitly
 *   allows for personal use (warning screen + 100-account cap, no CASA).
 * - `drive.file` covers only files this app creates, so no verification and no
 *   access to the rest of the user's Drive.
 */
export const GOOGLE_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/drive.file',
];

const STATE_AUDIENCE = 'energy-monitor-google-oauth';

export class GoogleNotConnectedError extends Error {
  constructor() {
    super('Google account is not connected');
    this.name = 'GoogleNotConnectedError';
  }
}

export class GoogleReconnectRequiredError extends Error {
  constructor() {
    super('Google authorization expired, reconnect required');
    this.name = 'GoogleReconnectRequiredError';
  }
}

export function googleCredentials() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
  };
}

export function isGoogleConfigured(): boolean {
  const { clientId, clientSecret } = googleCredentials();
  return Boolean(clientId && clientSecret);
}

export function createOAuthClient(): OAuth2Client {
  const { clientId, clientSecret } = googleCredentials();
  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set');
  }
  return new OAuth2Client(clientId, clientSecret);
}

/** OAuth client acting as a user, from their stored (decrypted) refresh token. */
export function clientForRefreshToken(refreshToken: string): OAuth2Client {
  const client = createOAuthClient();
  client.setCredentials({ refresh_token: refreshToken });
  return client;
}

export function signState(userId: string): string {
  return jwt.sign({ userId, n: crypto.randomBytes(8).toString('hex') }, JWT_SECRET, {
    audience: STATE_AUDIENCE,
    expiresIn: '10m',
  });
}

export function verifyState(state: string): string {
  const payload = jwt.verify(state, JWT_SECRET, { audience: STATE_AUDIENCE }) as { userId?: string };
  if (!payload.userId) {
    throw new Error('Invalid OAuth state');
  }
  return payload.userId;
}

export function buildConsentUrl(client: OAuth2Client, redirectUri: string, state: string): string {
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: true,
    scope: GOOGLE_SCOPES,
    redirect_uri: redirectUri,
    state,
  });
}

/** Google signals a dead refresh token (revoked, password changed, expired). */
export function isInvalidGrant(error: unknown): boolean {
  const err = error as { response?: { data?: { error?: string } }; message?: string };
  const code = err?.response?.data?.error;
  if (code === 'invalid_grant') {
    return true;
  }
  return typeof err?.message === 'string' && err.message.includes('invalid_grant');
}

export interface GoogleIdentity {
  sub?: string;
  email?: string;
  scopes: string[];
}

export async function exchangeCode(
  code: string,
  redirectUri: string,
): Promise<{ refreshToken: string; identity: GoogleIdentity }> {
  const client = createOAuthClient();
  const { tokens } = await client.getToken({ code, redirect_uri: redirectUri });
  client.setCredentials(tokens);
  if (!tokens.refresh_token) {
    throw new Error('Google did not return a refresh token; revoke the app and connect again');
  }
  const identity = await readIdentity(client, tokens.access_token ?? undefined);
  return { refreshToken: tokens.refresh_token, identity };
}

async function readIdentity(client: OAuth2Client, accessToken?: string): Promise<GoogleIdentity> {
  if (!accessToken) {
    return { scopes: [] };
  }
  try {
    const info = await client.getTokenInfo(accessToken);
    return {
      sub: info.sub ?? undefined,
      email: info.email ?? undefined,
      scopes: info.scopes ?? [],
    };
  } catch (error) {
    console.warn('Could not read Google token info:', error);
    return { scopes: [] };
  }
}

export function encryptRefreshToken(token: string): string {
  return encrypt(token);
}

export function decryptRefreshToken(token: string): string {
  return decrypt(token);
}

export async function markReconnectRequired(userId: string): Promise<void> {
  await User.updateOne({ _id: userId }, { $set: { 'google.status': 'reconnect_required' } });
}
