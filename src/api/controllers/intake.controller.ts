import crypto from 'crypto';
import User from '../../models/User';
import Provider from '../../models/Provider';
import ProviderDocument from '../../models/ProviderDocument';
import { RouteParams, sanitizeString } from '../utils';
import {
  GOOGLE_SCOPES, isGoogleConfigured, buildConsentUrl, signState, verifyState,
  exchangeCode, clientForRefreshToken, createOAuthClient, isInvalidGrant,
  decryptRefreshToken, encryptRefreshToken, markReconnectRequired,
} from '../../lib/google/oauth';
import { gmailFor, buildProviderQuery, collectAttachments, headerValue } from '../../lib/google/gmail';

function callbackUrl(): string {
  return process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:3000/api/google/callback';
}

async function getUserGoogleAccount(userId: string): Promise<{ refresh: string; sub: string } | null> {
  const user = await User.findById(userId).lean();
  if (!user?.google?.refreshToken) { return null; }
  try {
    const refresh = decryptRefreshToken(user.google.refreshToken);
    return { refresh, sub: user.google.sub ?? '' };
  } catch { return null; }
}

export async function handleConnect({ res, userId }: RouteParams): Promise<void> {
  if (!isGoogleConfigured()) {
    res.statusCode = 501;
    res.end(JSON.stringify({ error: 'GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set' }));
    return;
  }
  const state = signState(userId);
  const client = createOAuthClient();
  res.statusCode = 302;
  res.setHeader('Location', buildConsentUrl(client, callbackUrl(), state));
  res.end('');
}

export async function handleCallback({ res, url }: RouteParams): Promise<void> {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state) {
    res.statusCode = 400; res.end(JSON.stringify({ error: 'Missing code or state' })); return;
  }

  // The state token is the only trustworthy binding between the browser coming
  // back from Google and the account that started the flow: it is signed and
  // expires in 10 minutes. Never fall back to the current session instead.
  let stateUserId: string;
  try {
    stateUserId = verifyState(state);
  } catch {
    res.statusCode = 403; res.end(JSON.stringify({ error: 'Invalid state' })); return;
  }

  try {
    const result = await exchangeCode(code, callbackUrl());
    const updated = await User.findByIdAndUpdate(stateUserId, {
      $set: {
        'google.sub': result.identity.sub ?? undefined,
        'google.email': result.identity.email ?? undefined,
        'google.refreshToken': encryptRefreshToken(result.refreshToken),
        'google.scopes': result.identity.scopes.length > 0 ? result.identity.scopes : GOOGLE_SCOPES,
        'google.connectedAt': new Date(),
        'google.status': 'ok',
      },
    });
    if (!updated) {
      res.statusCode = 400; res.end(JSON.stringify({ error: 'Unknown user in OAuth state' })); return;
    }
    res.statusCode = 302; res.setHeader('Location', '/profile?google=connected'); res.end('');
  } catch (e) {
    console.error('Google OAuth exchange failed:', e);
    res.statusCode = 502; res.end(JSON.stringify({ error: 'Google exchange failed' }));
  }
}

export async function handleGoogleSync({ req, res, userId }: RouteParams): Promise<void> {
  const account = await getUserGoogleAccount(userId);
  if (!account) {
    res.statusCode = 401; res.end(JSON.stringify({ error: 'Google not connected' })); return;
  }
  const providerName = sanitizeString(req.body.providerName);
  if (!providerName) {
    res.statusCode = 400; res.end(JSON.stringify({ error: 'providerName required' })); return;
  }
  const provider = await Provider.findOne({ userId, name: providerName }).setOptions({ userId }).lean();
  if (!provider) {
    res.statusCode = 404; res.end(JSON.stringify({ error: 'Unknown provider' })); return;
  }
  // Build OAuth client and check it works; on invalid_grant mark reconnect.
  try {
    const client = clientForRefreshToken(account.refresh);
    const gmail = gmailFor(client);
    const query = buildProviderQuery({ senders: provider.senders ?? [], subjectHints: provider.subjectHints ?? [], gmailQuery: provider.gmailQuery ?? null });
    const listRes = await gmail.users.messages.list({ userId: 'me', q: query, maxResults: 20 });
    const messages = listRes.data.messages ?? [];
    const processed = [];
    for (const m of messages) {
      if (!m.id) continue;
      const msgRes = await gmail.users.messages.get({ userId: 'me', id: m.id, format: 'full' });
      const attachments = (msgRes.data.payload ? collectAttachments(msgRes.data.payload) : []);
      const fromAddr = headerValue(msgRes.data.payload ?? null, 'From');
      const subject = headerValue(msgRes.data.payload ?? null, 'Subject');
      const receivedAt = msgRes.data.internalDate ? new Date(Number(msgRes.data.internalDate)) : new Date();
      for (const att of attachments) {
        if (att.attachmentId && !att.inlineData) {
          const attRes = await gmail.users.attachments.get({ userId: 'me', messageId: m.id, id: att.attachmentId });
          if (attRes.data.data) {
            const buffer = Buffer.from(attRes.data.data, 'base64');
            const sha = crypto.createHash('sha256').update(buffer).digest('hex');
            const exists = await ProviderDocument.findOne({ userId, sha256: sha }).setOptions({ userId }).lean();
            if (exists) {
              processed.push({ messageId: m.id, attachment: att.fileName, status: 'already_processed', documentId: exists._id });
              continue;
            }
            const doc = await ProviderDocument.create({
              userId,
              providerId: provider._id,
              source: 'gmail',
              gmailMessageId: m.id,
              gmailAttachmentId: att.attachmentId,
              fileName: att.fileName,
              mimeType: att.mimeType,
              size: att.size ?? buffer.length,
              receivedAt,
              from: fromAddr,
              subject,
              sha256: sha,
              status: 'new',
            });
            processed.push({ messageId: m.id, attachment: att.fileName, status: 'stored', documentId: doc._id.toString() });
          }
        }
      }
    }
    res.statusCode = 200; res.end(JSON.stringify({ processed, count: processed.length, provider: providerName }));
  } catch (e) {
    if (isInvalidGrant(e)) {
      await markReconnectRequired(userId);
      res.statusCode = 409; res.end(JSON.stringify({ error: 'Google authorization expired; reconnect required', reconnect: true }));
    } else {
      console.error('Google sync error:', e);
      res.statusCode = 500; res.end(JSON.stringify({ error: 'Google sync failed' }));
    }
  }
}

// Re-export aliases used by router
export { handleGoogleSync as handleIntakeSync };
export async function handleIntakeVerify({ res }: RouteParams): Promise<void> {
  res.statusCode = 200; res.end(JSON.stringify({ status: 'verify endpoint ready — retry after sync' }));
}
