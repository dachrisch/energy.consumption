import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import {
  describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi,
} from 'vitest';
import User from '../../models/User';
import Provider from '../../models/Provider';
import ProviderDocument from '../../models/ProviderDocument';
import { decrypt, encrypt } from '../../lib/encryption';
import { signState, verifyState } from '../../lib/google/oauth';
import { handleCallback, handleConnect, handleGoogleSync } from './intake.controller';
import type { ApiRequest, ApiResponse, RouteParams } from '../utils';

const env = {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
};

interface MockResponse {
  res: ApiResponse;
  body: () => string;
  header: (name: string) => string | undefined;
}

function mockResponse(): MockResponse {
  const headers: Record<string, string> = {};
  let payload = '';
  const res: ApiResponse = {
    statusCode: 200,
    setHeader(name: string, value: string) {
      headers[name] = value;
    },
    end(data: string) {
      payload = data ?? '';
    },
  };
  return { res, body: () => payload, header: (name) => headers[name] };
}

function params(args: {
  res: ApiResponse;
  userId: string;
  url?: string;
  method?: string;
  body?: Record<string, unknown>;
}): RouteParams {
  const url = args.url ?? 'http://localhost/api/test';
  const parsed = new URL(url, 'http://localhost');
  return {
    req: {
      url: parsed.pathname + parsed.search,
      method: args.method ?? 'GET',
      headers: { cookie: 'token=...' },
      body: args.body ?? {},
    } as ApiRequest,
    res: args.res,
    userId: args.userId,
    path: parsed.pathname,
    url: parsed,
  };
}

function stubExchange(tokens: { access_token?: string; refresh_token?: string }) {
  vi.spyOn(OAuth2Client.prototype, 'getToken').mockResolvedValue({ tokens } as never);
  vi.spyOn(OAuth2Client.prototype, 'getTokenInfo').mockResolvedValue({
    sub: 'google-sub',
    email: 'owner@example.com',
    scopes: ['openid', 'https://www.googleapis.com/auth/gmail.readonly'],
  } as never);
}

const attachmentBytes = Buffer.from('%PDF-1.4 provider bill');

function stubGmail(options: { messages?: { id: string }[]; listError?: Error } = {}) {
  const messages = options.messages ?? [{ id: 'msg-1' }];
  const list = vi.fn();
  if (options.listError) {
    list.mockRejectedValue(options.listError);
  } else {
    list.mockResolvedValue({ data: { messages } });
  }
  const gmail = {
    users: {
      messages: {
        list,
        get: vi.fn().mockResolvedValue({
          data: {
            internalDate: '1700000000000',
            payload: {
              headers: [
                { name: 'From', value: 'Stadtwerke <rechnung@stadtwerke.example>' },
                { name: 'Subject', value: 'Ihre Abrechnung' },
              ],
              parts: [
                {
                  mimeType: 'application/pdf',
                  filename: 'Abrechnung.pdf',
                  body: { attachmentId: 'att-1', size: attachmentBytes.length },
                },
              ],
            },
          },
        }),
      },
      attachments: {
        get: vi.fn().mockResolvedValue({
          data: { data: attachmentBytes.toString('base64'), size: attachmentBytes.length },
        }),
      },
    },
  };
  vi.spyOn(google, 'gmail').mockReturnValue(gmail as never);
  return gmail;
}

