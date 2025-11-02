"use client";

import { useState, useEffect } from "react";
import Toast from "../components/Toast";
import { EnergyType, ContractType, ToastMessage, EnergyOptions } from "../types";
import EnergyTableFilters from "../components/energy/EnergyTableFilters";
import UnifiedEnergyChart from "../components/energy/UnifiedEnergyChart";

const ChartsPage = () => {
  const [energyData, setEnergyData] = useState<EnergyType[]>([]);
  const [contracts, setContracts] = useState<ContractType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [typeFilter, setTypeFilter] = useState<EnergyOptions | "all">("all");
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
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
    setTypeFilter("all");
    setDateRange({ start: null, end: null });
  };

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
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            dateRange={dateRange}
            setDateRange={setDateRange}
            onReset={handleResetFilters}
          />

          <UnifiedEnergyChart
            energyData={energyData}
            contracts={contracts}
            typeFilter={typeFilter}
            dateRange={dateRange}
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
