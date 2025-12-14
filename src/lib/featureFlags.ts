'use server';

import { connectDB } from "./mongodb";
import FeatureFlag, { FeatureFlagDocument } from "@/models/FeatureFlag";

/**
 * Check if feature is enabled (basic check, no user-specific logic)
 * @param featureName - Feature flag name
 * @returns true if feature is enabled
 */
export const isFeatureEnabled = async (featureName: string): Promise<boolean> => {
  await connectDB();
  const flag = await FeatureFlag.findOne({ name: featureName });
  return flag?.enabled ?? false;
};

/**
 * Check if feature is enabled for a specific user (with rollout support)
 *
 * Evaluation order:
 * 1. If flag doesn't exist or is disabled → false
 * 2. If user is in whitelist → true (always)
 * 3. If user is in blacklist → false (always)
 * 4. If rolloutPercent is 100 → true
 * 5. If rolloutPercent is 0 → false
 * 6. Use deterministic hash to check if user falls within rollout percentage
 *
 * @param featureName - Feature flag name
 * @param userId - User ID for deterministic rollout
 * @returns true if feature enabled for this user
 */
export async function isFeatureEnabledForUser(
  featureName: string,
  userId: string
): Promise<boolean> {
  const flag = await getFeatureFlag(featureName);
  if (!flag) return false;

  // Check whitelist FIRST (always enabled, even if flag is disabled)
  if (flag.userWhitelist?.includes(userId)) return true;

  // Check blacklist SECOND (always disabled, even if flag is enabled)
  if (flag.userBlacklist?.includes(userId)) return false;

  // Now check if flag is enabled
  if (!flag.enabled) return false;

  // Percentage rollout (deterministic based on userId)
  if (flag.rolloutPercent === 100) return true;
  if (flag.rolloutPercent === 0) return false;

  // Hash userId to get deterministic number 0-99
  const hash = hashUserId(userId);
  return hash < flag.rolloutPercent;
}

/**
 * Get feature flag from database
 * @param name - Feature flag name
 * @returns Feature flag document or null
 */
export async function getFeatureFlag(name: string): Promise<FeatureFlagDocument | null> {
  await connectDB();
  return await FeatureFlag.findOne({ name }).exec();
}

/**
 * Create or update feature flag
 * @param name - Feature flag name
 * @param config - Partial flag configuration to set
 * @returns Updated feature flag
 */
export async function setFeatureFlag(
  name: string,
  config: Partial<FeatureFlagDocument>
): Promise<FeatureFlagDocument> {
  await connectDB();
  return await FeatureFlag.findOneAndUpdate(
    { name },
    { $set: config },
    { upsert: true, new: true }
  ).exec();
}

/**
 * Hash userId to deterministic number 0-99
 * Same user always gets same hash (stable rollout)
 *
 * Uses simple string hash algorithm (similar to Java's hashCode)
 *
 * @param userId - User ID to hash
 * @returns Number between 0 and 99
 */
function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash) % 100;
} 