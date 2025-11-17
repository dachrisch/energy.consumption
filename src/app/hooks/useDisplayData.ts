/**
 * useDisplayData Hook (Phase 2: Frontend Adapter)
 *
 * Custom hook for fetching pre-calculated display data from the new backend.
 * Uses the DisplayDataCalculationService via /api/v2/display-data route.
 *
 * Features:
 * - Fetches cached display data when available
 * - Calculates on-demand when cache miss
 * - Tracks cache hit/miss for monitoring
 * - Compatible with existing useEnergyData interface
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { DisplayDataType } from '@/app/types';

interface UseDisplayDataOptions {
  displayType: DisplayDataType;
  filters?: Record<string, unknown>;
  enabled?: boolean; // Allow conditional fetching
}

interface UseDisplayDataResult {
  data: unknown;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  cacheHit?: boolean; // Expose for monitoring
}

/**
 * Fetch pre-calculated display data
 *
 * @param options - Display type, filters, and enabled flag
 * @returns Display data, loading state, error, refetch function, cache hit indicator
 */
export function useDisplayData(options: UseDisplayDataOptions): UseDisplayDataResult {
  const { displayType, filters = {}, enabled = true } = options;
  const { data: session } = useSession();
  const [data, setData] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheHit, setCacheHit] = useState<boolean | undefined>(undefined);

  // Serialize filters for stable dependency
  const filtersJson = JSON.stringify(filters);

  const fetchData = useCallback(async () => {
    if (!session?.user?.id || !enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v2/display-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayType, filters }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch display data');
      }

      const result = await response.json();
      setData(result.data);
      setCacheHit(result.cacheHit);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load display data';
      setError(errorMessage);
      console.error('Error fetching display data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, displayType, filtersJson, enabled, filters]);

  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled, fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    cacheHit,
  };
}
