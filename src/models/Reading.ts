import mongoose from 'mongoose';
import { applyPreFilter } from './sessionFilter';

const readingSchema = new mongoose.Schema({
  meterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meter', required: true },
  value: { type: Number, required: true },
  date: { type: Date, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

applyPreFilter(readingSchema);

const Reading = mongoose.models.Reading || mongoose.model('Reading', readingSchema);
export default Reading;
