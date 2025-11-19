'use server';

import { getServerSession } from 'next-auth';
import { isFeatureEnabledForUser, isFeatureEnabled } from './featureFlags';

/**
 * Backend flag naming convention:
 * - Global: "NEW_BACKEND_ENABLED"
 * - Component-specific: "{COMPONENT}_NEW_BACKEND" (e.g., "DASHBOARD_NEW_BACKEND")
 *
 * Evaluation order:
 * 1. Check global NEW_BACKEND_ENABLED flag
 * 2. If component specified, check component-specific flag
 * 3. Component flag overrides global flag
 */

/**
 * Check if new backend should be used for a component
 *
 * @param component - Component name (e.g., 'dashboard', 'charts', 'timeline')
 * @param userId - Optional user ID (if not provided, gets from session)
 * @returns true if new backend should be used
 *
 * @example
 * // In server action/component
 * const useNew = await checkBackendFlag('dashboard');
 *
 * // With specific user
 * const useNew = await checkBackendFlag('dashboard', 'user123');
 *
 * // Global check (no component)
 * const useNew = await checkBackendFlag();
 */
export async function checkBackendFlag(
  component?: string,
  userId?: string
): Promise<boolean> {
  // Get userId from session if not provided
  let effectiveUserId = userId;
  if (!effectiveUserId) {
    const session = await getServerSession();
    effectiveUserId = session?.user?.id;
  }

  // If no user, default to disabled (safer)
  if (!effectiveUserId) {
    return false;
  }

  // Check global flag first
  const globalEnabled = await isFeatureEnabledForUser(
    'NEW_BACKEND_ENABLED',
    effectiveUserId
  );

  // If no component specified, return global flag result
  if (!component) {
    return globalEnabled;
  }

  // Check component-specific flag
  const componentFlagName = `${component.toUpperCase()}_NEW_BACKEND`;
  const componentEnabled = await isFeatureEnabledForUser(
    componentFlagName,
    effectiveUserId
  );

  // Component flag overrides global flag
  // This allows enabling globally but disabling for specific components (or vice versa)
  return componentEnabled;
}

/**
 * Check if new backend is enabled globally (without user context)
 * Use this for administrative checks or initialization
 *
 * @returns true if global flag is enabled
 */
export async function isNewBackendEnabled(): Promise<boolean> {
  return await isFeatureEnabled('NEW_BACKEND_ENABLED');
}

/**
 * Initialize default backend feature flags
 * Call this during app startup or migrations
 *
 * Creates flags if they don't exist:
 * - NEW_BACKEND_ENABLED: Global flag (default: disabled)
 * - DASHBOARD_NEW_BACKEND: Dashboard component (default: disabled)
 * - CHARTS_NEW_BACKEND: Charts page (default: disabled)
 * - TIMELINE_NEW_BACKEND: Timeline slider (default: disabled)
 * - CSV_IMPORT_NEW_BACKEND: CSV import (default: disabled)
 * - FORM_NEW_BACKEND: Add/Edit forms (default: disabled)
 */
export async function initializeBackendFlags(): Promise<void> {
  const { setFeatureFlag } = await import('./featureFlags');

  const defaultFlags = [
    {
      name: 'NEW_BACKEND_ENABLED',
      description: 'Global flag to enable new backend (Services + Repositories + Events)',
      enabled: false,
      rolloutPercent: 0,
    },
    {
      name: 'DASHBOARD_NEW_BACKEND',
      description: 'Use new backend for Dashboard component',
      enabled: false,
      rolloutPercent: 0,
    },
    {
      name: 'CHARTS_NEW_BACKEND',
      description: 'Use new backend for Charts page (monthly meter readings)',
      enabled: false,
      rolloutPercent: 0,
    },
    {
      name: 'TIMELINE_NEW_BACKEND',
      description: 'Use new backend for Timeline Slider component',
      enabled: false,
      rolloutPercent: 0,
    },
    {
      name: 'CSV_IMPORT_NEW_BACKEND',
      description: 'Use new backend for CSV import operations',
      enabled: false,
      rolloutPercent: 0,
    },
    {
      name: 'FORM_NEW_BACKEND',
      description: 'Use new backend for Add/Edit forms',
      enabled: false,
      rolloutPercent: 0,
    },
  ];

  for (const flag of defaultFlags) {
    try {
      await setFeatureFlag(flag.name, flag);
      console.log(`[BackendFlags] Initialized: ${flag.name}`);
    } catch (error) {
      console.error(`[BackendFlags] Failed to initialize ${flag.name}:`, error);
    }
  }
}

/**
 * Get all backend-related feature flags
 * Useful for admin UI or debugging
 *
 * @returns Array of backend feature flags
 */
export async function getAllBackendFlags() {
  const { getFeatureFlag } = await import('./featureFlags');

  const flagNames = [
    'NEW_BACKEND_ENABLED',
    'DASHBOARD_NEW_BACKEND',
    'CHARTS_NEW_BACKEND',
    'TIMELINE_NEW_BACKEND',
    'CSV_IMPORT_NEW_BACKEND',
    'FORM_NEW_BACKEND',
  ];

  const flags = await Promise.all(
    flagNames.map(async (name) => {
      const flag = await getFeatureFlag(name);
      return flag || { name, enabled: false, rolloutPercent: 0, description: 'Not initialized' };
    })
  );

  return flags;
}
