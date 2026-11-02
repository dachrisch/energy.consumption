import crypto from 'crypto';
import mongoose from 'mongoose';
import User from '../../models/User';
import ProviderDocument from '../../models/ProviderDocument';
import Bill from '../../models/Bill';
import Reading from '../../models/Reading';
import Meter from '../../models/Meter';
import Contract from '../../models/Contract';
import Supplier, { normalizeSupplierName } from '../../models/Supplier';
import { RouteParams, sanitizeString } from '../utils';
import { documentSupplierSchema, formatZodError } from '../validation';
import { decrypt } from '../../lib/encryption';
import {
  GOOGLE_SCOPES, isGoogleConfigured, buildConsentUrl, signState, verifyState,
  exchangeCode, clientForRefreshToken, createOAuthClient, isInvalidGrant,
  decryptRefreshToken, encryptRefreshToken, markReconnectRequired,
} from '../../lib/google/oauth';
import {
  gmailFor, buildProviderQuery, collectAttachments, collectTextBody, decodeBase64Url,
  headerValue, resolveMimeType,
} from '../../lib/google/gmail';
import type { GmailClientLike } from '../../lib/google/gmail';
import { archiveDocument, driveFor, ensureFolder } from '../../lib/google/drive';
import type { DriveClientLike } from '../../lib/google/drive';
import { folderYear, processDocument } from '../../lib/intake/processDocument';
import { classifyReading, computeVariance, expectedCostForBill, findMeterByNumber, periodDays } from '../../lib/intake/reconcile';
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

type GoogleAccount = NonNullable<Awaited<ReturnType<typeof getUserGoogleAccount>>>;

interface ArchiveContext {
  gmail: GmailClientLike;
  drive: DriveClientLike;
  rootFolderId: string;
}

/** Gmail + Drive clients for one request, with the archive root ensured. */
async function archiveContextFor(userId: string, account: GoogleAccount): Promise<ArchiveContext> {
  const client = clientForRefreshToken(account.refresh);
  const drive = driveFor(client);
  let rootFolderId = account.rootFolderId;
  if (!rootFolderId) {
    rootFolderId = await ensureFolder(drive, 'Energy Monitor');
    await User.findByIdAndUpdate(userId, { $set: { 'google.rootFolderId': rootFolderId } });
  }
  return { gmail: gmailFor(client), drive, rootFolderId };
}

/** Extracted fields live in a Mixed column; only the bill period is needed here. */
function billPeriodEnd(extracted: unknown): string | undefined {
  const bill = (extracted as { bill?: { periodEnd?: string } } | null)?.bill;
  return bill?.periodEnd;
}

/** Meters and readings the pipeline reconciles against, scoped to the user. */
async function pipelineRefs(userId: string): Promise<{
  meters: { _id: string; meterNumber: string; unit?: string }[];
  readings: { _id: string; meterId: string; date: Date; value: number }[];
}> {
  const [meterDocs, readingDocs] = await Promise.all([
    Meter.find({}).setOptions({ userId }).lean(),
    Reading.find({}).setOptions({ userId }).lean(),
  ]);
  return {
    meters: meterDocs.map((meter) => ({
      _id: meter._id.toString(),
      meterNumber: meter.meterNumber,
      unit: meter.unit,
    })),
    readings: readingDocs.map((reading) => ({
      _id: reading._id.toString(),
      meterId: reading.meterId.toString(),
      date: reading.date,
      value: reading.value,
    })),
  };
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
    res.statusCode = 302; res.setHeader('Location', '/intake?google=connected'); res.end('');
  } catch (e) {
    console.error('Google OAuth exchange failed:', e);
    res.statusCode = 502; res.end(JSON.stringify({ error: 'Google exchange failed' }));
  }
}

/** Put a previously failed document back to `new` so the pipeline runs it again. */
async function resetFailedDocument(
  userId: string,
  documentId: mongoose.Types.ObjectId,
  mimeType: string,
): Promise<{ _id: mongoose.Types.ObjectId }> {
  await ProviderDocument.updateOne(
    { _id: documentId },
    { $set: { status: 'new', mimeType }, $unset: { error: 1 } },
  ).setOptions({ userId });
  return { _id: documentId };
}

