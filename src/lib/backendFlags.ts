'use server';

import { getServerSession } from 'next-auth';
import { 
  isFeatureEnabledForUser, 
  isFeatureEnabled, 
  getFeatureFlag,
  setFeatureFlag 
} from './featureFlags';

/**
 * Backend flag naming convention:
 * - Global: "NEW_BACKEND_ENABLED"
 * - Component-specific: "{COMPONENT}_NEW_BACKEND" (e.g., "DASHBOARD_NEW_BACKEND")
 *
 * Evaluation order:
 * 1. Check global NEW_BACKEND_ENABLED flag
 * 2. If component specified, check component-specific flag
 * 3. Component flag enabled=true → overrides global (uses component rollout/whitelist logic)
 * 4. Component flag enabled=false or doesn't exist → falls back to global flag
 */

/**
 * Check if a specific component should use the new backend
 *
 * Priority:
 * 1. Environment variables (NEXT_PUBLIC_ENABLE_{COMPONENT}_NEW_BACKEND)
 * 2. Global switch (NEXT_PUBLIC_ENABLE_NEW_BACKEND)
 * 3. Feature flags in DB (supports rollout, whitelist, etc.)
 *
 * @param component - Component name (e.g., 'charts', 'dashboard', 'form')
 * @param userId - Optional user ID for targeted rollout
 * @returns boolean - true if new backend should be used
 */
export async function checkBackendFlag(
  component: string = 'NEW_BACKEND',
  userId?: string
): Promise<boolean> {
  const comp = component || 'NEW_BACKEND';
  
  // Priority 1: Environment Variables (Immediate override)
  const envFlag = `NEXT_PUBLIC_ENABLE_${comp.toUpperCase()}_NEW_BACKEND`;
  if (process.env[envFlag] === 'true') return true;
  if (process.env[envFlag] === 'false') return false;

  // Priority 2: Global Switch Env Var
  if (process.env.NEXT_PUBLIC_ENABLE_NEW_BACKEND === 'true') return true;
  if (process.env.NEXT_PUBLIC_ENABLE_NEW_BACKEND === 'false') return false;

  // Priority 3: Database (Feature Flags)
  let resolvedUserId = userId;
  if (!resolvedUserId) {
    const session = await getServerSession();
    resolvedUserId = session?.user?.id;
  }

  // 1. Check Global Flag
  let globalEnabled = false;
  try {
    if (resolvedUserId) {
      globalEnabled = await isFeatureEnabledForUser('NEW_BACKEND_ENABLED', resolvedUserId);
    } else {
      globalEnabled = await isFeatureEnabled('NEW_BACKEND_ENABLED');
    }
  } catch (error) {
    console.error(`[BackendFlags] Error checking global flag:`, error);
  }

  // If no specific component, return global
  if (comp.toUpperCase() === 'NEW_BACKEND') {
    return globalEnabled;
  }

  // 2. Check Component Flag
  const componentFlagName = `${comp.toUpperCase()}_NEW_BACKEND`;
  
  try {
    const flag = await getFeatureFlag(componentFlagName);
    
    // If flag doesn't exist, fallback to global
    if (!flag) return globalEnabled;

    // Component flag exists, check its value for this user
    let componentEnabled = false;
    if (resolvedUserId) {
      componentEnabled = await isFeatureEnabledForUser(componentFlagName, resolvedUserId);
    } else {
      componentEnabled = await isFeatureEnabled(componentFlagName);
    }

    // Explicit override if flag exists
    return componentEnabled;
  } catch (error) {
    console.error(`[BackendFlags] Error checking flag ${componentFlagName}:`, error);
    return globalEnabled;
  }
}

/**
 * Check if new backend is enabled globally (without user context)
 * @returns true if global flag is enabled
 */
export async function isNewBackendEnabled(): Promise<boolean> {
  return await isFeatureEnabled('NEW_BACKEND_ENABLED');
}

/**
 * Initialize default backend feature flags
 */
export async function initializeBackendFlags(): Promise<void> {
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
 */
export async function getAllBackendFlags() {
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
