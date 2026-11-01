import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import {
  describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi,
} from 'vitest';
import User from '../../models/User';
import ProviderDocument from '../../models/ProviderDocument';
import IntakeItem from '../../models/IntakeItem';
import Bill from '../../models/Bill';
import Reading from '../../models/Reading';
import Meter from '../../models/Meter';
import Contract from '../../models/Contract';
import { FOLDER_MIME } from '../../lib/google/drive';
import { decrypt, encrypt } from '../../lib/encryption';
import { signState, verifyState } from '../../lib/google/oauth';
import {
  handleCallback, handleConnect, handleGoogleSync, handleIntakeBills, handleIntakeDocuments,
  handleIntakeItemAction, handleIntakeItems, handleProviders,
} from './intake.controller';
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

const pdfBytes = Buffer.from('%PDF-1.4 provider bill');
const csvBytes = Buffer.from('Datum;Wert\n01.01.2024;500\n01.02.2024;620');

interface StubFile {
  name: string;
  mimeType: string;
  bytes: Buffer;
}

function stubGmail(options: { messages?: { id: string }[]; listError?: Error; files?: StubFile[] } = {}) {
  const messages = options.messages ?? [{ id: 'msg-1' }];
  const files = options.files ?? [{ name: 'Abrechnung.pdf', mimeType: 'application/pdf', bytes: pdfBytes }];
  const list = vi.fn();
  if (options.listError) {
    list.mockRejectedValue(options.listError);
  } else {
    list.mockResolvedValue({ data: { messages } });
  }
  const attachmentsById = new Map(files.map((file, index) => [`att-${index + 1}`, file]));
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
              parts: files.map((file, index) => ({
                mimeType: file.mimeType,
                filename: file.name,
                body: { attachmentId: `att-${index + 1}`, size: file.bytes.length },
              })),
            },
          },
        }),
      },
      attachments: {
        get: vi.fn(async ({ id }: { id: string }) => {
          const file = attachmentsById.get(id);
          if (!file) {
            throw new Error(`unknown attachment ${id}`);
          }
          return { data: { data: file.bytes.toString('base64'), size: file.bytes.length } };
        }),
      },
    },
  };
  vi.spyOn(google, 'gmail').mockReturnValue(gmail as never);
  return gmail;
}