/**
 * Attribute an already-ingested document to the supplier whose sync found it.
 * Only fills a gap: a document filed under another supplier is never stolen.
 */
async function stampMissingSupplier(
  userId: string,
  documentId: mongoose.Types.ObjectId | string,
  supplierId: mongoose.Types.ObjectId | string,
): Promise<void> {
  await ProviderDocument.updateOne(
    {
      _id: documentId,
      $or: [{ supplierId: { $exists: false } }, { supplierId: null }],
    },
    { $set: { supplierId } },
  ).setOptions({ userId });
}

export async function handleGoogleSync({ req, res, userId }: RouteParams): Promise<void> {
  const account = await getUserGoogleAccount(userId);
  if (!account) {
    res.statusCode = 401; res.end(JSON.stringify({ error: 'Google not connected' })); return;
  }
  const supplierId = sanitizeString(req.body.supplierId);
  const legacyName = sanitizeString(req.body.providerName);
  let supplier = supplierId && mongoose.Types.ObjectId.isValid(supplierId)
    ? await Supplier.findOne({ _id: supplierId }).setOptions({ userId }).lean()
    : null;
  if (!supplier && legacyName) {
    // Older clients still send providerName; resolve it to the supplier.
    supplier = await Supplier.findOne({
      nameKey: normalizeSupplierName(legacyName),
    }).setOptions({ userId }).lean();
  }
  if (!supplier) {
    res.statusCode = supplierId ? 404 : 400;
    res.end(JSON.stringify({ error: supplierId ? 'Supplier not found' : 'supplierId required' }));
    return;
  }
  const providerName = supplier.name;
  // Without senders (or an explicit query) the search would match every
  // attachment in the mailbox instead of this supplier's mail.
  if ((supplier.senders ?? []).length === 0 && !supplier.gmailQuery) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: `Add sender addresses for "${providerName}" before syncing` }));
    return;
  }
  try {
    const { gmail, drive, rootFolderId } = await archiveContextFor(userId, account);
    const query = buildProviderQuery({ senders: supplier.senders ?? [], subjectHints: supplier.subjectHints ?? [], gmailQuery: supplier.gmailQuery ?? null });
    const listRes = await gmail.users.messages.list({ userId: 'me', q: query, maxResults: 20 });
    const messages = listRes.data.messages ?? [];

    // Everything the pipeline needs, fetched once per sync.
    const { meters, readings } = await pipelineRefs(userId);

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
        const mimeType = resolveMimeType(att.mimeType, att.fileName, buffer);
        const exists = await ProviderDocument.findOne({ userId, sha256: sha }).setOptions({ userId }).lean();
        if (exists) {
          // A legacy document may predate the Supplier collection; a sync that
          // finds it is proof enough to file it under this supplier.
          await stampMissingSupplier(userId, exists._id, supplier._id);
        }
        // Failed documents are retried (e.g. after a format fix); anything else is done.
        if (exists && exists.status !== 'failed') {
          processed.push({ messageId: m.id, attachment: att.fileName, status: 'already_processed', documentId: exists._id.toString() });
          continue;
        }

        const doc = exists
          ? await resetFailedDocument(userId, exists._id, mimeType)
          : await ProviderDocument.create({
            userId,
            supplierId: supplier._id,
            providerName,
            source: 'gmail',
            gmailMessageId: m.id,
            gmailAttachmentId: att.attachmentId,
            fileName: att.fileName,
            mimeType,
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
              mimeType,
              fileName: att.fileName,
              receivedAt,
              size: att.size ?? buffer.length,
              buffer,
              textBody,
              status: 'new',
            },
            supplier: { id: supplier._id.toString(), name: providerName, defaultUnit: undefined },
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
    // Old items may have been left unlinked before the matcher understood
    // provider prefixes; a sync repairs them along with new documents.
    const linked = await linkUnmatchedItems(userId, meters);
    res.statusCode = 200;
    res.end(JSON.stringify({ processed, count: processed.length, provider: providerName, linked }));
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

/** `/api/intake/items/<id>/<action>` → the fact id segment, or null. */
function intakeItemId(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean);
  const index = segments.indexOf('items');
  const id = index === -1 ? undefined : segments[index + 1];
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  return id;
}

interface StagedFact {
  _id: unknown;
  kind: string;
  status: string;
  meterNumber?: string;
  meterId?: unknown;
  date?: Date | null;
  value?: number | null;
  unit?: string;
  periodStart?: Date | null;
  periodEnd?: Date | null;
  consumption?: number;
  amountGross?: number;
  amountNet?: number;
  currency?: string;
  matchedReadingId?: unknown;
  confidence?: number;
  note?: string;
}

interface DocumentWithFacts {
  _id: unknown;
  supplierId?: unknown;
  providerName?: string;
  fileName?: string;
  status?: string;
  receivedAt?: Date | null;
  facts?: StagedFact[];
}

function flattenFacts(document: DocumentWithFacts): Array<StagedFact & Record<string, unknown>> {
  return (document.facts ?? []).map((fact) => ({
    ...fact,
    _id: String(fact._id),
    documentId: String(document._id),
    supplierId: document.supplierId ? String(document.supplierId) : undefined,
    providerName: document.providerName,
    documentStatus: document.status,
    fileName: document.fileName,
    receivedAt: document.receivedAt,
  }));
}

async function findFactById(
  userId: string,
  factId: string,
): Promise<{ document: DocumentWithFacts; fact: StagedFact } | null> {
  const document = await ProviderDocument.findOne({ 'facts._id': factId })
    .setOptions({ userId })
    .lean() as DocumentWithFacts | null;
  if (!document) {
    return null;
  }
  const fact = (document.facts ?? []).find((entry) => String(entry._id) === factId);
  return fact ? { document, fact } : null;
}

/** Update one embedded fact; `arrayFilters` keeps the other facts untouched. */
async function updateFact(
  userId: string,
  documentId: unknown,
  factId: string,
  set: Record<string, unknown>,
  unset: string[] = [],
): Promise<void> {
  const update: Record<string, unknown> = {};
  if (Object.keys(set).length > 0) {
    update.$set = Object.fromEntries(
      Object.entries(set).map(([key, value]) => [`facts.$[fact].${key}`, value]),
    );
  }
  if (unset.length > 0) {
    update.$unset = Object.fromEntries(unset.map((key) => [`facts.$[fact].${key}`, '']));
  }
  if (Object.keys(update).length === 0) {
    return;
  }
  await ProviderDocument.updateOne(
    { _id: documentId },
    update,
    { arrayFilters: [{ 'fact._id': new mongoose.Types.ObjectId(factId) }] },
  ).setOptions({ userId });
}

export async function handleIntakeItems({ res, userId, url }: RouteParams): Promise<void> {
  const statusParam = url.searchParams.get('status');
  const statuses = statusParam
    ? statusParam.split(',').map((status) => status.trim()).filter(Boolean)
    : null;
  const supplierId = sanitizeString(url.searchParams.get('supplierId'));
  const unassigned = url.searchParams.get('unassigned') === '1';

  const query: Record<string, unknown> = {};
  if (supplierId && mongoose.Types.ObjectId.isValid(supplierId)) {
    query.supplierId = supplierId;
  } else if (unassigned) {
    query.supplierId = null;
  }

  const documents = await ProviderDocument.find(query)
    .setOptions({ userId })
    .sort({ receivedAt: -1 })
    .lean() as DocumentWithFacts[];

  const items = documents
    .flatMap(flattenFacts)
    .filter((item) => !statuses || statuses.includes(String(item.status)));
  res.statusCode = 200; res.end(JSON.stringify({ items, count: items.length }));
}

export async function handleIntakeItemAccept({ res, userId, url }: RouteParams): Promise<void> {
  const id = intakeItemId(url.pathname);
  if (!id) {
    res.statusCode = 404; res.end(JSON.stringify({ error: 'Item not found' })); return;
  }
  const found = await findFactById(userId, id);
  if (!found) {
    res.statusCode = 404; res.end(JSON.stringify({ error: 'Item not found' })); return;
  }
  const { document, fact } = found;
  if (fact.status !== 'pending' && fact.status !== 'conflict') {
    res.statusCode = 409; res.end(JSON.stringify({ error: `Item already ${fact.status}` })); return;
  }
  // Unknown meter: the user must create/link one first, never auto-create.
  if (!fact.meterId) {
    res.statusCode = 409; res.end(JSON.stringify({ error: 'Unknown meter number — create meter first' })); return;
  }

  try {
    if (fact.kind === 'reading') {
      await Reading.create({
        meterId: fact.meterId,
        date: fact.date,
        value: fact.value,
        source: 'provider',
        providerDocId: document._id,
        userId,
      });
    } else {
      await Bill.create({
        meterId: fact.meterId,
        supplierId: document.supplierId,
        providerName: document.providerName,
        documentId: document._id,
        periodStart: fact.periodStart,
        periodEnd: fact.periodEnd,
        consumption: fact.consumption,
        unit: fact.unit,
        amountGross: fact.amountGross,
        amountNet: fact.amountNet,
        currency: fact.currency ?? 'EUR',
        userId,
      });
    }
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      res.statusCode = 409; res.end(JSON.stringify({ error: 'A reading already exists for this date' })); return;
    }
    throw error;
  }

  await updateFact(userId, document._id, id, { status: 'accepted' });
  res.statusCode = 200; res.end(JSON.stringify({ item: { id, status: 'accepted' } }));
}

