import mongoose from 'mongoose';
import { applyPreFilter } from './sessionFilter';

const contractSchema = new mongoose.Schema({
  providerName: { type: String, required: true },
  type: { type: String, enum: ['power', 'gas'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  basePrice: { type: Number, required: true }, // Monthly fixed fee
  workingPrice: { type: Number, required: true }, // Price per unit
  meterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meter', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

applyPreFilter(contractSchema);

const Contract = mongoose.models.Contract || mongoose.model('Contract', contractSchema);
export default Contract;
