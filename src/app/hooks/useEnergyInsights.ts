'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  EnergyOptions, 
  UnifiedInsightData, 
  InsightDataPoint,
  ProjectionResult,
  DisplayDataType,
  MonthlyDataPoint
} from '@/app/types';
import { getProjectionsAction } from '@/actions/projections';
import { UnifiedInsightsService } from '@/app/services/UnifiedInsightsService';

interface UseEnergyInsightsResult {
  data: UnifiedInsightData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and combine historical energy data and future projections
 * 
 * @param energyType - 'power' or 'gas'
 * @param year - Year to analyze
 * @returns Combined insights data, loading state, error, and refetch function
 */
export function useEnergyInsights(energyType: EnergyOptions, year: number): UseEnergyInsightsResult {
  const { data: session } = useSession();
  const [data, setData] = useState<UnifiedInsightData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      // API v2 expects 'monthly-chart' and the type in filters
      
      // Fetch both history and projections in parallel
      const [historyResponse, projectionsData] = await Promise.all([
        fetch('/api/v2/display-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            displayType: 'monthly-chart', 
            filters: { year, type: energyType } 
          }),
        }),
        getProjectionsAction(energyType)
      ]);

      if (!historyResponse.ok) {
        throw new Error('Failed to fetch historical data');
      }

      const historyJson = await historyResponse.json();
      // historyJson.data is the DisplayEnergyData object, historyJson.data.data is the actual data points
      const historyData = historyJson.data?.data as any[] || [];

      if (!projectionsData) {
        throw new Error('Failed to fetch projections');
      }

      // Use the centralized service for transformation
      const unifiedData = UnifiedInsightsService.transformToUnifiedData(
        historyData,
        projectionsData,
        energyType,
        year
      );

      setData(unifiedData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load insights';
      setError(errorMessage);
      console.error('Error fetching insights:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, energyType, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}