/**
 * Attach a fact to a meter and re-classify it against that meter's readings;
 * linking can therefore turn a pending item into `agrees`/`conflict`.
 */
async function applyMeterLink(
  userId: string,
  documentId: unknown,
  fact: StagedFact,
  meterId: unknown,
): Promise<void> {
  const set: Record<string, unknown> = { meterId };
  const unset: string[] = [];
  if (fact.kind === 'reading' && fact.date && typeof fact.value === 'number') {
    const meterReadings = await Reading.find({ meterId }).setOptions({ userId }).lean();
    const classified = classifyReading(
      { date: new Date(fact.date).toISOString(), value: fact.value },
      meterReadings.map((reading) => ({
        _id: reading._id.toString(),
        date: reading.date,
        value: reading.value,
      })),
    );
    set.status = classified.status;
    if (classified.matchedReadingId) {
      set.matchedReadingId = classified.matchedReadingId;
    } else {
      unset.push('matchedReadingId');
    }
    if (classified.note) {
      set.note = classified.note;
    } else {
      unset.push('note');
    }
  }
  await updateFact(userId, documentId, String(fact._id), set, unset);
}

/**
 * Pending facts whose printed meter number now matches a stored meter (the
 * provider often prefixes its own id, "SWM 600044") are attached automatically.
 */
