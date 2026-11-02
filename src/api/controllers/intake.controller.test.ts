import crypto from 'node:crypto';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { google } from 'googleapis';
import type { Readable } from 'node:stream';
import { OAuth2Client } from 'google-auth-library';
import {
  describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi,
} from 'vitest';
import User from '../../models/User';
import ProviderDocument from '../../models/ProviderDocument';
import Supplier from '../../models/Supplier';
import Bill from '../../models/Bill';
import Reading from '../../models/Reading';
import Meter from '../../models/Meter';
import Contract from '../../models/Contract';
import { FOLDER_MIME } from '../../lib/google/drive';
import { decrypt, encrypt } from '../../lib/encryption';
import { signState, verifyState } from '../../lib/google/oauth';
import {
  handleCallback, handleConnect, handleGoogleSync, handleIntakeArchive, handleIntakeBills,
  handleIntakeDocumentAction, handleIntakeDocuments, handleIntakeItemAction, handleIntakeItemLink,
  handleIntakeItems,
} from './intake.controller';
import { handleSuppliers, handleSupplierItem } from './supplier.controller';
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
        // Same nesting as googleapis: users.messages.attachments.get
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
    },
  };
  vi.spyOn(google, 'gmail').mockReturnValue(gmail as never);
  return gmail;
}

