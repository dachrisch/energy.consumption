"use client";

import { useState, useEffect } from "react";
import Toast from "../components/Toast";
import { EnergyType, ToastMessage, EnergyOptions } from "../types";
import { deleteEnergyAction } from "@/actions/energy";
import EnergyTableFilters from "../components/energy/EnergyTableFilters";
import EnergyTable from "../components/energy/EnergyTable";

const ReadingsPage = () => {
  const [energyData, setEnergyData] = useState<EnergyType[]>([]);
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

  const onDelete = async (id: string): Promise<void> => {
    try {
      await deleteEnergyAction(id);
      fetchEnergyData();
      setToast({
        message: "Energy data deleted",
        type: "success",
      });
    } catch (err) {
      setError("Failed to delete energy data");
      console.error(err);
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
            <h1 className="app-heading">Energy Readings</h1>
            <p className="page-description">View and manage all your meter readings</p>
          </div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-root" data-testid="readings-page">
      <div className="page-content">
        <div className="page-header">
          <h1 className="app-heading">Energy Readings</h1>
          <p className="page-description">View and manage all your meter readings</p>
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

          <EnergyTable
            energyData={energyData}
            onDelete={onDelete}
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

export default ReadingsPage;