async function linkUnmatchedItems(
  userId: string,
  meters: { _id: string; meterNumber: string }[],
): Promise<number> {
  const documents = await ProviderDocument.find({
    facts: { $elemMatch: { status: { $in: ['pending', 'conflict'] }, meterId: { $exists: false } } },
  })
    .setOptions({ userId })
    .lean() as DocumentWithFacts[];
  let linked = 0;
  for (const document of documents) {
    for (const fact of document.facts ?? []) {
      if (fact.meterId || !['pending', 'conflict'].includes(fact.status)) {
        continue;
      }
      const meter = findMeterByNumber(meters, fact.meterNumber);
      if (!meter) continue;
      await applyMeterLink(userId, document._id, fact, meter._id);
      linked += 1;
    }
  }
  return linked;
}

/** `POST /api/intake/items/<id>/link` → attach an unknown-meter item to a meter. */
export async function handleIntakeItemLink({ req, res, userId, url }: RouteParams): Promise<void> {
  const id = intakeItemId(url.pathname);
  if (!id) {
    res.statusCode = 404; res.end(JSON.stringify({ error: 'Item not found' })); return;
  }
  const body = (req.body ?? {}) as { meterId?: unknown };
  const meterId = sanitizeString(body.meterId ?? undefined);
  if (!meterId || !mongoose.Types.ObjectId.isValid(meterId)) {
    res.statusCode = 400; res.end(JSON.stringify({ error: 'meterId required' })); return;
  }

  const [found, meter] = await Promise.all([
    findFactById(userId, id),
    Meter.findOne({ _id: meterId }).setOptions({ userId }).lean(),
  ]);
  if (!found) {
    res.statusCode = 404; res.end(JSON.stringify({ error: 'Item not found' })); return;
  }
  if (!meter) {
    res.statusCode = 404; res.end(JSON.stringify({ error: 'Meter not found' })); return;
  }
  const { document, fact } = found;
  if (fact.status !== 'pending' && fact.status !== 'conflict') {
    res.statusCode = 409; res.end(JSON.stringify({ error: `Item already ${fact.status}` })); return;
  }

  await applyMeterLink(userId, document._id, fact, meter._id);
  const updated = await findFactById(userId, id);
  const item = updated ? flattenFacts(updated.document).find((entry) => entry._id === id) : undefined;
  res.statusCode = 200;
  res.end(JSON.stringify({ item }));
}

