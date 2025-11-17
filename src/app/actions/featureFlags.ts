/**
 * Feature Flag Server Actions
 *
 * Server-side actions for checking feature flags from client components.
 * These actions can be called from client components via "use server".
 */

'use server';

import { isFeatureEnabledForUser } from '@/lib/featureFlags';

/**
 * Check if feature flag is enabled for a specific user
 *
 * @param flagName - Feature flag name
 * @param userId - User ID for deterministic rollout
 * @returns true if feature enabled for this user
 */
export async function checkFeatureFlagForUser(
  flagName: string,
  userId: string
): Promise<boolean> {
  return await isFeatureEnabledForUser(flagName, userId);
}
