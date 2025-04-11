import mongoose, { Schema, model } from "mongoose";

export type FeatureFlagDocument = {
  _id: string;
  name: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const FeatureFlagSchema = new Schema<FeatureFlagDocument>(
  {
    name: {
      type: String,
      unique: true,
      required: [true, "Feature flag name is required"],
    },
    enabled: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const FeatureFlag = mongoose.models?.FeatureFlag || model<FeatureFlagDocument>("FeatureFlag", FeatureFlagSchema);

export default FeatureFlag; 