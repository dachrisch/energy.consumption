import mongoose from 'mongoose';
import { applyPreFilter } from './sessionFilter';

export const DOCUMENT_STATUSES = ['new', 'parsed', 'needs_review', 'imported', 'failed'] as const;

/**
 * One ingested provider document (bill PDF, CSV export, ...). The original lives
 * in the user's Drive; this collection holds only metadata and extracted fields.
 * `sha256` makes ingestion idempotent across repeated syncs.
 */
const providerDocumentSchema = new mongoose.Schema({
  /** Contract provider this document was attributed to. */
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
  processedAt: { type: Date },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

providerDocumentSchema.index({ userId: 1, sha256: 1 }, { unique: true });
providerDocumentSchema.index({ userId: 1, status: 1 });

applyPreFilter(providerDocumentSchema);

const ProviderDocument = mongoose.models.ProviderDocument
  || mongoose.model('ProviderDocument', providerDocumentSchema);
export default ProviderDocument;
