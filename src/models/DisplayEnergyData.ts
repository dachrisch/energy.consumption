import mongoose, { Schema, Document } from 'mongoose';
import { DisplayEnergyData as DisplayEnergyDataType } from '@/app/types';

export interface IDisplayEnergyData extends Document, Omit<DisplayEnergyDataType, '_id'> {}

const DisplayEnergyDataSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  displayType: { type: String, required: true, index: true },
  data: { type: Schema.Types.Mixed, required: true },
  calculatedAt: { type: Date, default: Date.now },
  sourceDataHash: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed },
});

// Ensure a user only has one active display data of a specific type (with same filters)
// Simplification for Phase 2: type includes the main filter (e.g. monthly-chart-power)
DisplayEnergyDataSchema.index({ userId: 1, displayType: 1 }, { unique: true });

const DisplayEnergyData = mongoose.models.DisplayEnergyData || 
  mongoose.model<IDisplayEnergyData>('DisplayEnergyData', DisplayEnergyDataSchema);

export default DisplayEnergyData;
export { DisplayEnergyData };