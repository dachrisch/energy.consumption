import { EnergyType as EnergyType } from "@/app/types";
import mongoose, { model, Schema } from "mongoose";
import { applyPreFilter } from "./sessionFilter";

const EnergySchema = new Schema<EnergyType>(
  {
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["power", "gas"],
    },
    date: {
      type: Date,
      required: true,
    },
    userId: {
      type: String,
      ref: "User",
      index: true
    },
  },
  {
    timestamps: true,
  }
);

applyPreFilter(EnergySchema);

const Energy =
  mongoose.models?.Energy ||
  model<EnergyType>("Energy", EnergySchema, "energies");

export default Energy;
