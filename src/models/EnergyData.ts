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
});
const EnergyData =
  mongoose.models?.EnergyData ||
  model<EnergyDataType>("EnergyData", EnergyDataSchema);

export default EnergyData;
