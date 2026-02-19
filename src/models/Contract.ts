import mongoose from 'mongoose';
import { applyPreFilter } from './sessionFilter';

const contractSchema = new mongoose.Schema({
  providerName: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  basePrice: { type: Number, required: true }, // Monthly fixed fee
  workingPrice: { type: Number, required: true }, // Price per unit
  meterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meter', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

applyPreFilter(contractSchema);

// Force schema update by deleting existing model if it exists
if (mongoose.models.Contract) {
  delete mongoose.models.Contract;
}

const Contract = mongoose.model('Contract', contractSchema);
export default Contract;
