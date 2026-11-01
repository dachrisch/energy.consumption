import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { JWT_SECRET } from '../../../api/utils';
import User from '../../../models/User';
import {
  GOOGLE_SCOPES,
  buildConsentUrl,
  clientForRefreshToken,
  createOAuthClient,
  decryptRefreshToken,
  encryptRefreshToken,
  exchangeCode,
  googleCredentials,
  isGoogleConfigured,
  isInvalidGrant,
  markReconnectRequired,
  signState,
  verifyState,
} from '../oauth';

const ORIGINAL = {
  id: process.env.GOOGLE_CLIENT_ID,
  secret: process.env.GOOGLE_CLIENT_SECRET,
};

function setGoogleEnv(clientId = 'client-id', clientSecret = 'client-secret') {
  process.env.GOOGLE_CLIENT_ID = clientId;
  process.env.GOOGLE_CLIENT_SECRET = clientSecret;
}

function restoreEnv() {
  for (const [key, value] of [
    ['GOOGLE_CLIENT_ID', ORIGINAL.id],
    ['GOOGLE_CLIENT_SECRET', ORIGINAL.secret],
  ] as const) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

beforeEach(() => {
  setGoogleEnv();
});

afterEach(() => {
  restoreEnv();
  vi.restoreAllMocks();
});

describe('googleCredentials / isGoogleConfigured', () => {
  it('reports configured only when both id and secret are set', () => {
    expect(isGoogleConfigured()).toBe(true);
    expect(googleCredentials()).toEqual({ clientId: 'client-id', clientSecret: 'client-secret' });

    delete process.env.GOOGLE_CLIENT_ID;
    expect(isGoogleConfigured()).toBe(false);
    expect(googleCredentials().clientId).toBe('');
  });
});

describe('createOAuthClient', () => {
  it('uses the configured credentials', () => {
    const url = new URL(buildConsentUrl(createOAuthClient(), 'https://app.example/cb', 'state'));
    expect(url.searchParams.get('client_id')).toBe('client-id');
  });

  it('refuses to build a client without credentials', () => {
    delete process.env.GOOGLE_CLIENT_ID;
    expect(() => createOAuthClient()).toThrow(/GOOGLE_CLIENT_ID/);
  });

  it('binds a refresh token when acting as a user', () => {
    expect(clientForRefreshToken('refresh-token').credentials.refresh_token).toBe('refresh-token');
  });
});

describe('buildConsentUrl', () => {
  it('requests offline access for exactly the intake scopes', () => {
    const url = new URL(buildConsentUrl(createOAuthClient(), 'https://app.example/api/google/callback', 'signed-state'));

    expect(url.host).toBe('accounts.google.com');
    expect(url.searchParams.get('access_type')).toBe('offline');
    expect(url.searchParams.get('prompt')).toBe('consent');
    expect(url.searchParams.get('redirect_uri')).toBe('https://app.example/api/google/callback');
    expect(url.searchParams.get('state')).toBe('signed-state');
    expect(url.searchParams.get('scope')?.split(' ')).toEqual([...GOOGLE_SCOPES]);
  });

  it('asks for Gmail read and Drive file access only', () => {
    expect(GOOGLE_SCOPES).toContain('https://www.googleapis.com/auth/gmail.readonly');
    expect(GOOGLE_SCOPES).toContain('https://www.googleapis.com/auth/drive.file');
    expect(GOOGLE_SCOPES.some((scope) => scope.includes('drive.readonly'))).toBe(false);
  });
});

describe('signState / verifyState', () => {
  it('round-trips the user id', () => {
    expect(verifyState(signState('user-1'))).toBe('user-1');
  });

  it('binds the token to this application audience', () => {
    const foreign = jwt.sign({ userId: 'user-1' }, JWT_SECRET, { audience: 'something-else' });
    expect(() => verifyState(foreign)).toThrow();
  });

  it('rejects tampered and payload-less states', () => {
    expect(() => verifyState(`${signState('user-1')}x`)).toThrow();
    const noUser = jwt.sign({ n: 'x' }, JWT_SECRET, { audience: 'energy-monitor-google-oauth' });
    expect(() => verifyState(noUser)).toThrow(/Invalid OAuth state/);
  });

  it('expires after ten minutes', () => {
    const decoded = jwt.decode(signState('user-1')) as { exp: number; iat: number };
    expect(decoded.exp - decoded.iat).toBe(600);
  });

  it('produces a different nonce for every call', () => {
    expect(signState('user-1')).not.toBe(signState('user-1'));
  });
});

describe('isInvalidGrant', () => {
  it('recognises Google error responses and reconnect errors', () => {
    expect(isInvalidGrant({ response: { data: { error: 'invalid_grant' } } })).toBe(true);
    expect(isInvalidGrant(new Error('Token has been expired or revoked: invalid_grant'))).toBe(true);
    expect(isInvalidGrant(Object.assign(new Error('expired'), { name: 'GoogleReconnectRequiredError' }))).toBe(true);
  });

  it('ignores unrelated failures', () => {
    expect(isInvalidGrant(new Error('network down'))).toBe(false);
    expect(isInvalidGrant(null)).toBe(false);
    expect(isInvalidGrant({ response: { data: { error: 'quota_exceeded' } } })).toBe(false);
  });
});

describe('refresh token storage helpers', () => {
  it('encrypts at rest and decrypts back', () => {
    const token = '1//refresh-token-value';
    const stored = encryptRefreshToken(token);

    expect(stored).not.toBe(token);
    expect(stored).not.toContain(token);
    expect(decryptRefreshToken(stored)).toBe(token);
  });
});

describe('exchangeCode', () => {
  it('fails loudly when Google withholds the refresh token', async () => {
    vi.spyOn(OAuth2Client.prototype, 'getToken')
      .mockResolvedValue({ tokens: { access_token: 'access-only' } } as never);

    await expect(exchangeCode('code', 'https://app.example/cb'))
      .rejects.toThrow(/did not return a refresh token/);
  });

  it('returns the refresh token and the Google identity', async () => {
    vi.spyOn(OAuth2Client.prototype, 'getToken')
      .mockResolvedValue({ tokens: { access_token: 'access', refresh_token: 'refresh' } } as never);
    vi.spyOn(OAuth2Client.prototype, 'getTokenInfo')
      .mockResolvedValue({ sub: 'sub-1', email: 'user@example.com', scopes: ['gmail.readonly'] } as never);

    await expect(exchangeCode('code', 'https://app.example/cb')).resolves.toEqual({
      refreshToken: 'refresh',
      identity: { sub: 'sub-1', email: 'user@example.com', scopes: ['gmail.readonly'] },
    });
  });

  it('still returns the token when the identity lookup fails', async () => {
    vi.spyOn(OAuth2Client.prototype, 'getToken')
      .mockResolvedValue({ tokens: { access_token: 'access', refresh_token: 'refresh' } } as never);
    vi.spyOn(OAuth2Client.prototype, 'getTokenInfo').mockRejectedValue(new Error('no tokeninfo'));
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(exchangeCode('code', 'https://app.example/cb')).resolves.toEqual({
      refreshToken: 'refresh',
      identity: { scopes: [] },
    });
  });
});

describe('markReconnectRequired', () => {
  it('flags the account for reconnection', async () => {
    const update = vi.spyOn(User, 'updateOne').mockResolvedValue({} as never);

    await markReconnectRequired('user-1');

    expect(update).toHaveBeenCalledWith(
      { _id: 'user-1' },
      { $set: { 'google.status': 'reconnect_required' } },
    );
  });
});
