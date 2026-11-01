import mongoose from 'mongoose';
import { applyPreFilter } from './sessionFilter';

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

const intakeItemSchema = new mongoose.Schema({
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProviderDocument', required: true },
  providerName: { type: String },
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
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

intakeItemSchema.index({ userId: 1, status: 1 });
intakeItemSchema.index({ userId: 1, documentId: 1 });

applyPreFilter(intakeItemSchema);

const IntakeItem = mongoose.models.IntakeItem || mongoose.model('IntakeItem', intakeItemSchema);
export default IntakeItem;