/** In-memory Drive: folders are created, uploads are recorded. */
function stubDrive() {
  let counter = 0;
  const folders: { id: string; name: string; parentId?: string }[] = [];
  const uploads: { name: string; mimeType: string; body: Buffer | string | Readable }[] = [];
  const drive = {
    files: {
      list: vi.fn(async () => ({ data: { files: [] } })),
      create: vi.fn(async (request: {
        requestBody: { name: string; mimeType?: string; parents?: string[] };
        media: { mimeType: string; body: Buffer | string | Readable };
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
  let supplierId: string;

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
    await Supplier.deleteMany({});
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
      expect(response.header('Location')).toBe('/intake?google=connected');

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
      const supplier = await Supplier.create({
        name: 'Stadtwerke',
        nameKey: 'stadtwerke',
        senders: ['rechnung@stadtwerke.example'],
        subjectHints: [],
        userId: ownerId,
      });
      supplierId = supplier._id.toString();
      await Contract.create({
        supplierId: supplier._id,
        providerName: 'Stadtwerke',
        startDate: new Date('2024-01-01'),
        endDate: null,
        basePrice: 12,
        workingPrice: 0.3,
        meterId: meter._id,
        userId: ownerId,
      });
    });

    it('requires a connected Google account', async () => {
      const response = mockResponse();

      await handleGoogleSync(params({
        res: response.res,
        userId: otherId,
        method: 'POST',
        body: { supplierId },
      }));

      expect(response.res.statusCode).toBe(401);
    });

    it('requires a supplier id and an existing supplier', async () => {
      const missing = mockResponse();
      await handleGoogleSync(params({ res: missing.res, userId: ownerId, method: 'POST', body: {} }));
      expect(missing.res.statusCode).toBe(400);

      const unknown = mockResponse();
      await handleGoogleSync(params({
        res: unknown.res,
        userId: ownerId,
        method: 'POST',
        body: { supplierId: new mongoose.Types.ObjectId().toString() },
      }));
      expect(unknown.res.statusCode).toBe(404);
    });

    it('refuses to sync a supplier without sender addresses', async () => {
      await Supplier.updateOne(
        { _id: supplierId },
        { $set: { senders: [], subjectHints: [], gmailQuery: null } },
      ).setOptions({ userId: ownerId });
      const gmail = stubGmail();
      const response = mockResponse();

      await handleGoogleSync(params({
        res: response.res,
        userId: ownerId,
        method: 'POST',
        body: { supplierId },
      }));

      expect(response.res.statusCode).toBe(400);
      expect(response.body()).toContain('Add sender addresses');
      expect(gmail.users.messages.list).not.toHaveBeenCalled();
    });

    it('records a failed document when extraction cannot run, and is idempotent', async () => {
      stubGmail();
      const drive = stubDrive();
      vi.spyOn(console, 'error').mockImplementation(() => {});

      const first = mockResponse();
      await handleGoogleSync(params({
        res: first.res,
        userId: ownerId,
        method: 'POST',
        body: { supplierId },
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
      // Only parsed documents are archived; a failed one stays out of Drive.
      expect(stored?.driveFileId).toBeUndefined();
      expect(drive.uploads).toHaveLength(0);

      const second = mockResponse();
      await handleGoogleSync(params({
        res: second.res,
        userId: ownerId,
        method: 'POST',
        body: { supplierId },
      }));

      // A failed document is retried on the next sync, reusing the same record.
      const secondPayload = JSON.parse(second.body()) as { processed: { status: string; documentId: string }[] };
      expect(secondPayload.processed[0].status).toBe('failed');
      expect(secondPayload.processed[0].documentId).toBe(firstPayload.processed[0].documentId);
      expect(await ProviderDocument.countDocuments({ userId: ownerId })).toBe(1);
      expect(drive.uploads).toHaveLength(0);
    });

    it('does not process a successfully parsed document twice', async () => {
      stubGmail({ files: [{ name: 'lastgang.csv', mimeType: 'text/csv', bytes: csvBytes }] });
      stubDrive();
      const sync = async () => {
        const response = mockResponse();
        await handleGoogleSync(params({
          res: response.res, userId: ownerId, method: 'POST', body: { supplierId },
        }));
        return JSON.parse(response.body()) as { processed: { status: string }[] };
      };

      expect((await sync()).processed[0].status).toBe('parsed');
      expect((await sync()).processed[0].status).toBe('already_processed');
      const stored = await ProviderDocument.findOne({ userId: ownerId }).lean();
      expect(stored?.facts).toHaveLength(2);
    });

    it('claims an existing unassigned document for the synced supplier without reprocessing it', async () => {
      const existing = await ProviderDocument.create({
        userId: ownerId,
        providerName: 'Legacy Provider',
        source: 'gmail',
        fileName: 'lastgang.csv',
        mimeType: 'text/csv',
        size: csvBytes.length,
        receivedAt: new Date(),
        sha256: crypto.createHash('sha256').update(csvBytes).digest('hex'),
        status: 'parsed',
      });
      stubGmail({ files: [{ name: 'lastgang.csv', mimeType: 'text/csv', bytes: csvBytes }] });
      stubDrive();
      const response = mockResponse();

      await handleGoogleSync(params({
        res: response.res, userId: ownerId, method: 'POST', body: { supplierId },
      }));

      const payload = JSON.parse(response.body()) as { processed: { status: string }[] };
      expect(payload.processed[0].status).toBe('already_processed');
      const stored = await ProviderDocument.findById(existing._id).lean();
      expect(stored?.supplierId?.toString()).toBe(supplierId);
      // The original name stays as a display snapshot.
      expect(stored?.providerName).toBe('Legacy Provider');
    });

    it('does not steal a document already filed under another supplier', async () => {
      const otherSupplier = await Supplier.create({
        name: 'Anderer Versorger',
        nameKey: 'anderer versorger',
        senders: ['mail@anderer.example'],
        userId: ownerId,
      });
      const existing = await ProviderDocument.create({
        userId: ownerId,
        supplierId: otherSupplier._id,
        providerName: 'Anderer Versorger',
        source: 'gmail',
        fileName: 'lastgang.csv',
        mimeType: 'text/csv',
        size: csvBytes.length,
        receivedAt: new Date(),
        sha256: crypto.createHash('sha256').update(csvBytes).digest('hex'),
        status: 'parsed',
      });
      stubGmail({ files: [{ name: 'lastgang.csv', mimeType: 'text/csv', bytes: csvBytes }] });
      stubDrive();

      await handleGoogleSync(params({
        res: mockResponse().res, userId: ownerId, method: 'POST', body: { supplierId },
      }));

      const stored = await ProviderDocument.findById(existing._id).lean();
      expect(stored?.supplierId?.toString()).toBe(otherSupplier._id.toString());
    });

    it('treats a .pdf sent as application/octet-stream as a PDF', async () => {
      stubGmail({ files: [{ name: 'Rechnung_433876866.pdf', mimeType: 'application/octet-stream', bytes: pdfBytes }] });
      stubDrive();
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const response = mockResponse();

      await handleGoogleSync(params({
        res: response.res, userId: ownerId, method: 'POST', body: { supplierId },
      }));

      const payload = JSON.parse(response.body()) as { processed: { status: string; error?: string }[] };
      // It gets past the format gate and reaches PDF extraction (which needs a Gemini key).
      expect(payload.processed[0].error).not.toBe('unsupported format');
      expect(payload.processed[0].error).toMatch(/Gemini API key/);
      const stored = await ProviderDocument.findOne({ userId: ownerId }).lean();
      expect(stored?.mimeType).toBe('application/pdf');
    });

    it('retries a document that failed earlier and clears the old error', async () => {
      await ProviderDocument.create({
        userId: ownerId,
        providerName: 'Stadtwerke',
        source: 'gmail',
        fileName: 'lastgang.csv',
        mimeType: 'application/octet-stream',
        size: csvBytes.length,
        receivedAt: new Date(),
        sha256: crypto.createHash('sha256').update(csvBytes).digest('hex'),
        status: 'failed',
        error: 'unsupported format',
      });
      stubGmail({ files: [{ name: 'lastgang.csv', mimeType: 'application/octet-stream', bytes: csvBytes }] });
      stubDrive();
      const response = mockResponse();

      await handleGoogleSync(params({
        res: response.res, userId: ownerId, method: 'POST', body: { supplierId },
      }));

      const payload = JSON.parse(response.body()) as { processed: { status: string }[] };
      expect(payload.processed[0].status).toBe('parsed');
      expect(await ProviderDocument.countDocuments({ userId: ownerId })).toBe(1);
      const stored = await ProviderDocument.findOne({ userId: ownerId }).lean();
      expect(stored?.status).toBe('parsed');
      expect(stored?.mimeType).toBe('text/csv');
      expect(stored?.error).toBeUndefined();
    });

    it('extracts a CSV attachment into IntakeItems and archives it to Drive', async () => {
      stubGmail({ files: [{ name: 'lastgang.csv', mimeType: 'text/csv', bytes: csvBytes }] });
      const drive = stubDrive();

      const response = mockResponse();
      await handleGoogleSync(params({
        res: response.res,
        userId: ownerId,
        method: 'POST',
        body: { supplierId },
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

      const items: Array<{ value?: number; status?: string; meterId?: unknown }> = document?.facts ?? [];
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

    it('links pending items whose number matches a stored meter with a provider prefix', async () => {
      await Meter.updateMany({}, { $set: { meterNumber: 'SWM 600044' } }).setOptions({ userId: ownerId });
      stubGmail({ files: [{ name: 'lastgang.csv', mimeType: 'text/csv', bytes: csvBytes }] });
      stubDrive();
      await ProviderDocument.create({
        userId: ownerId,
        supplierId,
        providerName: 'Stadtwerke',
        source: 'gmail',
        fileName: 'old.csv',
        mimeType: 'text/csv',
        sha256: 'old-doc',
        status: 'parsed',
        facts: [{
          _id: new mongoose.Types.ObjectId(),
          kind: 'reading',
          date: new Date('2023-12-01'),
          value: 100,
          meterNumber: '600044',
          status: 'pending',
        }],
      });
      const response = mockResponse();

      await handleGoogleSync(params({
        res: response.res,
        userId: ownerId,
        method: 'POST',
        body: { supplierId },
      }));

      expect(response.res.statusCode).toBe(200);
      const payload = JSON.parse(response.body()) as { linked: number };
      expect(payload.linked).toBe(1);
      const linkedDocument = await ProviderDocument.findOne({ userId: ownerId, sha256: 'old-doc' }).lean();
      expect(linkedDocument?.facts?.[0]?.meterId).toBeTruthy();
    });

    it('marks the account for reconnection when Google rejects the refresh token', async () => {
      // Drive is healthy here; only the Gmail call reports the dead token.
      stubDrive();
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
        body: { supplierId },
      }));

      expect(response.res.statusCode).toBe(409);
      const owner = await User.findById(ownerId).lean();
      expect(owner?.google?.status).toBe('reconnect_required');
    });
  });

  describe('handleIntakeArchive', () => {
    async function createDocument(overrides: Record<string, unknown> = {}) {
      return ProviderDocument.create({
        userId: ownerId,
        providerName: 'Stadtwerke',
        source: 'gmail',
        gmailMessageId: 'msg-1',
        gmailAttachmentId: 'att-1',
        fileName: 'Abrechnung.pdf',
        mimeType: 'application/pdf',
        receivedAt: new Date('2024-02-10'),
        sha256: `sha-${Math.random()}`,
        status: 'parsed',
        ...overrides,
      });
    }

    beforeEach(async () => {
      await User.findByIdAndUpdate(ownerId, {
        $set: {
          'google.refreshToken': encrypt('refresh-token'),
          'google.status': 'ok',
        },
      });
    });

    it('requires a connected Google account', async () => {
      const response = mockResponse();

      await handleIntakeArchive(params({ res: response.res, userId: otherId, method: 'POST' }));

      expect(response.res.statusCode).toBe(401);
    });

    it('re-fetches the original from Gmail and stores the Drive link', async () => {
      stubGmail({ files: [{ name: 'Abrechnung.pdf', mimeType: 'application/pdf', bytes: pdfBytes }] });
      const drive = stubDrive();
      const document = await createDocument({ extracted: { readings: [{ date: '2024-01-01', value: 500 }] } });
      const response = mockResponse();

      await handleIntakeArchive(params({
        res: response.res,
        userId: ownerId,
        method: 'POST',
        body: { documentId: document._id.toString() },
      }));

      expect(response.res.statusCode).toBe(200);
      const payload = JSON.parse(response.body()) as { archived: number; failed: number };
      expect(payload.archived).toBe(1);

      const stored = await ProviderDocument.findById(document._id).lean();
      expect(stored?.driveFileId).toBeTruthy();
      expect(stored?.driveWebLink).toContain('drive.example');
      expect(stored?.sidecarDriveId).toBeTruthy();
      expect(drive.uploads.map((upload) => upload.name)).toEqual(['Abrechnung.pdf', 'Abrechnung.pdf.json']);
    });

    it('archives only documents that have no Drive copy yet', async () => {
      stubGmail({ files: [{ name: 'Abrechnung.pdf', mimeType: 'application/pdf', bytes: pdfBytes }] });
      stubDrive();
      await createDocument({ driveFileId: 'already-there', driveWebLink: 'https://drive.example/existing' });
      await createDocument({ fileName: 'lastgang.csv', mimeType: 'text/csv', extracted: undefined });
      const response = mockResponse();

      await handleIntakeArchive(params({ res: response.res, userId: ownerId, method: 'POST', body: {} }));

      expect(response.res.statusCode).toBe(200);
      const payload = JSON.parse(response.body()) as { archived: number; documents: { fileName: string }[] };
      expect(payload.archived).toBe(1);
      expect(payload.documents.map((entry) => entry.fileName)).toEqual(['lastgang.csv']);
      expect(await ProviderDocument.countDocuments({ userId: ownerId, driveFileId: { $exists: true } })).toBe(2);
    });

    it('refuses to archive documents that were not parsed', async () => {
      stubGmail({ files: [{ name: 'Abrechnung.pdf', mimeType: 'application/pdf', bytes: pdfBytes }] });
      const drive = stubDrive();
      const document = await createDocument({ status: 'failed', error: 'unsupported format' });
      const response = mockResponse();

      await handleIntakeArchive(params({
        res: response.res,
        userId: ownerId,
        method: 'POST',
        body: { documentId: document._id.toString() },
      }));

      const payload = JSON.parse(response.body()) as { archived: number; failed: number; documents: { error: string }[] };
      expect(payload.archived).toBe(0);
      expect(payload.failed).toBe(1);
      expect(payload.documents[0].error).toMatch(/Only parsed documents/);
      expect(drive.uploads).toHaveLength(0);
      expect((await ProviderDocument.findById(document._id).lean())?.driveFileId).toBeUndefined();
    });

    it('keeps documents private to their owner', async () => {
      await User.findByIdAndUpdate(otherId, {
        $set: { 'google.refreshToken': encrypt('refresh-token'), 'google.status': 'ok' },
      });
      stubGmail();
      stubDrive();
      const document = await createDocument();
      const response = mockResponse();

      await handleIntakeArchive(params({
        res: response.res,
        userId: otherId,
        method: 'POST',
        body: { documentId: document._id.toString() },
      }));

      expect(response.res.statusCode).toBe(200);
      const payload = JSON.parse(response.body()) as { archived: number; failed: number };
      expect(payload.archived).toBe(0);
      expect(payload.failed).toBe(1);
      const stored = await ProviderDocument.findById(document._id).lean();
      expect(stored?.driveFileId).toBeUndefined();
    });
  });

  describe('handleIntakeDocumentAction — retry', () => {
    async function createFailedDocument(overrides: Record<string, unknown> = {}) {
      return ProviderDocument.create({
        userId: ownerId,
        providerName: 'Stadtwerke',
        source: 'gmail',
        gmailMessageId: 'msg-1',
        gmailAttachmentId: 'att-1',
        fileName: 'Abrechnung.pdf',
        mimeType: 'application/octet-stream',
        size: pdfBytes.length,
        receivedAt: new Date('2024-02-10'),
        sha256: `sha-${Math.random()}`,
        status: 'failed',
        error: 'unsupported format',
        ...overrides,
      });
    }

    beforeEach(async () => {
      await User.findByIdAndUpdate(ownerId, {
        $set: {
          'google.refreshToken': encrypt('refresh-token'),
          'google.status': 'ok',
        },
      });
    });

    it('re-resolves the mime type so a PDF sent as octet-stream is read', async () => {
      stubGmail();
      stubDrive();
      const document = await createFailedDocument();
      const response = mockResponse();

      await handleIntakeDocumentAction(params({
        res: response.res,
        userId: ownerId,
        method: 'POST',
        url: `/api/intake/documents/${document._id.toString()}/retry`,
      }));

      expect(response.res.statusCode).toBe(200);
      const stored = await ProviderDocument.findById(document._id).lean();
      expect(stored?.mimeType).toBe('application/pdf');
      // No Gemini key in this test: the PDF now reaches extraction instead of
      // being rejected as an unsupported format.
      expect(stored?.status).toBe('failed');
      expect(stored?.error).toMatch(/Gemini API key/);
    });

    it('keeps documents private to their owner', async () => {
      await User.findByIdAndUpdate(otherId, {
        $set: { 'google.refreshToken': encrypt('refresh-token'), 'google.status': 'ok' },
      });
      stubGmail();
      stubDrive();
      const document = await createFailedDocument();
      const response = mockResponse();

      await handleIntakeDocumentAction(params({
        res: response.res,
        userId: otherId,
        method: 'POST',
        url: `/api/intake/documents/${document._id.toString()}/retry`,
      }));

      expect(response.res.statusCode).toBe(404);
      const stored = await ProviderDocument.findById(document._id).lean();
      expect(stored?.status).toBe('failed');
    });
  });

  describe('handleIntakeDocumentAction — assign supplier', () => {
    async function createDocument(overrides: Record<string, unknown> = {}) {
      return ProviderDocument.create({
        userId: ownerId,
        providerName: 'Octo',
        source: 'gmail',
        gmailMessageId: 'msg-1',
        gmailAttachmentId: 'att-1',
        fileName: 'Abrechnung.pdf',
        mimeType: 'application/pdf',
        receivedAt: new Date('2024-02-10'),
        sha256: `sha-${Math.random()}`,
        status: 'parsed',
        ...overrides,
      });
    }

    async function createSupplier(userId: string, name = 'Octo') {
      return Supplier.create({
        userId,
        name,
        nameKey: name.toLowerCase(),
        senders: [`mail@${name.toLowerCase().replace(/\s+/g, '')}.example`],
      });
    }

    it('files the document and its bills under the supplier', async () => {
      const supplier = await createSupplier(ownerId);
      const document = await createDocument();
      const bill = await Bill.create({
        userId: ownerId,
        documentId: document._id,
        supplierId: null,
        providerName: 'Octo',
        meterId: new mongoose.Types.ObjectId(),
      });
      const response = mockResponse();

      await handleIntakeDocumentAction(params({
        res: response.res,
        userId: ownerId,
        method: 'PATCH',
        url: `/api/intake/documents/${document._id.toString()}`,
        body: { supplierId: supplier._id.toString() },
      }));

      expect(response.res.statusCode).toBe(200);
      const stored = await ProviderDocument.findById(document._id).lean();
      expect(stored?.supplierId?.toString()).toBe(supplier._id.toString());
      const storedBill = await Bill.findById(bill._id).lean();
      expect(storedBill?.supplierId?.toString()).toBe(supplier._id.toString());
      expect(storedBill?.providerName).toBe('Octo');
    });

    it('moves a document back to unassigned', async () => {
      const supplier = await createSupplier(ownerId);
      const document = await createDocument({ supplierId: supplier._id });
      const bill = await Bill.create({
        userId: ownerId,
        documentId: document._id,
        supplierId: supplier._id,
        providerName: 'Octo',
        meterId: new mongoose.Types.ObjectId(),
      });
      const response = mockResponse();

      await handleIntakeDocumentAction(params({
        res: response.res,
        userId: ownerId,
        method: 'PATCH',
        url: `/api/intake/documents/${document._id.toString()}`,
        body: { supplierId: null },
      }));

      expect(response.res.statusCode).toBe(200);
      expect((await ProviderDocument.findById(document._id).lean())?.supplierId).toBeUndefined();
      expect((await Bill.findById(bill._id).lean())?.supplierId).toBeUndefined();
    });

    it('rejects a supplier that belongs to another user', async () => {
      const foreign = await createSupplier(otherId, 'Fremd');
      const document = await createDocument();
      const response = mockResponse();

      await handleIntakeDocumentAction(params({
        res: response.res,
        userId: ownerId,
        method: 'PATCH',
        url: `/api/intake/documents/${document._id.toString()}`,
        body: { supplierId: foreign._id.toString() },
      }));

      expect(response.res.statusCode).toBe(404);
      expect((await ProviderDocument.findById(document._id).lean())?.supplierId).toBeUndefined();
    });

    it('validates the supplier id and keeps documents private', async () => {
      const invalid = mockResponse();
      const document = await createDocument();
      await handleIntakeDocumentAction(params({
        res: invalid.res,
        userId: ownerId,
        method: 'PATCH',
        url: `/api/intake/documents/${document._id.toString()}`,
        body: { supplierId: 'not-an-id' },
      }));
      expect(invalid.res.statusCode).toBe(400);

      const supplier = await createSupplier(ownerId);
      const foreignDocument = mockResponse();
      await handleIntakeDocumentAction(params({
        res: foreignDocument.res,
        userId: otherId,
        method: 'PATCH',
        url: `/api/intake/documents/${document._id.toString()}`,
        body: { supplierId: supplier._id.toString() },
      }));
      expect(foreignDocument.res.statusCode).toBe(404);
      expect((await ProviderDocument.findById(document._id).lean())?.supplierId).toBeUndefined();
    });

    it('still requires POST for retry', async () => {
      const document = await createDocument({ status: 'failed' });
      const response = mockResponse();

      await handleIntakeDocumentAction(params({
        res: response.res,
        userId: ownerId,
        method: 'PATCH',
        url: `/api/intake/documents/${document._id.toString()}/retry`,
        body: { supplierId: null },
      }));

      expect(response.res.statusCode).toBe(404);
    });
  });

  describe('intake items', () => {
    beforeEach(async () => {
      const supplier = await Supplier.create({
        name: 'Stadtwerke',
        nameKey: 'stadtwerke',
        senders: ['rechnung@stadtwerke.example'],
        userId: ownerId,
      });
      supplierId = supplier._id.toString();
    });

    async function createMeter() {
      return Meter.create({
        name: 'Strom', meterNumber: '1-234-567', type: 'power', unit: 'kWh', userId: ownerId,
      });
    }

    async function createItem(overrides: Record<string, unknown> = {}) {
      const document = await ProviderDocument.create({
        userId: ownerId,
        supplierId,
        providerName: 'Stadtwerke',
        source: 'gmail',
        fileName: 'doc.csv',
        mimeType: 'text/csv',
        sha256: `sha-${Math.random()}`,
        status: 'parsed',
        facts: [{
          _id: new mongoose.Types.ObjectId(),
          kind: 'reading',
          date: new Date('2024-01-01'),
          value: 500,
          unit: 'kWh',
          status: 'pending',
          ...overrides,
        }],
      });
      const fact = document.facts[0];
      return {
        _id: fact._id,
        documentId: document._id,
        get: async () => {
          const stored = await ProviderDocument.findById(document._id).lean();
          return stored?.facts?.find((entry: { _id: unknown }) => String(entry._id) === String(fact._id));
        },
      };
    }

    it('lists the user\'s items, scoped to the supplier and filtered by status', async () => {
      await createItem({ status: 'pending' });
      await createItem({ status: 'rejected', date: new Date('2024-02-01') });
      await ProviderDocument.create({
        userId: otherId,
        source: 'gmail',
        fileName: 'other.csv',
        mimeType: 'text/csv',
        sha256: 'other-doc',
        status: 'parsed',
        facts: [{ kind: 'reading', status: 'pending' }],
      });

      const all = mockResponse();
      await handleIntakeItems(params({ res: all.res, userId: ownerId, url: `/api/intake/items?supplierId=${supplierId}` }));
      expect(JSON.parse(all.body()).count).toBe(2);

      const pending = mockResponse();
      await handleIntakeItems(params({
        res: pending.res,
        userId: ownerId,
        url: `/api/intake/items?supplierId=${supplierId}&status=pending,conflict`,
      }));
      const payload = JSON.parse(pending.body()) as { count: number; items: { status: string }[] };
      expect(payload.count).toBe(1);
      expect(payload.items[0].status).toBe('pending');
    });

    it('links an unknown-meter item to a meter and reclassifies it', async () => {
      const meter = await createMeter();
      const item = await createItem();
      await Reading.create({
        meterId: meter._id, date: new Date('2024-01-01'), value: 510, source: 'manual', userId: ownerId,
      });
      const response = mockResponse();

      await handleIntakeItemLink(params({
        res: response.res,
        userId: ownerId,
        method: 'POST',
        url: `/api/intake/items/${item._id.toString()}/link`,
        body: { meterId: meter._id.toString() },
      }));

      expect(response.res.statusCode).toBe(200);
      const updated = await item.get();
      expect(String(updated?.meterId)).toBe(meter._id.toString());
      // The provider value (500) disagrees with the existing 510 on that date.
      expect(updated?.status).toBe('conflict');
      expect(updated?.matchedReadingId).toBeTruthy();
      expect(updated?.note).toContain('510');
    });

    it('refuses to link an item to another user\'s meter', async () => {
      const meter = await Meter.create({
        name: 'Other', meterNumber: '9-999-999', type: 'power', unit: 'kWh', userId: otherId,
      });
      const item = await createItem();
      const response = mockResponse();

      await handleIntakeItemLink(params({
        res: response.res,
        userId: ownerId,
        method: 'POST',
        url: `/api/intake/items/${item._id.toString()}/link`,
        body: { meterId: meter._id.toString() },
      }));

      expect(response.res.statusCode).toBe(404);
      expect((await item.get())?.meterId).toBeUndefined();
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

      expect((await item.get())?.status).toBe('accepted');
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
      expect((await item.get())?.status).toBe('pending');
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
      expect((await item.get())?.status).toBe('rejected');
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

  describe('suppliers', () => {
    async function createSupplier(overrides: Record<string, unknown> = {}) {
      return Supplier.create({
        name: 'Stadtwerke',
        nameKey: 'stadtwerke',
        senders: ['rechnung@stadtwerke.example'],
        subjectHints: ['Abrechnung'],
        gmailQuery: null,
        userId: ownerId,
        ...overrides,
      });
    }

    it('creates a supplier and reuses it for the same normalized name', async () => {
      const first = mockResponse();
      await handleSuppliers(params({
        res: first.res, userId: ownerId, method: 'POST',
        body: { name: 'Stadtwerke', senders: ['a@stadtwerke.example'] },
      }));
      expect(first.res.statusCode).toBe(201);

      const second = mockResponse();
      await handleSuppliers(params({
        res: second.res, userId: ownerId, method: 'POST',
        body: { name: '  stadtwerke  ' },
      }));
      expect(second.res.statusCode).toBe(201);
      expect(await Supplier.countDocuments({ userId: ownerId })).toBe(1);
      const stored = await Supplier.findOne({ userId: ownerId }).lean();
      expect(stored?.name).toBe('Stadtwerke');
      expect(stored?.senders).toEqual(['a@stadtwerke.example']);
    });

    it('lists suppliers with contract and staged counts', async () => {
      const supplier = await createSupplier();
      const meter = await Meter.create({
        name: 'Strom', meterNumber: '1-234-567', type: 'power', unit: 'kWh', userId: ownerId,
      });
      await Contract.create({
        supplierId: supplier._id, providerName: 'Stadtwerke', startDate: new Date('2024-01-01'),
        basePrice: 12, workingPrice: 0.3, meterId: meter._id, userId: ownerId,
      });
      await ProviderDocument.create({
        userId: ownerId, supplierId: supplier._id, source: 'gmail', fileName: 'doc.csv',
        mimeType: 'text/csv', sha256: 'doc', status: 'parsed',
        facts: [{ kind: 'reading', status: 'pending' }, { kind: 'reading', status: 'accepted' }],
      });
      await ProviderDocument.create({
        userId: ownerId, source: 'gmail', fileName: 'unassigned.csv',
        mimeType: 'text/csv', sha256: 'unassigned', status: 'parsed',
        facts: [{ kind: 'reading', status: 'conflict' }],
      });

      const response = mockResponse();
      await handleSuppliers(params({ res: response.res, userId: ownerId }));
      const payload = JSON.parse(response.body()) as {
        suppliers: { name: string; contractCount: number; stagedCount: number }[];
        unassigned: { documents: number; staged: number };
      };
      expect(payload.suppliers).toHaveLength(1);
      expect(payload.suppliers[0]).toMatchObject({ name: 'Stadtwerke', contractCount: 1, stagedCount: 1 });
      expect(payload.unassigned).toEqual({ documents: 1, staged: 1 });
    });

    it('returns the supplier detail with its contracts', async () => {
      const supplier = await createSupplier();
      const meter = await Meter.create({
        name: 'Strom', meterNumber: '1-234-567', type: 'power', unit: 'kWh', userId: ownerId,
      });
      await Contract.create({
        supplierId: supplier._id, providerName: 'Stadtwerke', startDate: new Date('2024-01-01'),
        basePrice: 12, workingPrice: 0.3, meterId: meter._id, userId: ownerId,
      });

      const response = mockResponse();
      await handleSupplierItem(params({
        res: response.res, userId: ownerId, url: `/api/suppliers/${supplier._id}`,
      }));
      const payload = JSON.parse(response.body()) as {
        supplier: { name: string; contractCount: number };
        contracts: { providerName: string }[];
      };
      expect(payload.supplier).toMatchObject({ name: 'Stadtwerke', contractCount: 1 });
      expect(payload.contracts).toHaveLength(1);
    });

    it('writes mail settings on the supplier only', async () => {
      const supplier = await createSupplier();
      const response = mockResponse();

      await handleSupplierItem(params({
        res: response.res,
        userId: ownerId,
        method: 'PATCH',
        url: `/api/suppliers/${supplier._id}`,
        body: {
          senders: ['mail@stadtwerke.example'],
          subjectHints: ['Jahresabrechnung'],
          gmailQuery: null,
        },
      }));

      expect(response.res.statusCode).toBe(200);
      const stored = await Supplier.findById(supplier._id).lean();
      expect(stored?.senders).toEqual(['mail@stadtwerke.example']);
      expect(stored?.subjectHints).toEqual(['Jahresabrechnung']);
    });

    it('refuses to rename a supplier onto an existing name', async () => {
      const first = await createSupplier();
      await createSupplier({ name: 'Netz AG', nameKey: 'netz ag' });

      const response = mockResponse();
      await handleSupplierItem(params({
        res: response.res,
        userId: ownerId,
        method: 'PATCH',
        url: `/api/suppliers/${first._id}`,
        body: { name: 'Netz AG' },
      }));

      expect(response.res.statusCode).toBe(409);
    });

    it('refuses to delete a supplier that still has contracts', async () => {
      const supplier = await createSupplier();
      const meter = await Meter.create({
        name: 'Strom', meterNumber: '1-234-567', type: 'power', unit: 'kWh', userId: ownerId,
      });
      await Contract.create({
        supplierId: supplier._id, providerName: 'Stadtwerke', startDate: new Date('2024-01-01'),
        basePrice: 12, workingPrice: 0.3, meterId: meter._id, userId: ownerId,
      });

      const blocked = mockResponse();
      await handleSupplierItem(params({
        res: blocked.res, userId: ownerId, method: 'DELETE', url: `/api/suppliers/${supplier._id}`,
      }));
      expect(blocked.res.statusCode).toBe(409);

      await Contract.deleteMany({}).setOptions({ userId: ownerId });
      const deleted = mockResponse();
      await handleSupplierItem(params({
        res: deleted.res, userId: ownerId, method: 'DELETE', url: `/api/suppliers/${supplier._id}`,
      }));
      expect(deleted.res.statusCode).toBe(200);
      expect(await Supplier.countDocuments({ userId: ownerId })).toBe(0);
    });

    it('keeps suppliers private to their owner', async () => {
      const supplier = await createSupplier();

      const detail = mockResponse();
      await handleSupplierItem(params({
        res: detail.res, userId: otherId, url: `/api/suppliers/${supplier._id}`,
      }));
      expect(detail.res.statusCode).toBe(404);

      const patch = mockResponse();
      await handleSupplierItem(params({
        res: patch.res, userId: otherId, method: 'PATCH',
        url: `/api/suppliers/${supplier._id}`, body: { name: 'Stolen' },
      }));
      expect(patch.res.statusCode).toBe(404);

      const list = mockResponse();
      await handleSuppliers(params({ res: list.res, userId: otherId }));
      expect(JSON.parse(list.body()).suppliers).toHaveLength(0);
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
