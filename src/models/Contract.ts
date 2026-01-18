import { ContractType } from "@/app/types";
import mongoose, { model, Schema } from "mongoose";
import { applyPreFilter } from "./sessionFilter";


const ContractSchema = new Schema<ContractType>({
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
  meterId: {
    type: String,
    ref: 'Meter',
    index: true
  },
  userId: {
    type: String,
    ref: 'User',
    index: true
  }
}, {
  timestamps: true
});

applyPreFilter(ContractSchema);

const Contract =
  mongoose.models?.Contract ||
  model<ContractType>("Contract", ContractSchema);

export default Contract;