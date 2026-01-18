import { Meter as MeterType } from "@/app/types";
import mongoose, { model, Schema } from "mongoose";
import { applyPreFilter } from "./sessionFilter";

const MeterSchema = new Schema<MeterType>(
  {
    name: {
      type: String,
      required: true,
    },
    meterNumber: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["power", "gas"],
    },
    unit: {
      type: String,
      required: true,
      default: "kWh",
    },
    userId: {
      type: String,
      ref: "User",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

applyPreFilter(MeterSchema);

const Meter =
  mongoose.models?.Meter ||
  model<MeterType>("Meter", MeterSchema);

export default Meter;
