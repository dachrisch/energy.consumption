import crypto from 'crypto';
import mongoose from 'mongoose';
import User from '../../models/User';
import ProviderDocument from '../../models/ProviderDocument';
import IntakeItem from '../../models/IntakeItem';
import Bill from '../../models/Bill';
import Reading from '../../models/Reading';
import Meter from '../../models/Meter';
import Contract from '../../models/Contract';
import { RouteParams, sanitizeString } from '../utils';
import { formatZodError, providerSettingsSchema } from '../validation';
import { decrypt } from '../../lib/encryption';
import {
  GOOGLE_SCOPES, isGoogleConfigured, buildConsentUrl, signState, verifyState,
  exchangeCode, clientForRefreshToken, createOAuthClient, isInvalidGrant,
  decryptRefreshToken, encryptRefreshToken, markReconnectRequired,
} from '../../lib/google/oauth';
import { gmailFor, buildProviderQuery, collectAttachments, collectTextBody, headerValue } from '../../lib/google/gmail';
import { driveFor, ensureFolder } from '../../lib/google/drive';
import { processDocument } from '../../lib/intake/processDocument';
import { computeVariance, expectedCostForBill, periodDays } from '../../lib/intake/reconcile';
import { findActiveOrLastContract } from '../../lib/pricing';

function callbackUrl(): string {
  return process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:3000/api/google/callback';
}

interface ProcessedAttachment {
  messageId: string;
  attachment: string;
  documentId?: string;
  status: string;
  intakeItemIds?: string[];
  billId?: string;
  driveFileId?: string;
  error?: string;
}