describe('intake controller', () => {
  let mongoServer: MongoMemoryServer;
  let ownerId: string;
  let otherId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    process.env.GOOGLE_CLIENT_ID = 'client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'client-secret';
    delete process.env.GOOGLE_CALLBACK_URL;

    const owner = await User.create({ name: 'Owner', email: 'owner@example.com', password: 'x' });
    const other = await User.create({ name: 'Other', email: 'other@example.com', password: 'x' });
    ownerId = owner._id.toString();
    otherId = other._id.toString();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await User.deleteMany({});
    await Provider.deleteMany({});
    await ProviderDocument.deleteMany({});
    for (const [key, value] of Object.entries(env)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  describe('handleConnect', () => {
    it('redirects to Google with a signed state for the session user', async () => {
      const response = mockResponse();

      await handleConnect(params({ res: response.res, userId: ownerId }));

      expect(response.res.statusCode).toBe(302);
      const location = new URL(response.header('Location') ?? '');
      expect(location.host).toBe('accounts.google.com');
      expect(location.searchParams.get('client_id')).toBe('client-id');
      expect(location.searchParams.get('redirect_uri')).toBe('http://localhost:3000/api/google/callback');
      expect(verifyState(location.searchParams.get('state') ?? '')).toBe(ownerId);
    });

    it('reports missing credentials instead of redirecting', async () => {
      delete process.env.GOOGLE_CLIENT_ID;
      const response = mockResponse();

      await handleConnect(params({ res: response.res, userId: ownerId }));

      expect(response.res.statusCode).toBe(501);
      expect(response.body()).toContain('GOOGLE_CLIENT_ID');
    });
  });

  describe('handleCallback', () => {
    it('rejects a callback without code or state', async () => {
      const response = mockResponse();

      await handleCallback(params({ res: response.res, userId: ownerId, url: '/api/google/callback?code=abc' }));

      expect(response.res.statusCode).toBe(400);
    });

    it('rejects a state that is not signed by this app', async () => {
      const response = mockResponse();

      await handleCallback(params({
        res: response.res,
        userId: ownerId,
        url: '/api/google/callback?code=abc&state=forged',
      }));

      expect(response.res.statusCode).toBe(403);
    });

    it('stores the encrypted refresh token on the user named in the state', async () => {
      stubExchange({ access_token: 'access', refresh_token: 'refresh-token' });
      const response = mockResponse();
      const state = signState(ownerId);

      await handleCallback(params({
        res: response.res,
        // The session differs from the state on purpose: the state decides.
        userId: otherId,
        url: `/api/google/callback?code=auth-code&state=${encodeURIComponent(state)}`,
      }));

      expect(response.res.statusCode).toBe(302);
      expect(response.header('Location')).toBe('/profile?google=connected');

      const owner = await User.findById(ownerId).lean();
      const other = await User.findById(otherId).lean();
      expect(owner?.google?.refreshToken).toBeTruthy();
      expect(decrypt(owner?.google?.refreshToken ?? '')).toBe('refresh-token');
      expect(owner?.google?.status).toBe('ok');
      expect(owner?.google?.email).toBe('owner@example.com');
      expect(other?.google).toBeFalsy();
    });

    it('falls back to the requested scopes when Google reports none', async () => {
      vi.spyOn(OAuth2Client.prototype, 'getToken')
        .mockResolvedValue({ tokens: { access_token: 'access', refresh_token: 'refresh-token' } } as never);
      vi.spyOn(OAuth2Client.prototype, 'getTokenInfo').mockResolvedValue({} as never);
      const response = mockResponse();

      await handleCallback(params({
        res: response.res,
        userId: ownerId,
        url: `/api/google/callback?code=auth-code&state=${encodeURIComponent(signState(ownerId))}`,
      }));

      const owner = await User.findById(ownerId).lean();
      expect(owner?.google?.scopes).toContain('https://www.googleapis.com/auth/gmail.readonly');
      expect(owner?.google?.scopes).toContain('https://www.googleapis.com/auth/drive.file');
    });

    it('reports an exchange failure and leaves the account untouched', async () => {
      vi.spyOn(OAuth2Client.prototype, 'getToken').mockRejectedValue(new Error('boom'));
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const response = mockResponse();

      await handleCallback(params({
        res: response.res,
        userId: ownerId,
        url: `/api/google/callback?code=auth-code&state=${encodeURIComponent(signState(ownerId))}`,
      }));

      expect(response.res.statusCode).toBe(502);
      const owner = await User.findById(ownerId).lean();
      expect(owner?.google).toBeFalsy();
    });

    it('rejects a state that names a user which no longer exists', async () => {
      stubExchange({ access_token: 'access', refresh_token: 'refresh-token' });
      const response = mockResponse();
      const deletedUserId = new mongoose.Types.ObjectId().toString();

      await handleCallback(params({
        res: response.res,
        userId: ownerId,
        url: `/api/google/callback?code=auth-code&state=${encodeURIComponent(signState(deletedUserId))}`,
      }));

      expect(response.res.statusCode).toBe(400);
      const owner = await User.findById(ownerId).lean();
      expect(owner?.google).toBeFalsy();
    });
  });

  describe('handleGoogleSync', () => {
    beforeEach(async () => {
      await User.findByIdAndUpdate(ownerId, {
        $set: {
          'google.refreshToken': encrypt('refresh-token'),
          'google.status': 'ok',
        },
      });
      await Provider.create({
        userId: ownerId,
        name: 'Stadtwerke',
        senders: ['rechnung@stadtwerke.example'],
        subjectHints: [],
      });
    });

    it('requires a connected Google account', async () => {
      const response = mockResponse();

      await handleGoogleSync(params({
        res: response.res,
        userId: otherId,
        method: 'POST',
        body: { providerName: 'Stadtwerke' },
      }));

      expect(response.res.statusCode).toBe(401);
    });

    it('requires a provider name and an existing provider', async () => {
      const missing = mockResponse();
      await handleGoogleSync(params({ res: missing.res, userId: ownerId, method: 'POST', body: {} }));
      expect(missing.res.statusCode).toBe(400);

      const unknown = mockResponse();
      await handleGoogleSync(params({
        res: unknown.res,
        userId: ownerId,
        method: 'POST',
        body: { providerName: 'Unknown' },
      }));
      expect(unknown.res.statusCode).toBe(404);
    });

    it('stores attachment metadata and is idempotent across syncs', async () => {
      stubGmail();

      const first = mockResponse();
      await handleGoogleSync(params({
        res: first.res,
        userId: ownerId,
        method: 'POST',
        body: { providerName: 'Stadtwerke' },
      }));

      expect(first.res.statusCode).toBe(200);
      const firstPayload = JSON.parse(first.body()) as {
        count: number;
        processed: { status: string; attachment: string; documentId: string }[];
      };
      expect(firstPayload.count).toBe(1);
      expect(firstPayload.processed[0]).toMatchObject({ status: 'stored', attachment: 'Abrechnung.pdf' });

      const stored = await ProviderDocument.findOne({ userId: ownerId }).lean();
      expect(stored?.fileName).toBe('Abrechnung.pdf');
      expect(stored?.subject).toBe('Ihre Abrechnung');
      expect(stored?.from).toContain('stadtwerke.example');
      expect(stored?.source).toBe('gmail');
      expect(stored?.size).toBe(attachmentBytes.length);

      const second = mockResponse();
      await handleGoogleSync(params({
        res: second.res,
        userId: ownerId,
        method: 'POST',
        body: { providerName: 'Stadtwerke' },
      }));

      const secondPayload = JSON.parse(second.body()) as { processed: { status: string }[] };
      expect(secondPayload.processed[0].status).toBe('already_processed');
      expect(await ProviderDocument.countDocuments({ userId: ownerId })).toBe(1);
    });

    it('marks the account for reconnection when Google rejects the refresh token', async () => {
      stubGmail({
        listError: Object.assign(new Error('invalid_grant'), {
          response: { data: { error: 'invalid_grant' } },
        }),
      });
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const response = mockResponse();

      await handleGoogleSync(params({
        res: response.res,
        userId: ownerId,
        method: 'POST',
        body: { providerName: 'Stadtwerke' },
      }));

      expect(response.res.statusCode).toBe(409);
      const owner = await User.findById(ownerId).lean();
      expect(owner?.google?.status).toBe('reconnect_required');
    });
  });
});
