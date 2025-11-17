/**
 * useEnergyService Hook (Phase 2: Frontend Adapter)
 *
 * Unified hook that routes to old or new backend based on feature flags.
 * Provides backward-compatible interface with useEnergyData.
 *
 * Migration strategy:
 * 1. Components replace useEnergyData with useEnergyService
 * 2. Feature flag determines which backend to use
 * 3. Both backends return same data structure
 * 4. Instant rollback by toggling flag
 *
 * Features:
 * - Per-component feature flag support
 * - Rollout percentage support
 * - Force old/new for testing
 * - Identical interface to useEnergyData
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useEnergyData } from './useEnergyData';
import { EnergyType, EnergyFilters } from '@/app/types';
import { checkFeatureFlagForUser } from '@/app/actions/featureFlags';

interface UseEnergyServiceOptions {
  component?: string; // Component name for flag check (e.g., 'dashboard', 'energy_table')
  forceOld?: boolean; // Override flag to force old backend (testing)
  forceNew?: boolean; // Override flag to force new backend (testing)
  filters?: EnergyFilters; // Optional filters for new backend
}

interface UseEnergyServiceResult {
  data: EnergyType[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  useNewBackend?: boolean; // Expose for debugging
}

/**
 * Adapter hook that routes to old or new backend
 *
 * @param options - Component name, force flags, and filters
 * @returns Energy data, loading state, error, refetch function, backend indicator
 */
export function useEnergyService(
  options: UseEnergyServiceOptions = {}
): UseEnergyServiceResult {
  const { component, forceOld = false, forceNew = false, filters } = options;
  const { data: session } = useSession();
  const [useNewBackend, setUseNewBackend] = useState(false);
  const [flagChecked, setFlagChecked] = useState(false);

  // Use old hook (existing implementation)
  const oldHook = useEnergyData();

  // State for new backend
  const [newData, setNewData] = useState<EnergyType[]>([]);
  const [newLoading, setNewLoading] = useState(false);
  const [newError, setNewError] = useState<string | null>(null);

  // Check feature flags on mount
  useEffect(() => {
    async function checkFlags() {
      // Force flags for testing
      if (forceOld) {
        setUseNewBackend(false);
        setFlagChecked(true);
        return;
      }
      if (forceNew) {
        setUseNewBackend(true);
        setFlagChecked(true);
        return;
      }

      // Check real feature flags
      if (!session?.user?.id) {
        setUseNewBackend(false);
        setFlagChecked(true);
        return;
      }

      try {
        // Check global flag first
        const globalEnabled = await checkFeatureFlagForUser(
          'NEW_BACKEND_ENABLED',
          session.user.id
        );

        if (!globalEnabled) {
          setUseNewBackend(false);
          setFlagChecked(true);
          return;
        }

        // Check component-specific flag if provided
        if (component) {
          const componentFlagName = `${component.toUpperCase()}_NEW_BACKEND`;
          const componentEnabled = await checkFeatureFlagForUser(
            componentFlagName,
            session.user.id
          );
          setUseNewBackend(componentEnabled);
        } else {
          setUseNewBackend(globalEnabled);
        }
      } catch (error) {
        console.error('Error checking feature flags:', error);
        setUseNewBackend(false); // Default to old backend on error
      } finally {
        setFlagChecked(true);
      }
    }

    checkFlags();
  }, [component, forceOld, forceNew, session?.user?.id]);

  // Serialize filters for stable dependency
  const filtersJson = filters ? JSON.stringify(filters) : '';

  // Fetch from new backend
  const fetchNewBackend = useCallback(async () => {
    if (!session?.user?.id) return;

    setNewLoading(true);
    setNewError(null);

    try {
      const response = await fetch('/api/v2/energy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch energy data');
      }

      const result = await response.json();
      const parsedData = result.data.map((item: { date: string | number | Date }) => ({
        ...item,
        date: new Date(item.date),
      }));

      setNewData(parsedData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load energy data';
      setNewError(errorMessage);
      console.error('Error fetching energy data from new backend:', err);
    } finally {
      setNewLoading(false);
    }
  }, [session?.user?.id, filtersJson, filters]);

  // Fetch from new backend when enabled and flag checked
  useEffect(() => {
    if (flagChecked && useNewBackend) {
      fetchNewBackend();
    }
  }, [flagChecked, useNewBackend, fetchNewBackend]);

  // Return appropriate hook result
  // During flag check, return loading state
  if (!flagChecked) {
    return {
      data: [],
      isLoading: true,
      error: null,
      refetch: async () => {},
      useNewBackend: undefined,
    };
  }

  if (useNewBackend) {
    return {
      data: newData,
      isLoading: newLoading,
      error: newError,
      refetch: fetchNewBackend,
      useNewBackend: true,
    };
  } else {
    return {
      data: oldHook.data,
      isLoading: oldHook.isLoading,
      error: oldHook.error,
      refetch: oldHook.refetch,
      useNewBackend: false,
    };
  }
}
