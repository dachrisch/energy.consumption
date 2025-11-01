import { useState, useCallback, useEffect } from "react";
import { EnergyType } from "@/app/types";

/**
 * Custom hook for fetching and managing energy data
 * Centralizes data fetching logic and state management
 */
export const useEnergyData = () => {
  const [data, setData] = useState<EnergyType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/energy");

      if (!response.ok) {
        throw new Error("Failed to fetch energy data");
      }

      const jsonData = await response.json();
      const parsedData = jsonData.map((item: { date: string | number | Date }) => ({
        ...item,
        date: new Date(item.date),
      }));

      setData(parsedData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load energy data";
      setError(errorMessage);
      console.error("Error fetching energy data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
};
