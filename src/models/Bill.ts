import mongoose from 'mongoose';
import { applyPreFilter } from './sessionFilter';

/**
 * What the provider actually billed for a period, kept separate from what the
 * contract rates compute. The difference between the two is the variance the
 * dashboard reports.
 */
const billSchema = new mongoose.Schema({
  meterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meter', required: true },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  providerName: { type: String },
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProviderDocument' },
  periodStart: { type: Date },
  periodEnd: { type: Date },
  consumption: { type: Number },
  unit: { type: String },
  amountGross: { type: Number },
  amountNet: { type: Number },
  currency: { type: String, default: 'EUR' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

billSchema.index({ userId: 1, meterId: 1, periodEnd: 1 });

applyPreFilter(billSchema);

const Bill = mongoose.models.Bill || mongoose.model('Bill', billSchema);
export default Bill;
