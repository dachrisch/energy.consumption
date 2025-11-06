"use client";

import { useState, useEffect, useMemo } from "react";
import Toast from "../components/Toast";
import { EnergyType, ToastMessage } from "../types";
import MonthlyMeterReadingsChart from "../components/energy/MonthlyMeterReadingsChart";

const ChartsPage = () => {
  const [energyData, setEnergyData] = useState<EnergyType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Calculate available years from energy data
  const availableYears = useMemo(() => {
    if (energyData.length === 0) return [];

    const years = new Set<number>();
    energyData.forEach(reading => {
      years.add(reading.date.getFullYear());
    });

    // Sort descending (newest first)
    return Array.from(years).sort((a, b) => b - a);
  }, [energyData]);

  // Default to most recent year with data
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    const currentYear = new Date().getFullYear();
    return currentYear;
  });

  // Update selected year when data loads
  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  useEffect(() => {
    fetchEnergyData();
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
          <p className="page-description">Monthly meter readings with actual, interpolated, and extrapolated values</p>
        </div>

        {error && (
          <div className="alert-error">
            {error}
          </div>
        )}

        <div className="content-card">
          <MonthlyMeterReadingsChart
            energyData={energyData}
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            availableYears={availableYears}
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
