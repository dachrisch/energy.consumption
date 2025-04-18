import { EnergyContractType } from "@/app/types";
import mongoose, { model, Schema } from "mongoose";


const EnergyContractSchema = new Schema<EnergyContractType>({
  type: {
    type: String,
    required: true,
    enum: ["power", "gas"]
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  basePrice: {
    type: Number,
    required: true
  },
  workingPrice: {
    type: Number,
    required: true
  },
  userId: {
    type: String,
    ref: 'User',
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Add schema validation to ensure userId is always present
EnergyContractSchema.pre('save', function(next) {
  if (!this.userId) {
    throw new Error('userId is required');
  }
  next();
});

const EnergyContract =
  mongoose.models?.Contract ||
  model<EnergyContractType>("EnergyContract", EnergyContractSchema);

export default EnergyContract;