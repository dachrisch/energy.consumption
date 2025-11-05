"use client";

import { useState, useEffect, useMemo } from "react";
import Toast from "../components/Toast";
import { EnergyType, ContractType, ToastMessage, EnergyOptions } from "../types";
import EnergyTableFilters from "../components/energy/EnergyTableFilters";
import UnifiedEnergyChart from "../components/energy/UnifiedEnergyChart";
import { DateRange } from "../components/energy/RangeSlider/types";
import { ENERGY_TYPES } from "../constants/energyTypes";

const ChartsPage = () => {
  const [energyData, setEnergyData] = useState<EnergyType[]>([]);
  const [contracts, setContracts] = useState<ContractType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // V3 API: Multi-select types (empty array = all types)
  const [selectedTypes, setSelectedTypes] = useState<EnergyOptions[]>([]);

  // V3 API: DateRange with non-null dates
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const now = new Date();
    const past = new Date(now);
    past.setFullYear(past.getFullYear() - 1);
    return { start: past, end: now };
  });

  useEffect(() => {
    fetchEnergyData();
    fetchContracts();
  }, []);

  const fetchEnergyData = async () => {
    try {
      const response = await fetch("/api/energy");
      if (!response.ok) throw new Error("Failed to fetch data");
      const data = await response.json();
      const parsed = data.map((item: { date: string | number | Date }) => ({
        ...item,
        date: new Date(item.date),
      }));
      setEnergyData(parsed);
    } catch (err) {
      setError("Failed to load energy data");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchContracts = async () => {
    try {
      const response = await fetch("/api/contracts");
      if (!response.ok) throw new Error("Failed to fetch contracts");
      const data = await response.json();
      const parsed = data.map((item: { startDate: string | number | Date; endDate?: string | number | Date }) => ({
        ...item,
        startDate: new Date(item.startDate),
        endDate: item.endDate ? new Date(item.endDate) : undefined,
      }));
      setContracts(parsed);
    } catch (err) {
      console.error("Failed to load contracts:", err);
    }
  };

  const handleResetFilters = () => {
    setSelectedTypes([]); // Empty = all types
    // Reset to full data range
    if (energyData.length > 0) {
      const dates = energyData.map((item) => new Date(item.date));
      setDateRange({
        start: new Date(Math.min(...dates.map((d) => d.getTime()))),
        end: new Date(Math.max(...dates.map((d) => d.getTime()))),
      });
    }
  };

  // Convert new API to old API for UnifiedEnergyChart (backward compatibility)
  const typeFilterLegacy: EnergyOptions | "all" = useMemo(() => {
    if (selectedTypes.length === 0 || selectedTypes.length === ENERGY_TYPES.length) {
      return "all";
    }
    return selectedTypes[0]; // Use first selected type
  }, [selectedTypes]);

  const dateRangeLegacy = useMemo(() => ({
    start: dateRange.start,
    end: dateRange.end,
  }), [dateRange]);

  if (isLoading) {
    return (
      <div className="app-root">
        <div className="page-content">
          <div className="page-header">
            <h1 className="app-heading">Energy Charts</h1>
            <p className="page-description">Visualize your energy consumption trends</p>
          </div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-root" data-testid="charts-page">
      <div className="page-content">
        <div className="page-header">
          <h1 className="app-heading">Energy Charts</h1>
          <p className="page-description">Visualize your energy consumption trends</p>
        </div>

        {error && (
          <div className="alert-error">
            {error}
          </div>
        )}

        <div className="content-card">
          <EnergyTableFilters
            energyData={energyData}
            selectedTypes={selectedTypes}
            onTypesChange={setSelectedTypes}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onReset={handleResetFilters}
          />

          <UnifiedEnergyChart
            energyData={energyData}
            contracts={contracts}
            typeFilter={typeFilterLegacy}
            dateRange={dateRangeLegacy}
          />
        </div>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
};

export default ChartsPage;