/** In-memory Drive: folders are created, uploads are recorded. */
function stubDrive() {
  let counter = 0;
  const folders: { id: string; name: string; parentId?: string }[] = [];
  const uploads: { name: string; mimeType: string; body: Buffer | string }[] = [];
  const drive = {
    files: {
      list: vi.fn(async () => ({ data: { files: [] } })),
      create: vi.fn(async (request: {
        requestBody: { name: string; mimeType?: string; parents?: string[] };
        media: { mimeType: string; body: Buffer | string };
      }) => {
        counter += 1;
        const id = `drive-${counter}`;
        if (request.requestBody.mimeType === FOLDER_MIME) {
          folders.push({ id, name: request.requestBody.name, parentId: request.requestBody.parents?.[0] });
        } else {
          uploads.push({ name: request.requestBody.name, mimeType: request.media.mimeType, body: request.media.body });
        }
        return { data: { id, webViewLink: `https://drive.example/${id}` } };
      }),
      get: vi.fn(async () => ({ data: Buffer.alloc(0) })),
    },
  };
  vi.spyOn(google, 'drive').mockReturnValue(drive as never);
  return { drive, folders, uploads };
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
    await ProviderDocument.deleteMany({});
    await IntakeItem.deleteMany({});
    await Bill.deleteMany({});
    await Reading.deleteMany({});
    await Meter.deleteMany({});
    await Contract.deleteMany({});
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
      const meter = await Meter.create({
        name: 'Strom', meterNumber: '1-234-567', type: 'power', unit: 'kWh', userId: ownerId,
      });
      await Contract.create({
        providerName: 'Stadtwerke',
        startDate: new Date('2024-01-01'),
        endDate: null,
        basePrice: 12,
        workingPrice: 0.3,
        meterId: meter._id,
        senders: ['rechnung@stadtwerke.example'],
        subjectHints: [],
        userId: ownerId,
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

    it('refuses to sync a provider without sender addresses', async () => {
      await Contract.updateMany({}, { $set: { senders: [], subjectHints: [], gmailQuery: null } }).setOptions({ userId: ownerId });
      const gmail = stubGmail();
      const response = mockResponse();

      await handleGoogleSync(params({
        res: response.res,
        userId: ownerId,
        method: 'POST',
        body: { providerName: 'Stadtwerke' },
      }));

      expect(response.res.statusCode).toBe(400);
      expect(response.body()).toContain('Add sender addresses');
      expect(gmail.users.messages.list).not.toHaveBeenCalled();
    });

    it('records a failed document when extraction cannot run, and is idempotent', async () => {
      stubGmail();
      stubDrive();
      vi.spyOn(console, 'error').mockImplementation(() => {});

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
        processed: { status: string; attachment: string; documentId: string; error?: string }[];
      };
      // A PDF needs a Gemini key; without one the document fails, nothing throws.
      expect(firstPayload.count).toBe(1);
      expect(firstPayload.processed[0]).toMatchObject({ status: 'failed', attachment: 'Abrechnung.pdf' });
      expect(firstPayload.processed[0].error).toMatch(/Gemini API key/);

      const stored = await ProviderDocument.findOne({ userId: ownerId }).lean();
      expect(stored?.fileName).toBe('Abrechnung.pdf');
      expect(stored?.subject).toBe('Ihre Abrechnung');
      expect(stored?.from).toContain('stadtwerke.example');
      expect(stored?.source).toBe('gmail');
      expect(stored?.size).toBe(pdfBytes.length);
      expect(stored?.status).toBe('failed');
      expect(stored?.error).toMatch(/Gemini API key/);

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

    it('extracts a CSV attachment into IntakeItems and archives it to Drive', async () => {
      stubGmail({ files: [{ name: 'lastgang.csv', mimeType: 'text/csv', bytes: csvBytes }] });
      const drive = stubDrive();

      const response = mockResponse();
      await handleGoogleSync(params({
        res: response.res,
        userId: ownerId,
        method: 'POST',
        body: { providerName: 'Stadtwerke' },
      }));

      expect(response.res.statusCode).toBe(200);
      const payload = JSON.parse(response.body()) as {
        count: number;
        processed: { status: string; intakeItemIds: string[]; driveFileId?: string }[];
      };
      expect(payload.count).toBe(1);
      expect(payload.processed[0].status).toBe('parsed');
      expect(payload.processed[0].intakeItemIds).toHaveLength(2);
      expect(payload.processed[0].driveFileId).toBeTruthy();

      const document = await ProviderDocument.findOne({ userId: ownerId }).lean();
      expect(document?.status).toBe('parsed');
      expect(document?.driveFileId).toBeTruthy();
      expect(document?.processedAt).toBeInstanceOf(Date);

      const items = await IntakeItem.find({ userId: ownerId }).lean();
      expect(items).toHaveLength(2);
      expect(items.map((item) => item.value).sort()).toEqual([500, 620]);
      // No meter number in the CSV → the user has to link a meter later.
      expect(items.every((item) => item.status === 'pending')).toBe(true);
      expect(items.every((item) => item.meterId === undefined)).toBe(true);

      // Provider folders plus the original document and its JSON sidecar.
      expect(drive.uploads.map((upload) => upload.name)).toEqual(['lastgang.csv', 'lastgang.csv.json']);
      expect(JSON.parse(drive.uploads[1].body as string)).toHaveProperty('readings');

      const owner = await User.findById(ownerId).lean();
      expect(owner?.google?.rootFolderId).toBeTruthy();
      expect(owner?.google?.lastSyncAt).toBeInstanceOf(Date);
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

  describe('intake items', () => {
    async function createMeter() {
      return Meter.create({
        name: 'Strom', meterNumber: '1-234-567', type: 'power', unit: 'kWh', userId: ownerId,
      });
    }

    async function createItem(overrides: Record<string, unknown> = {}) {
      return IntakeItem.create({
        documentId: new mongoose.Types.ObjectId(),
        kind: 'reading',
        date: new Date('2024-01-01'),
        value: 500,
        unit: 'kWh',
        status: 'pending',
        userId: ownerId,
        ...overrides,
      });
    }

    it('lists the user\'s items and filters by status', async () => {
      await createItem({ status: 'pending' });
      await createItem({ status: 'rejected', date: new Date('2024-02-01') });
      await IntakeItem.create({
        documentId: new mongoose.Types.ObjectId(),
        kind: 'reading',
        status: 'pending',
        userId: otherId,
      });

      const all = mockResponse();
      await handleIntakeItems(params({ res: all.res, userId: ownerId }));
      expect(JSON.parse(all.body()).count).toBe(2);

      const pending = mockResponse();
      await handleIntakeItems(params({
        res: pending.res,
        userId: ownerId,
        url: '/api/intake/items?status=pending,conflict',
      }));
      const payload = JSON.parse(pending.body()) as { count: number; items: { status: string }[] };
      expect(payload.count).toBe(1);
      expect(payload.items[0].status).toBe('pending');
    });

    it('promotes an accepted reading with source "provider"', async () => {
      const meter = await createMeter();
      const item = await createItem({ meterId: meter._id });
      const response = mockResponse();

      await handleIntakeItemAction(params({
        res: response.res,
        userId: ownerId,
        method: 'POST',
        url: `/api/intake/items/${item._id.toString()}/accept`,
      }));

      expect(response.res.statusCode).toBe(200);
      const readings = await Reading.find({ userId: ownerId }).lean();
      expect(readings).toHaveLength(1);
      expect(readings[0]).toMatchObject({ value: 500, source: 'provider' });
      expect(String(readings[0].meterId)).toBe(meter._id.toString());

      const updated = await IntakeItem.findById(item._id).lean();
      expect(updated?.status).toBe('accepted');
    });

    it('refuses to accept an item whose meter number is unknown', async () => {
      const item = await createItem();
      const response = mockResponse();

      await handleIntakeItemAction(params({
        res: response.res,
        userId: ownerId,
        method: 'POST',
        url: `/api/intake/items/${item._id.toString()}/accept`,
      }));

      expect(response.res.statusCode).toBe(409);
      expect(await Reading.countDocuments({ userId: ownerId })).toBe(0);
    });

    it('refuses to accept the same item twice or when the date already exists', async () => {
      const meter = await createMeter();
      const item = await createItem({ meterId: meter._id, status: 'accepted' });
      const acceptedAgain = mockResponse();
      await handleIntakeItemAction(params({
        res: acceptedAgain.res,
        userId: ownerId,
        method: 'POST',
        url: `/api/intake/items/${item._id.toString()}/accept`,
      }));
      expect(acceptedAgain.res.statusCode).toBe(409);

      await Reading.create({
        meterId: meter._id, date: new Date('2024-03-01'), value: 1, source: 'manual', userId: ownerId,
      });
      const conflicting = await createItem({ meterId: meter._id, date: new Date('2024-03-01'), status: 'conflict' });
      const duplicate = mockResponse();
      await handleIntakeItemAction(params({
        res: duplicate.res,
        userId: ownerId,
        method: 'POST',
        url: `/api/intake/items/${conflicting._id.toString()}/accept`,
      }));
      expect(duplicate.res.statusCode).toBe(409);
      expect(duplicate.body()).toContain('already exists');
    });

    it('keeps items private to their owner', async () => {
      const meter = await createMeter();
      const item = await createItem({ meterId: meter._id });
      const response = mockResponse();

      await handleIntakeItemAction(params({
        res: response.res,
        userId: otherId,
        method: 'POST',
        url: `/api/intake/items/${item._id.toString()}/accept`,
      }));

      expect(response.res.statusCode).toBe(404);
      expect((await IntakeItem.findById(item._id).lean())?.status).toBe('pending');
    });

    it('rejects without writing a reading', async () => {
      const meter = await createMeter();
      const item = await createItem({ meterId: meter._id });
      const response = mockResponse();

      await handleIntakeItemAction(params({
        res: response.res,
        userId: ownerId,
        method: 'POST',
        url: `/api/intake/items/${item._id.toString()}/reject`,
      }));

      expect(response.res.statusCode).toBe(200);
      expect((await IntakeItem.findById(item._id).lean())?.status).toBe('rejected');
      expect(await Reading.countDocuments({ userId: ownerId })).toBe(0);
    });

    it('rejects malformed ids, unknown actions and non-POST requests', async () => {
      const badId = mockResponse();
      await handleIntakeItemAction(params({
        res: badId.res, userId: ownerId, method: 'POST', url: '/api/intake/items/not-an-id/accept',
      }));
      expect(badId.res.statusCode).toBe(404);

      const item = await createItem();
      const unknownAction = mockResponse();
      await handleIntakeItemAction(params({
        res: unknownAction.res,
        userId: ownerId,
        method: 'POST',
        url: `/api/intake/items/${item._id.toString()}/archive`,
      }));
      expect(unknownAction.res.statusCode).toBe(404);

      const wrongMethod = mockResponse();
      await handleIntakeItemAction(params({
        res: wrongMethod.res,
        userId: ownerId,
        method: 'GET',
        url: `/api/intake/items/${item._id.toString()}/accept`,
      }));
      expect(wrongMethod.res.statusCode).toBe(405);
    });
  });

  describe('bill comparison data', () => {
    it('computes the expected cost and variance from the meter contract', async () => {
      const meter = await Meter.create({
        name: 'Strom', meterNumber: '1-234-567', type: 'power', unit: 'kWh', userId: ownerId,
      });
      await Contract.create({
        providerName: 'Stadtwerke',
        startDate: new Date('2024-01-01'),
        endDate: null,
        basePrice: 12,
        workingPrice: 0.3,
        meterId: meter._id,
        userId: ownerId,
      });
      await Bill.create({
        meterId: meter._id,
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-03-31'),
        consumption: 100,
        amountGross: 50,
        currency: 'EUR',
        userId: ownerId,
      });

      const response = mockResponse();
      await handleIntakeBills(params({ res: response.res, userId: ownerId }));

      const payload = JSON.parse(response.body()) as {
        count: number;
        bills: { expected: number; variance: { absolute: number; percent: number } }[];
      };
      expect(payload.count).toBe(1);
      // 12 EUR/month over 90 days + 0.3 EUR/kWh * 100 kWh
      expect(payload.bills[0].expected).toBeCloseTo(65.48, 1);
      expect(payload.bills[0].variance.absolute).toBeCloseTo(-15.48, 1);
      expect(payload.bills[0].variance.percent).toBeCloseTo(-23.64, 1);
    });

    it('leaves expected and variance empty without a contract', async () => {
      const meter = await Meter.create({
        name: 'Gas', meterNumber: '9-999', type: 'gas', unit: 'm³', userId: ownerId,
      });
      await Bill.create({
        meterId: meter._id,
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-03-31'),
        consumption: 100,
        amountGross: 50,
        userId: ownerId,
      });

      const response = mockResponse();
      await handleIntakeBills(params({ res: response.res, userId: ownerId }));

      const payload = JSON.parse(response.body()) as {
        bills: { expected: number | null; variance: number | null }[];
      };
      expect(payload.bills[0].expected).toBeNull();
      expect(payload.bills[0].variance).toBeNull();
    });
  });

  describe('providers (derived from contracts)', () => {
    let meterCounter = 0;

    async function createContract(overrides: Record<string, unknown> = {}) {
      meterCounter += 1;
      const meter = await Meter.create({
        name: 'Strom', meterNumber: `1-234-${600 + meterCounter}`, type: 'power', unit: 'kWh', userId: ownerId,
      });
      return Contract.create({
        providerName: 'Stadtwerke',
        startDate: new Date('2024-01-01'),
        endDate: null,
        basePrice: 12,
        workingPrice: 0.3,
        meterId: meter._id,
        senders: ['rechnung@stadtwerke.example'],
        subjectHints: ['Abrechnung'],
        userId: ownerId,
        ...overrides,
      });
    }

    it('is derived from the contracts, one entry per provider name', async () => {
      await createContract();
      await createContract({ startDate: new Date('2024-06-01'), senders: ['neu@stadtwerke.example'] });
      await createContract({ providerName: 'Netz AG', senders: ['info@netz.example'] });

      const response = mockResponse();
      await handleProviders(params({ res: response.res, userId: ownerId }));

      const payload = JSON.parse(response.body()) as {
        count: number;
        providers: { name: string; senders: string[]; contractCount: number; unit?: string }[];
      };
      expect(payload.count).toBe(2);
      const stadtwerke = payload.providers.find((provider) => provider.name === 'Stadtwerke');
      expect(stadtwerke?.contractCount).toBe(2);
      // Settings are read as the union over the provider's contracts.
      expect(stadtwerke?.senders).toEqual(['neu@stadtwerke.example', 'rechnung@stadtwerke.example']);
      expect(stadtwerke?.unit).toBe('kWh');
    });

    it('has no providers before a contract exists', async () => {
      const response = mockResponse();
      await handleProviders(params({ res: response.res, userId: ownerId }));

      expect(JSON.parse(response.body()).count).toBe(0);
    });

    it('does not leak another user\'s providers', async () => {
      const foreignMeter = await Meter.create({
        name: 'Gas', meterNumber: '9-999', type: 'gas', unit: 'm³', userId: otherId,
      });
      await Contract.create({
        providerName: 'Fremd AG',
        startDate: new Date('2024-01-01'),
        endDate: null,
        basePrice: 1,
        workingPrice: 1,
        meterId: foreignMeter._id,
        senders: ['x@fremd.example'],
        userId: otherId,
      });

      const response = mockResponse();
      await handleProviders(params({ res: response.res, userId: ownerId }));
      expect(JSON.parse(response.body()).count).toBe(0);
    });

    it('writes mail settings onto every contract of that provider', async () => {
      const first = await createContract();
      const second = await createContract({ startDate: new Date('2024-06-01') });

      const response = mockResponse();
      await handleProviders(params({
        res: response.res,
        userId: ownerId,
        method: 'PATCH',
        body: {
          providerName: 'Stadtwerke',
          senders: ['mail@stadtwerke.example'],
          subjectHints: ['Jahresabrechnung'],
          gmailQuery: null,
        },
      }));

      expect(response.res.statusCode).toBe(200);
      const payload = JSON.parse(response.body()) as { contractsUpdated: number; provider: { senders: string[] } };
      expect(payload.contractsUpdated).toBe(2);
      expect(payload.provider.senders).toEqual(['mail@stadtwerke.example']);

      const stored = await Contract.find({ providerName: 'Stadtwerke' }).setOptions({ userId: ownerId }).lean();
      expect(stored).toHaveLength(2);
      expect(stored.every((contract) => contract.senders[0] === 'mail@stadtwerke.example')).toBe(true);
      expect([first, second].every((contract) => contract.senders.length === 1)).toBe(true);
    });

    it('validates the settings payload and unknown providers', async () => {
      await createContract();

      const missingName = mockResponse();
      await handleProviders(params({
        res: missingName.res, userId: ownerId, method: 'PATCH',
        body: { senders: [], subjectHints: [] },
      }));
      expect(missingName.res.statusCode).toBe(400);

      const unknownField = mockResponse();
      await handleProviders(params({
        res: unknownField.res, userId: ownerId, method: 'PATCH',
        body: { providerName: 'Stadtwerke', senders: [], subjectHints: [], userId: otherId },
      }));
      expect(unknownField.res.statusCode).toBe(400);

      const unknownProvider = mockResponse();
      await handleProviders(params({
        res: unknownProvider.res, userId: ownerId, method: 'PATCH',
        body: { providerName: 'Niemand', senders: [], subjectHints: [] },
      }));
      expect(unknownProvider.res.statusCode).toBe(404);
    });

    it('rejects unsupported methods', async () => {
      const response = mockResponse();
      await handleProviders(params({ res: response.res, userId: ownerId, method: 'DELETE' }));
      expect(response.res.statusCode).toBe(405);
    });
  });

  describe('documents', () => {
    it('lists the newest documents first, capped by limit, per user', async () => {
      await ProviderDocument.create([
        {
          userId: ownerId, source: 'gmail', fileName: 'old.csv', mimeType: 'text/csv',
          sha256: 'a', receivedAt: new Date('2024-01-01'), status: 'parsed',
        },
        {
          userId: ownerId, source: 'gmail', fileName: 'new.csv', mimeType: 'text/csv',
          sha256: 'b', receivedAt: new Date('2024-06-01'), status: 'failed', error: 'boom',
        },
        {
          userId: otherId, source: 'gmail', fileName: 'other.csv', mimeType: 'text/csv',
          sha256: 'c', receivedAt: new Date('2024-07-01'),
        },
      ]);

      const response = mockResponse();
      await handleIntakeDocuments(params({ res: response.res, userId: ownerId, url: '/api/intake/documents' }));
      const payload = JSON.parse(response.body()) as {
        count: number;
        documents: { fileName: string; error?: string }[];
      };
      expect(payload.count).toBe(2);
      expect(payload.documents[0].fileName).toBe('new.csv');
      expect(payload.documents[0].error).toBe('boom');

      const limited = mockResponse();
      await handleIntakeDocuments(params({ res: limited.res, userId: ownerId, url: '/api/intake/documents?limit=1' }));
      expect(JSON.parse(limited.body()).count).toBe(1);
    });
  });
});
