import { isSupported, MAX_ATTACHMENT_BYTES } from '../../lib/google/gmail';
import { archiveDocument } from '../../lib/google/drive';
import type { DriveClientLike } from '../../lib/google/drive';
import { extractDocument } from './extract';
import type { ExtractedDocument } from './extract';
import { classifyReading, findMeterByNumber } from './reconcile';
import type { ClassifiedReading, ItemStatus } from './reconcile';
import ProviderDocument from '../../models/ProviderDocument';
import Bill from '../../models/Bill';
import mongoose from 'mongoose';

export interface ProcessableDocument {
  _id: string;
  mimeType: string;
  fileName: string;
  receivedAt: Date;
  size?: number;
  buffer: Buffer;
  textBody?: string;
  /** Already-processed documents are skipped so a retried sync is a no-op. */
  status?: string;
}

/** Suppliers are the contracts' owning companies; only the name and unit matter here. */
export interface SupplierRef {
  id?: string;
  name: string;
  defaultUnit?: string;
}

export interface MeterRef {
  _id: string;
  meterNumber: string;
  unit?: string;
}

export interface ReadingRef {
  _id: string;
  meterId: string;
  date: Date | string;
  value: number;
}

export interface PlannedIntakeItem {
  kind: 'reading';
  meterNumber?: string;
  meterId?: string;
  date: string;
  value: number;
  unit?: string;
  status: ItemStatus;
  matchedReadingId?: string;
  note?: string;
  confidence?: number;
}

export interface PlannedBill {
  meterId: string;
  periodStart?: string;
  periodEnd?: string;
  consumption?: number;
  unit?: string;
  amountGross?: number;
  amountNet?: number;
  currency: string;
}

export interface PlannedIntake {
  items: PlannedIntakeItem[];
  bill?: PlannedBill;
}

export interface ProcessDocumentArgs {
  document: ProcessableDocument;
  supplier: SupplierRef;
  userId: string;
  meters?: MeterRef[];
  readings?: ReadingRef[];
  /** Decrypted per-user Gemini key; PDFs need it, delimited files do not. */
  apiKey?: string;
  drive?: DriveClientLike;
  rootFolderId?: string;
}

export interface ProcessResult {
  status: 'parsed' | 'failed' | 'skipped';
  intakeItemIds: string[];
  billId?: string;
  driveFileId?: string;
  driveWebLink?: string;
  sidecarDriveId?: string;
  error?: string;
}

const ALREADY_PROCESSED = new Set(['parsed', 'needs_review', 'imported']);

function failed(error: string): ProcessResult {
  return { status: 'failed', intakeItemIds: [], error };
}

/**
 * Decide what a document's extracted facts mean without touching the database:
 * meter lookup, agreement/conflict classification against the readings of that
 * meter only, and whether a bill can be attributed.
 */
export function planIntake(
  extracted: ExtractedDocument,
  meters: MeterRef[],
  readings: ReadingRef[],
): PlannedIntake {
  const meter = findMeterByNumber(meters, extracted.meterNumber);
  const meterReadings = meter
    ? readings.filter((reading) => String(reading.meterId) === String(meter._id))
    : [];

  const items: PlannedIntakeItem[] = extracted.readings.map((reading) => {
    const classified: ClassifiedReading = meter
      ? classifyReading(reading, meterReadings)
      : { status: 'pending', note: 'unknown meter number' };
    return {
      kind: 'reading',
      meterNumber: extracted.meterNumber,
      meterId: meter?._id,
      date: reading.date,
      value: reading.value,
      unit: reading.unit,
      status: classified.status,
      matchedReadingId: classified.matchedReadingId,
      note: classified.note,
      confidence: reading.confidence,
    };
  });

  const bill = extracted.bill && meter
    ? {
        meterId: meter._id,
        periodStart: extracted.bill.periodStart,
        periodEnd: extracted.bill.periodEnd,
        consumption: extracted.bill.consumption,
        unit: extracted.bill.unit ?? meter.unit,
        amountGross: extracted.bill.amountGross,
        amountNet: extracted.bill.amountNet,
        currency: extracted.bill.currency ?? 'EUR',
      }
    : undefined;

  return { items, bill };
}