async function getUserGoogleAccount(userId: string): Promise<{ refresh: string; sub: string; googleApiKey?: string; rootFolderId?: string } | null> {
  const user = await User.findById(userId).lean();
  if (!user?.google?.refreshToken) { return null; }
  try {
    const refresh = decryptRefreshToken(user.google.refreshToken);
    const googleApiKey = user.googleApiKey ? decrypt(user.googleApiKey) : undefined;
    return { refresh, sub: user.google.sub ?? '', googleApiKey, rootFolderId: user.google?.rootFolderId };
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

  let stateUserId: string;
  try {
    stateUserId = verifyState(state);
  } catch {
    res.statusCode = 403; res.end(JSON.stringify({ error: 'Invalid state' })); return;
  }

  // The state token is the only trustworthy binding between the browser coming
  // back from Google and the account that started the flow: it is signed and
  // expires in 10 minutes. Never fall back to the current session instead.
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
  const provider = await resolveProvider(userId, providerName);
  if (!provider) {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: `No contract for provider "${providerName}" — add one first` }));
    return;
  }
  // Without senders (or an explicit query) the search would match every
  // attachment in the mailbox instead of this provider's mail.
  if (provider.senders.length === 0 && !provider.gmailQuery) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: `Add sender addresses for "${providerName}" before syncing` }));
    return;
  }
  try {
    const client = clientForRefreshToken(account.refresh);
    const gmail = gmailFor(client);
    const drive = driveFor(client);
    const query = buildProviderQuery({ senders: provider.senders ?? [], subjectHints: provider.subjectHints ?? [], gmailQuery: provider.gmailQuery ?? null });
    const listRes = await gmail.users.messages.list({ userId: 'me', q: query, maxResults: 20 });
    const messages = listRes.data.messages ?? [];

    // Everything the pipeline needs, fetched once per sync.
    const meters = (await Meter.find({}).setOptions({ userId }).lean())
      .map((meter) => ({ _id: meter._id.toString(), meterNumber: meter.meterNumber, unit: meter.unit }));
    const readings = (await Reading.find({}).setOptions({ userId }).lean())
      .map((reading) => ({
        _id: reading._id.toString(),
        meterId: reading.meterId.toString(),
        date: reading.date,
        value: reading.value,
      }));
    let rootFolderId = account.rootFolderId;
    if (!rootFolderId) {
      rootFolderId = await ensureFolder(drive, 'Energy Monitor');
      await User.findByIdAndUpdate(userId, { $set: { 'google.rootFolderId': rootFolderId } });
    }

    const processed: ProcessedAttachment[] = [];
    for (const m of messages) {
      if (!m.id) continue;
      const msgRes = await gmail.users.messages.get({ userId: 'me', id: m.id, format: 'full' });
      const attachments = (msgRes.data.payload ? collectAttachments(msgRes.data.payload) : []);
      const textBody = collectTextBody(msgRes.data.payload ?? null);
      const fromAddr = headerValue(msgRes.data.payload ?? null, 'From');
      const subject = headerValue(msgRes.data.payload ?? null, 'Subject');
      const receivedAt = msgRes.data.internalDate ? new Date(Number(msgRes.data.internalDate)) : new Date();
      for (const att of attachments) {
        if (!att.attachmentId || att.inlineData) continue;
        const attRes = await gmail.users.messages.attachments.get({ userId: 'me', messageId: m.id, id: att.attachmentId });
        if (!attRes.data.data) continue;

        const buffer = Buffer.from(attRes.data.data, 'base64');
        const sha = crypto.createHash('sha256').update(buffer).digest('hex');
        const exists = await ProviderDocument.findOne({ userId, sha256: sha }).setOptions({ userId }).lean();
        if (exists) {
          processed.push({ messageId: m.id, attachment: att.fileName, status: 'already_processed', documentId: exists._id.toString() });
          continue;
        }

        const doc = await ProviderDocument.create({
          userId,
          providerName: provider.name,
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

        // One failing document must not abort the batch.
        try {
          const result = await processDocument({
            document: {
              _id: doc._id.toString(),
              mimeType: att.mimeType,
              fileName: att.fileName,
              receivedAt,
              size: att.size ?? buffer.length,
              buffer,
              textBody,
              status: 'new',
            },
            provider: { name: provider.name, defaultUnit: provider.unit },
            userId,
            meters,
            readings,
            apiKey: account.googleApiKey,
            drive,
            rootFolderId,
          });
          processed.push({
            messageId: m.id,
            attachment: att.fileName,
            documentId: doc._id.toString(),
            status: result.status,
            intakeItemIds: result.intakeItemIds,
            billId: result.billId,
            driveFileId: result.driveFileId,
            error: result.error,
          });
          if (result.status === 'failed') {
            await ProviderDocument.findByIdAndUpdate(doc._id, {
              $set: { status: 'failed', error: result.error ?? 'processing failed' },
            }).setOptions({ userId });
          }
        } catch (error) {
          const reason = error instanceof Error ? error.message : 'processing failed';
          await ProviderDocument.findByIdAndUpdate(doc._id, {
            $set: { status: 'failed', error: reason },
          }).setOptions({ userId });
          processed.push({
            messageId: m.id,
            attachment: att.fileName,
            documentId: doc._id.toString(),
            status: 'failed',
            error: reason,
          });
        }
      }
    }

    await User.findByIdAndUpdate(userId, { $set: { 'google.lastSyncAt': new Date() } });
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

/** `/api/intake/items/<id>/<action>` → the id segment, or null. */
function intakeItemId(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean);
  const index = segments.indexOf('items');
  const id = index === -1 ? undefined : segments[index + 1];
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  return id;
}

export async function handleIntakeItems({ res, userId, url }: RouteParams): Promise<void> {
  const statusParam = url.searchParams.get('status');
  const query: { userId: string; status?: { $in: string[] } } = { userId };
  if (statusParam) {
    const statuses = statusParam.split(',').map((status) => status.trim()).filter(Boolean);
    if (statuses.length > 0) {
      query.status = { $in: statuses };
    }
  }
  const items = await IntakeItem.find(query).setOptions({ userId }).lean();
  res.statusCode = 200; res.end(JSON.stringify({ items, count: items.length }));
}

export async function handleIntakeItemAccept({ res, userId, url }: RouteParams): Promise<void> {
  const id = intakeItemId(url.pathname);
  if (!id) {
    res.statusCode = 404; res.end(JSON.stringify({ error: 'Item not found' })); return;
  }
  const item = await IntakeItem.findOne({ _id: id, userId }).setOptions({ userId }).lean();
  if (!item) {
    res.statusCode = 404; res.end(JSON.stringify({ error: 'Item not found' })); return;
  }
  if (item.status !== 'pending' && item.status !== 'conflict') {
    res.statusCode = 409; res.end(JSON.stringify({ error: `Item already ${item.status}` })); return;
  }
  // Unknown meter: the user must create/link one first, never auto-create.
  if (!item.meterId) {
    res.statusCode = 409; res.end(JSON.stringify({ error: 'Unknown meter number — create meter first' })); return;
  }

  try {
    if (item.kind === 'reading') {
      await Reading.create({
        meterId: item.meterId,
        date: item.date,
        value: item.value,
        source: 'provider',
        providerDocId: item.documentId,
        userId,
      });
    } else {
      await Bill.create({
        meterId: item.meterId,
        providerName: item.providerName,
        documentId: item.documentId,
        periodStart: item.periodStart,
        periodEnd: item.periodEnd,
        consumption: item.consumption,
        unit: item.unit,
        amountGross: item.amountGross,
        amountNet: item.amountNet,
        currency: item.currency ?? 'EUR',
        userId,
      });
    }
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      res.statusCode = 409; res.end(JSON.stringify({ error: 'A reading already exists for this date' })); return;
    }
    throw error;
  }

  await IntakeItem.findByIdAndUpdate(id, { $set: { status: 'accepted' } }).setOptions({ userId });
  res.statusCode = 200; res.end(JSON.stringify({ item: { id, status: 'accepted' } }));
}

export async function handleIntakeItemReject({ res, userId, url }: RouteParams): Promise<void> {
  const id = intakeItemId(url.pathname);
  if (!id) {
    res.statusCode = 404; res.end(JSON.stringify({ error: 'Item not found' })); return;
  }
  const item = await IntakeItem.findOne({ _id: id, userId }).setOptions({ userId }).lean();
  if (!item) {
    res.statusCode = 404; res.end(JSON.stringify({ error: 'Item not found' })); return;
  }
  await IntakeItem.findByIdAndUpdate(id, { $set: { status: 'rejected' } }).setOptions({ userId });
  res.statusCode = 200; res.end(JSON.stringify({ item: { id, status: 'rejected' } }));
}

/** Dispatch `/api/intake/items/<id>/accept|reject`. */
export async function handleIntakeItemAction(params: RouteParams): Promise<void> {
  const { req, res, url } = params;
  if (req.method !== 'POST') {
    res.statusCode = 405; res.end(JSON.stringify({ error: 'Method not allowed' })); return;
  }
  if (!intakeItemId(url.pathname)) {
    res.statusCode = 404; res.end(JSON.stringify({ error: 'Item not found' })); return;
  }
  if (url.pathname.endsWith('/accept')) {
    return handleIntakeItemAccept(params);
  }
  if (url.pathname.endsWith('/reject')) {
    return handleIntakeItemReject(params);
  }
  res.statusCode = 404; res.end(JSON.stringify({ error: 'Not found' }));
}

/**
 * Bills against what the contract rates would have charged — the data behind
 * the comparison view. Variance is derived here, never stored.
 */
export async function handleIntakeBills({ res, userId }: RouteParams): Promise<void> {
  const [bills, contracts] = await Promise.all([
    Bill.find({}).setOptions({ userId }).lean(),
    Contract.find({}).setOptions({ userId }).lean(),
  ]);

  const rows = bills.map((bill) => {
    const meterContracts = contracts
      .filter((contract) => String(contract.meterId) === String(bill.meterId))
      .map((contract) => ({
        basePrice: contract.basePrice,
        workingPrice: contract.workingPrice,
        startDate: contract.startDate,
        endDate: contract.endDate ?? null,
      }));
    const at = bill.periodEnd ?? new Date();
    const contract = findActiveOrLastContract(meterContracts, new Date(at));
    const days = periodDays(
      bill.periodStart?.toISOString(),
      bill.periodEnd?.toISOString(),
    );
    const expected = contract && bill.consumption !== undefined && days > 0
      ? expectedCostForBill(contract, bill.consumption, days)
      : null;
    const variance = expected !== null && bill.amountGross !== undefined
      ? computeVariance(bill.amountGross, expected)
      : null;
    return { ...bill, expected, variance };
  });

  res.statusCode = 200; res.end(JSON.stringify({ bills: rows, count: rows.length }));
}

export interface ProviderView {
  name: string;
  senders: string[];
  subjectHints: string[];
  gmailQuery: string | null;
  unit?: string;
  contractCount: number;
  meterIds: string[];
}

/**
 * A provider is the `providerName` of the user's contracts — there is no
 * provider collection. Mail settings are read as the union over that
 * provider's contracts, so editing any one of them cannot hide the others.
 */
async function resolveProvider(userId: string, providerName: string): Promise<ProviderView | null> {
  const [contracts, meters] = await Promise.all([
    Contract.find({ providerName }).setOptions({ userId }).sort({ startDate: -1 }).lean(),
    Meter.find({}).setOptions({ userId }).lean(),
  ]);
  if (contracts.length === 0) {
    return null;
  }
  const units = new Map(meters.map((meter) => [meter._id.toString(), meter.unit]));
  const meterIds = [...new Set(contracts.map((contract) => contract.meterId.toString()))];
  const newestQuery = contracts.find((contract) => contract.gmailQuery)?.gmailQuery ?? null;
  // Sorted so the derived view does not depend on the contracts' start dates.
  const union = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b));
  return {
    name: providerName,
    senders: union(contracts.flatMap((contract) => contract.senders ?? [])),
    subjectHints: union(contracts.flatMap((contract) => contract.subjectHints ?? [])),
    gmailQuery: newestQuery,
    unit: units.get(meterIds[0]),
    contractCount: contracts.length,
    meterIds,
  };
}

