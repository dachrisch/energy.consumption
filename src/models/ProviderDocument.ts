import mongoose from 'mongoose';
import { applyPreFilter } from './sessionFilter';

export const DOCUMENT_STATUSES = ['new', 'parsed', 'needs_review', 'imported', 'failed'] as const;

/**
 * A single extracted fact awaiting a decision. Provider data never writes
 * straight into `Reading`/`Bill` — it lands here first and the user (or an
 * unambiguous match) promotes it.
 *
 * - `pending`  nothing to compare against, needs a decision
 * - `agrees`   matches an existing reading within tolerance (auto-verified)
 * - `conflict` an existing reading disagrees; both are kept
 * - `accepted` promoted into Reading/Bill
 * - `rejected` dismissed by the user
 */
export const INTAKE_STATUSES = ['pending', 'agrees', 'conflict', 'accepted', 'rejected'] as const;

/** One staged fact, embedded in the document it was extracted from. */
const stagedFactSchema = new mongoose.Schema({
  kind: { type: String, enum: ['reading', 'bill'], required: true },
  meterNumber: { type: String },
  meterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meter' },
  date: { type: Date },
  value: { type: Number },
  unit: { type: String },
  periodStart: { type: Date },
  periodEnd: { type: Date },
  consumption: { type: Number },
  amountGross: { type: Number },
  amountNet: { type: Number },
  currency: { type: String, default: 'EUR' },
  /** Existing reading that this candidate was compared against. */
  matchedReadingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reading' },
  confidence: { type: Number },
  status: { type: String, enum: INTAKE_STATUSES, default: 'pending' },
  note: { type: String },
});

/**
 * One ingested provider document (bill PDF, CSV export, ...). The original lives
 * in the user's Drive; this collection holds only metadata, extracted fields and
 * the staged facts awaiting a decision. `sha256` makes ingestion idempotent
 * across repeated syncs.
 */
const providerDocumentSchema = new mongoose.Schema({
  /** Supplier this document was attributed to; null until a sender matches. */
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  /** Display snapshot of the supplier name at ingest time. */
  providerName: { type: String },
  source: { type: String, enum: ['gmail', 'upload'], required: true },
  gmailMessageId: { type: String },
  gmailAttachmentId: { type: String },
  subject: { type: String },
  from: { type: String },
  sha256: { type: String, required: true },
  fileName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number },
  receivedAt: { type: Date },
  driveFileId: { type: String },
  driveWebLink: { type: String },
  sidecarDriveId: { type: String },
  status: { type: String, enum: DOCUMENT_STATUSES, default: 'new' },
  error: { type: String },
  extracted: { type: mongoose.Schema.Types.Mixed },
  /** Facts extracted from this document, staged for accept/reject. */
  facts: { type: [stagedFactSchema], default: [] },
  processedAt: { type: Date },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

providerDocumentSchema.index({ userId: 1, sha256: 1 }, { unique: true });
providerDocumentSchema.index({ userId: 1, status: 1 });
providerDocumentSchema.index({ userId: 1, 'facts.status': 1 });

applyPreFilter(providerDocumentSchema);

const ProviderDocument = mongoose.models.ProviderDocument
  || mongoose.model('ProviderDocument', providerDocumentSchema);
export default ProviderDocument;
