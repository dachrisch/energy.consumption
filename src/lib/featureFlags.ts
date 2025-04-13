'use server';

import { connectDB } from "./mongodb";
import FeatureFlag from "@/models/FeatureFlag";

export const isFeatureEnabled = async (featureName: string): Promise<boolean> => {
  await connectDB();
  const flag = await FeatureFlag.findOne({ name: featureName });
  return flag?.enabled ?? false;
}; 