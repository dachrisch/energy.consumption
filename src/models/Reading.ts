import mongoose from 'mongoose';
import { applyPreFilter } from './sessionFilter';

const readingSchema = new mongoose.Schema({
  meterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meter', required: true },
  value: { type: Number, required: true },
  date: { type: Date, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Prevent duplicate readings for the same meter and date
readingSchema.index({ meterId: 1, date: 1, userId: 1 }, { unique: true });

applyPreFilter(readingSchema);

const Reading = mongoose.models.Reading || mongoose.model('Reading', readingSchema);
export default Reading;