export function folderYear(periodEnd: string | undefined, receivedAt: Date): number {
  const basis = periodEnd ? new Date(periodEnd) : new Date(receivedAt);
  return Number.isNaN(basis.getTime()) ? new Date(receivedAt).getUTCFullYear() : basis.getUTCFullYear();
}

function toDate(value: string | undefined): Date | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

/**
 * Turn one ingested document into Drive archive entries plus `IntakeItem`s (and
 * a `Bill` when the document states a period). Provider data never writes into
 * `Reading` here — promotion stays an explicit user action.
 */
export async function processDocument(args: ProcessDocumentArgs): Promise<ProcessResult> {
  const {
    document, supplier, userId, meters = [], readings = [], apiKey, drive, rootFolderId,
  } = args;

  if (document.status && ALREADY_PROCESSED.has(document.status)) {
    return { status: 'skipped', intakeItemIds: [] };
  }
  if (document.size && document.size > MAX_ATTACHMENT_BYTES) {
    return failed('attachment too large');
  }
  if (!document.buffer?.length) {
    return failed('no document bytes available');
  }

  // Only documents we could actually read are archived: Drive stores the
  // provider bills we understand, not every attachment the mail matched.
  let extracted: ExtractedDocument | undefined;
  let extractionError: string | undefined;
  if (!isSupported(document.mimeType)) {
    extractionError = 'unsupported format';
  } else {
    try {
      extracted = await extractDocument({
        mimeType: document.mimeType,
        buffer: document.buffer,
        textBody: document.textBody,
        unitHint: supplier.defaultUnit,
        apiKey,
      });
    } catch (error) {
      extractionError = error instanceof Error ? error.message : 'extraction failed';
    }
  }

  const plan = extracted ? planIntake(extracted, meters, readings) : undefined;
  if (!extracted || !plan) {
    return failed(extractionError ?? 'extraction failed');
  }

  let driveFileId: string | undefined;
  let driveWebLink: string | undefined;
  let sidecarDriveId: string | undefined;
  if (drive && rootFolderId) {
    try {
      const archived = await archiveDocument(drive, {
        rootFolderId,
        providerName: supplier.name,
        year: folderYear(extracted.bill?.periodEnd, document.receivedAt),
        fileName: document.fileName,
        mimeType: document.mimeType,
        buffer: document.buffer,
        extracted,
      });
      driveFileId = archived.fileId;
      driveWebLink = archived.webLink;
      sidecarDriveId = archived.sidecarId;
    } catch (error) {
      // A Drive hiccup must not throw the extracted facts away.
      console.warn(`Drive archive failed for ${document.fileName}:`, error);
    }
  }

  // Facts live on the document; accepting one is what promotes it.
  const facts = plan.items.map((item) => ({
    _id: new mongoose.Types.ObjectId(),
    ...item,
  }));

  let billId: string | undefined;
  if (plan.bill) {
    const created = await Bill.create({
      ...plan.bill,
      periodStart: toDate(plan.bill.periodStart),
      periodEnd: toDate(plan.bill.periodEnd),
      supplierId: supplier.id,
      providerName: supplier.name,
      documentId: document._id,
      userId,
    });
    billId = created._id.toString();
  }

  await ProviderDocument.findByIdAndUpdate(document._id, {
    $set: {
      extracted,
      facts,
      status: 'parsed',
      processedAt: new Date(),
      ...(driveFileId ? { driveFileId, driveWebLink, sidecarDriveId } : {}),
    },
    $unset: { error: '' },
  }).setOptions({ userId });

  return {
    status: 'parsed',
    intakeItemIds: facts.map((fact) => fact._id.toString()),
    billId,
    driveFileId,
    driveWebLink,
    sidecarDriveId,
  };
}
