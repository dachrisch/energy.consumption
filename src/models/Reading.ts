import mongoose from 'mongoose';
import { applyPreFilter } from './sessionFilter';

export const READING_SOURCES = ['manual', 'ocr', 'import', 'provider'] as const;

const readingSchema = new mongoose.Schema({
  meterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meter', required: true },
  value: { type: Number, required: true },
  date: { type: Date, required: true },
  source: { type: String, enum: READING_SOURCES, default: 'manual' },
  /** Set when the value was confirmed by (or came from) a provider document. */
  providerDocId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProviderDocument' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Prevent duplicate readings for the same meter and date
readingSchema.index({ meterId: 1, date: 1, userId: 1 }, { unique: true });

applyPreFilter(readingSchema);

const Reading = mongoose.models.Reading || mongoose.model('Reading', readingSchema);
export default Reading;
