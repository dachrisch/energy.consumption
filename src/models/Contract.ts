import mongoose from 'mongoose';
import { applyPreFilter } from './sessionFilter';

const contractSchema = new mongoose.Schema({
  providerName: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  basePrice: { type: Number, required: true }, // Monthly fixed fee
  workingPrice: { type: Number, required: true }, // Price per unit
  meterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meter', required: true },
  /**
   * How this provider's mail is recognised for the intake. There is no separate
   * provider collection: `providerName` already identifies the provider here,
   * so its mail settings live with it. Read as the union over a provider's
   * contracts, written to all of them at once.
   */
  senders: { type: [String], default: [] },
  subjectHints: { type: [String], default: [] },
  /** Optional raw Gmail search query; wins over the generated sender query. */
  gmailQuery: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

applyPreFilter(contractSchema);

// Force schema update by deleting existing model if it exists
if (mongoose.models.Contract) {
  delete mongoose.models.Contract;
}

const Contract = mongoose.model('Contract', contractSchema);
export default Contract;
