import mongoose, { Schema, model } from "mongoose";

export type FeatureFlagDocument = {
  _id: string;
  name: string;
  enabled: boolean;
  rolloutPercent: number; // 0-100 percentage for gradual rollout
  userWhitelist: string[]; // User IDs that always get the new feature
  userBlacklist: string[]; // User IDs that never get the new feature
  description?: string; // Optional description of what the flag controls
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
    rolloutPercent: {
      type: Number,
      default: 0,
      required: true,
      min: 0,
      max: 100,
    },
    userWhitelist: {
      type: [String],
      default: [],
    },
    userBlacklist: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const FeatureFlag = mongoose.models?.FeatureFlag || model<FeatureFlagDocument>("FeatureFlag", FeatureFlagSchema);

export default FeatureFlag; 