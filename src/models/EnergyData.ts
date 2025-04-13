import { EnergyDataType } from "@/app/types";
import mongoose, { model, Schema } from "mongoose";

const EnergyDataSchema = new Schema<EnergyDataType>({
  amount: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Add index for better query performance
  }
}, {
  timestamps: true
});

// Add schema validation to ensure userId is always present
EnergyDataSchema.pre('save', function(next) {
  if (!this.userId) {
    throw new Error('userId is required');
  }
  next();
});

const EnergyData =
  mongoose.models?.EnergyData ||
  model<EnergyDataType>("EnergyData", EnergyDataSchema);

export default EnergyData;