/** Providers derived from the user's contracts, with their mail settings. */
export async function handleProviders({ req, res, userId }: RouteParams): Promise<void> {
  if (req.method === 'GET') {
    const contracts = await Contract.find({}).setOptions({ userId }).sort({ startDate: -1 }).lean();
    const names = [...new Set(contracts.map((contract) => contract.providerName))].sort((a, b) => a.localeCompare(b));
    const providers = (await Promise.all(names.map((name) => resolveProvider(userId, name))))
      .filter((provider): provider is ProviderView => provider !== null);
    res.statusCode = 200; res.end(JSON.stringify({ providers, count: providers.length }));
    return;
  }

  if (req.method !== 'PATCH') {
    res.statusCode = 405; res.end(JSON.stringify({ error: 'Method not allowed' })); return;
  }

  const result = providerSettingsSchema.safeParse(req.body);
  if (!result.success) {
    res.statusCode = 400; res.end(JSON.stringify({ error: formatZodError(result.error) })); return;
  }
  const { providerName, senders, subjectHints, gmailQuery } = result.data;
  const updated = await Contract.updateMany(
    { providerName },
    { $set: { senders, subjectHints, gmailQuery: gmailQuery ?? null } },
  ).setOptions({ userId });
  if (updated.matchedCount === 0) {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: `No contract for provider "${providerName}"` }));
    return;
  }
  const provider = await resolveProvider(userId, providerName);
  res.statusCode = 200; res.end(JSON.stringify({ provider, contractsUpdated: updated.modifiedCount }));
}

/** Most recent ingested documents, for the intake page's document list. */
export async function handleIntakeDocuments({ res, userId, url }: RouteParams): Promise<void> {
  const requested = Number(url.searchParams.get('limit') ?? 25);
  const limit = Number.isFinite(requested) && requested > 0 ? Math.min(requested, 100) : 25;
  const documents = await ProviderDocument.find({})
    .setOptions({ userId })
    .sort({ receivedAt: -1 })
    .limit(limit)
    .lean();
  res.statusCode = 200; res.end(JSON.stringify({ documents, count: documents.length }));
}
