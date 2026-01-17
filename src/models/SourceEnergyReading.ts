import mongoose, { Schema, Document } from 'mongoose';
import { SourceEnergyReading as SourceEnergyReadingType } from '@/app/types';

export interface ISourceEnergyReading extends Document, Omit<SourceEnergyReadingType, '_id'> {}

const SourceEnergyReadingSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  date: { type: Date, required: true },
  type: { type: String, enum: ['power', 'gas'], required: true },
  amount: { type: Number, required: true },
  unit: { type: String, required: true },
  provider: { type: String },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Compound unique index to prevent duplicate readings
SourceEnergyReadingSchema.index({ userId: 1, date: 1, type: 1 }, { unique: true });

const SourceEnergyReading = mongoose.models.SourceEnergyReading || 
  mongoose.model<ISourceEnergyReading>('SourceEnergyReading', SourceEnergyReadingSchema);

export default SourceEnergyReading;
export { SourceEnergyReading };