export async function handleIntakeItemReject({ res, userId, url }: RouteParams): Promise<void> {
  const id = intakeItemId(url.pathname);
  if (!id) {
    res.statusCode = 404; res.end(JSON.stringify({ error: 'Item not found' })); return;
  }
  const found = await findFactById(userId, id);
  if (!found) {
    res.statusCode = 404; res.end(JSON.stringify({ error: 'Item not found' })); return;
  }
  await updateFact(userId, found.document._id, id, { status: 'rejected' });
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
  if (url.pathname.endsWith('/link')) {
    return handleIntakeItemLink(params);
  }
  res.statusCode = 404; res.end(JSON.stringify({ error: 'Not found' }));
}

/**
 * Bills against what the contract rates would have charged — the data behind
 * the comparison view. Variance is derived here, never stored.
 */
export async function handleIntakeBills({ res, userId, url }: RouteParams): Promise<void> {
  const supplierId = sanitizeString(url.searchParams.get('supplierId'));
  const unassigned = url.searchParams.get('unassigned') === '1';
  const billQuery: Record<string, unknown> = {};
  if (supplierId && mongoose.Types.ObjectId.isValid(supplierId)) {
    billQuery.supplierId = supplierId;
  } else if (unassigned) {
    billQuery.supplierId = null;
  }

  const [bills, contracts] = await Promise.all([
    Bill.find(billQuery).setOptions({ userId }).lean(),
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

/** Most recent ingested documents, for the supplier detail page's document list. */
export async function handleIntakeDocuments({ res, userId, url }: RouteParams): Promise<void> {
  const requested = Number(url.searchParams.get('limit') ?? 25);
  const limit = Number.isFinite(requested) && requested > 0 ? Math.min(requested, 100) : 25;
  const supplierId = sanitizeString(url.searchParams.get('supplierId'));
  const unassigned = url.searchParams.get('unassigned') === '1';
  const query: Record<string, unknown> = {};
  if (supplierId && mongoose.Types.ObjectId.isValid(supplierId)) {
    query.supplierId = supplierId;
  } else if (unassigned) {
    query.supplierId = null;
  }
  const documents = await ProviderDocument.find(query)
    .setOptions({ userId })
    .sort({ receivedAt: -1 })
    .limit(limit)
    .lean();
  res.statusCode = 200; res.end(JSON.stringify({ documents, count: documents.length }));
}

export interface ArchiveOutcome {
  documentId: string;
  fileName?: string;
  status: 'archived' | 'already_archived' | 'failed';
  driveFileId?: string;
  driveWebLink?: string;
  error?: string;
}

/** Documents whose facts we could read. Only those are archived to Drive. */
const ARCHIVABLE_DOCUMENT_STATUSES = ['parsed', 'needs_review', 'imported'] as const;

const isArchivable = (status: string): boolean =>
  (ARCHIVABLE_DOCUMENT_STATUSES as readonly string[]).includes(status);

/**
 * Archive one already-stored document. The bytes are not kept in Mongo, so the
 * original is re-fetched from Gmail using the ids stored at sync time.
 */
async function archiveStoredDocument(
  userId: string,
  documentId: string,
  context: ArchiveContext,
): Promise<ArchiveOutcome> {
  const document = await ProviderDocument.findOne({ _id: documentId, userId })
    .setOptions({ userId })
    .lean();
  if (!document) {
    return { documentId, status: 'failed', error: 'Document not found' };
  }
  if (document.driveWebLink || document.driveFileId) {
    return {
      documentId,
      fileName: document.fileName,
      status: 'already_archived',
      driveFileId: document.driveFileId,
      driveWebLink: document.driveWebLink,
    };
  }
  if (!isArchivable(document.status)) {
    return {
      documentId,
      fileName: document.fileName,
      status: 'failed',
      error: 'Only parsed documents are archived to Drive',
    };
  }
  if (!document.gmailMessageId || !document.gmailAttachmentId) {
    return {
      documentId,
      fileName: document.fileName,
      status: 'failed',
      error: 'Original is no longer available in Gmail',
    };
  }

  try {
    const attachment = await context.gmail.users.messages.attachments.get({
      userId: 'me',
      messageId: document.gmailMessageId,
      id: document.gmailAttachmentId,
    });
    if (!attachment.data.data) {
      return { documentId, fileName: document.fileName, status: 'failed', error: 'Gmail returned no attachment bytes' };
    }
    const archived = await archiveDocument(context.drive, {
      rootFolderId: context.rootFolderId,
      providerName: document.providerName ?? 'Unfiled',
      year: folderYear(billPeriodEnd(document.extracted), document.receivedAt ?? new Date()),
      fileName: document.fileName,
      mimeType: document.mimeType,
      buffer: decodeBase64Url(attachment.data.data),
      extracted: document.extracted ?? { error: document.error ?? 'no extracted fields' },
    });
    await ProviderDocument.findByIdAndUpdate(document._id, {
      $set: {
        driveFileId: archived.fileId,
        driveWebLink: archived.webLink,
        sidecarDriveId: archived.sidecarId,
      },
    }).setOptions({ userId });
    return {
      documentId,
      fileName: document.fileName,
      status: 'archived',
      driveFileId: archived.fileId,
      driveWebLink: archived.webLink,
    };
  } catch (error) {
    return {
      documentId,
      fileName: document.fileName,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Drive archive failed',
    };
  }
}

const ARCHIVE_BATCH_LIMIT = 25;

/**
 * `POST /api/intake/documents/archive` → archive one document (`documentId`)
 * or every ingested document that has no Drive copy yet (newest first).
 */
export async function handleIntakeArchive({ req, res, userId }: RouteParams): Promise<void> {
  const account = await getUserGoogleAccount(userId);
  if (!account) {
    res.statusCode = 401; res.end(JSON.stringify({ error: 'Google not connected' })); return;
  }
  const body = (req.body ?? {}) as { documentId?: unknown; supplierId?: unknown; unassigned?: unknown };
  const documentId = sanitizeString(body.documentId ?? undefined);
  const supplierId = sanitizeString(body.supplierId ?? undefined);
  const unassigned = body.unassigned === true;

  try {
    const context = await archiveContextFor(userId, account);
    let ids: string[];
    if (documentId) {
      ids = [documentId];
    } else {
      const pending = await ProviderDocument.find({
        status: { $in: [...ARCHIVABLE_DOCUMENT_STATUSES] },
        driveFileId: { $exists: false },
        gmailMessageId: { $exists: true },
        gmailAttachmentId: { $exists: true },
        ...(supplierId && mongoose.Types.ObjectId.isValid(supplierId)
          ? { supplierId }
          : unassigned
            ? { supplierId: null }
            : {}),
      })
        .setOptions({ userId })
        .sort({ receivedAt: -1 })
        .limit(ARCHIVE_BATCH_LIMIT)
        .lean();
      ids = pending.map((document) => document._id.toString());
    }

    const documents: ArchiveOutcome[] = [];
    for (const id of ids) {
      documents.push(await archiveStoredDocument(userId, id, context));
    }
    const failed = documents.filter((document) => document.status === 'failed');
    res.statusCode = 200;
    res.end(JSON.stringify({
      archived: documents.filter((document) => document.status === 'archived').length,
      alreadyArchived: documents.filter((document) => document.status === 'already_archived').length,
      failed: failed.length,
      documents,
    }));
  } catch (error) {
    if (isInvalidGrant(error)) {
      await markReconnectRequired(userId);
      res.statusCode = 409;
      res.end(JSON.stringify({ error: 'Google authorization expired; reconnect required', reconnect: true }));
      return;
    }
    console.error('Drive archive error:', error);
    res.statusCode = 500; res.end(JSON.stringify({ error: 'Drive archive failed' }));
  }
}

/**
 * `PATCH /api/intake/documents/<id>` with `{ supplierId }` files the document
 * (and the bills extracted from it) under that supplier. `null` moves it back
 * to unassigned so leftover mail can be reviewed again.
 */
async function assignDocumentSupplier(
  params: RouteParams,
  documentId: string,
): Promise<void> {
  const { req, res, userId } = params;
  if (!mongoose.Types.ObjectId.isValid(documentId)) {
    res.statusCode = 404; res.end(JSON.stringify({ error: 'Document not found' })); return;
  }
  const result = documentSupplierSchema.safeParse(req.body ?? {});
  if (!result.success) {
    res.statusCode = 400; res.end(JSON.stringify({ error: formatZodError(result.error) })); return;
  }
  const supplierId = result.data.supplierId;

  const document = await ProviderDocument.findOne({ _id: documentId })
    .setOptions({ userId })
    .lean();
  if (!document) {
    res.statusCode = 404; res.end(JSON.stringify({ error: 'Document not found' })); return;
  }

  const supplier = supplierId
    ? await Supplier.findOne({ _id: supplierId }).setOptions({ userId }).lean()
    : null;
  if (supplierId && !supplier) {
    res.statusCode = 404; res.end(JSON.stringify({ error: 'Supplier not found' })); return;
  }

  await ProviderDocument.updateOne(
    { _id: documentId },
    supplierId ? { $set: { supplierId } } : { $unset: { supplierId: '' } },
  ).setOptions({ userId });

  // Bills extracted from this document follow it, but a bill the user filed
  // under a different supplier by hand is left alone.
  const unassigned = { $or: [{ supplierId: { $exists: false } }, { supplierId: null }] };
  const followsDocument = document.supplierId
    ? { $or: [{ supplierId: { $exists: false } }, { supplierId: null }, { supplierId: document.supplierId }] }
    : unassigned;
  if (supplier) {
    await Bill.updateMany(
      { documentId: document._id, ...followsDocument },
      { $set: { supplierId: supplier._id, providerName: supplier.name } },
    ).setOptions({ userId });
  } else {
    await Bill.updateMany(
      { documentId: document._id, ...(document.supplierId ? { supplierId: document.supplierId } : unassigned) },
      { $unset: { supplierId: '' } },
    ).setOptions({ userId });
  }

  res.statusCode = 200;
  res.end(JSON.stringify({
    document: {
      _id: document._id,
      fileName: document.fileName,
      status: document.status,
      supplierId: supplierId ?? undefined,
    },
    supplier: supplier ? { _id: supplier._id, name: supplier.name } : null,
  }));
}

/**
 * `POST /api/intake/documents/<id>/retry` → download the original again and run
 * the pipeline on it. Sync only sees mail inside its search window, so a
 * document that failed before a fix (mime type, extractor) could never be
 * reprocessed; this uses the stored Gmail ids instead.
 *
 * `PATCH /api/intake/documents/<id>` is handled by `assignDocumentSupplier`.
 */
export async function handleIntakeDocumentAction(params: RouteParams): Promise<void> {
  const { req, res, userId, url } = params;
  const segments = url.pathname.split('/').filter(Boolean);
  const documentId = segments[3];
  const action = segments[4];

  if (req.method === 'PATCH' && documentId && !action) {
    await assignDocumentSupplier(params, documentId);
    return;
  }

  if (req.method !== 'POST' || !documentId || action !== 'retry') {
    res.statusCode = 404; res.end(JSON.stringify({ error: 'Not found' })); return;
  }

  const account = await getUserGoogleAccount(userId);
  if (!account) {
    res.statusCode = 401; res.end(JSON.stringify({ error: 'Google not connected' })); return;
  }
  const document = await ProviderDocument.findOne({ _id: documentId, userId })
    .setOptions({ userId })
    .lean();
  if (!document) {
    res.statusCode = 404; res.end(JSON.stringify({ error: 'Document not found' })); return;
  }
  if (document.source !== 'gmail' || !document.gmailMessageId || !document.gmailAttachmentId) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'The original is not available in Gmail' }));
    return;
  }

  try {
    const context = await archiveContextFor(userId, account);
    const attachment = await context.gmail.users.messages.attachments.get({
      userId: 'me',
      messageId: document.gmailMessageId,
      id: document.gmailAttachmentId,
    });
    if (!attachment.data.data) {
      res.statusCode = 502;
      res.end(JSON.stringify({ error: 'Gmail returned no attachment bytes' }));
      return;
    }
    const buffer = decodeBase64Url(attachment.data.data);
    // Re-resolve the type: the stored one may be what made the first run fail.
    const mimeType = resolveMimeType(document.mimeType, document.fileName, buffer);
    const supplier = document.supplierId
      ? await Supplier.findOne({ _id: document.supplierId }).setOptions({ userId }).lean()
      : null;
    const { meters, readings } = await pipelineRefs(userId);

    await ProviderDocument.findByIdAndUpdate(document._id, {
      $set: { status: 'new', mimeType },
      $unset: { error: '' },
    }).setOptions({ userId });

    const result = await processDocument({
      document: {
        _id: document._id.toString(),
        mimeType,
        fileName: document.fileName,
        receivedAt: document.receivedAt ?? new Date(),
        size: document.size,
        buffer,
        status: 'new',
      },
      supplier: {
        id: document.supplierId ? String(document.supplierId) : undefined,
        name: supplier?.name ?? document.providerName ?? 'Unknown',
      },
      userId,
      meters,
      readings,
      apiKey: account.googleApiKey,
      drive: context.drive,
      rootFolderId: context.rootFolderId,
    });

    if (result.status === 'failed') {
      await ProviderDocument.findByIdAndUpdate(document._id, {
        $set: { status: 'failed', error: result.error ?? 'processing failed' },
      }).setOptions({ userId });
    }

    const updated = await ProviderDocument.findById(document._id).setOptions({ userId }).lean();
    res.statusCode = 200;
    res.end(JSON.stringify({
      document: {
        _id: updated?._id,
        fileName: updated?.fileName,
        mimeType: updated?.mimeType,
        status: updated?.status,
        error: updated?.error,
        driveWebLink: updated?.driveWebLink,
      },
      result: { status: result.status, error: result.error, intakeItemIds: result.intakeItemIds },
    }));
  } catch (error) {
    if (isInvalidGrant(error)) {
      await markReconnectRequired(userId);
      res.statusCode = 409;
      res.end(JSON.stringify({ error: 'Google authorization expired; reconnect required', reconnect: true }));
      return;
    }
    console.error('Document retry failed:', error);
    res.statusCode = 500; res.end(JSON.stringify({ error: 'Document retry failed' }));
  }
}
