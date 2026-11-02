import mongoose from 'mongoose';
import { applyPreFilter } from './sessionFilter';

/**
 * A utility supplier ("Versorger"). It owns the identity and the mail settings
 * used by the intake; contracts reference it for pricing and validity.
 *
 * There is exactly one supplier per (user, normalized name). Contracts are
 * created by naming a supplier — the API upserts it — so a supplier can exist
 * before (or after) any contract, which is what lets mail sync run early.
 */
const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  /** Lower-cased, trimmed name; the per-user uniqueness key. */
  nameKey: { type: String, required: true },
  /** How this supplier's mail is recognised by the intake. */
  senders: { type: [String], default: [] },
  subjectHints: { type: [String], default: [] },
  /** Optional raw Gmail search query; wins over the generated sender query. */
  gmailQuery: { type: String, default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

supplierSchema.index({ userId: 1, nameKey: 1 }, { unique: true });

applyPreFilter(supplierSchema);

export function normalizeSupplierName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

const Supplier = mongoose.models.Supplier || mongoose.model('Supplier', supplierSchema);
export default Supplier;
