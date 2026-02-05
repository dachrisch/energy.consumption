import mongoose from 'mongoose';
import { applyPreFilter } from './sessionFilter';

const meterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  meterNumber: { type: String, required: true },
  type: { type: String, enum: ['power', 'gas'], required: true },
  unit: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Compound unique index to ensure uniqueness is scoped per user
meterSchema.index({ meterNumber: 1, userId: 1 }, { unique: true });

applyPreFilter(meterSchema);

const Meter = mongoose.models.Meter || mongoose.model('Meter', meterSchema);
export default Meter;
