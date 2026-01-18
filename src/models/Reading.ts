import { Reading as ReadingType } from "@/app/types";
import mongoose, { model, Schema } from "mongoose";
import { applyPreFilter } from "./sessionFilter";

const ReadingSchema = new Schema<ReadingType>(
  {
    meterId: {
      type: String,
      ref: "Meter",
      required: true,
      index: true,
    },
    value: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
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

applyPreFilter(ReadingSchema);

const Reading =
  mongoose.models?.Reading ||
  model<ReadingType>("Reading", ReadingSchema);

export default Reading;
