"use client";

import { useState, useEffect } from "react";
import Toast from "../components/Toast";
import { EnergyType, ContractType, ToastMessage } from "../types";
import { deleteEnergyAction } from "@/actions/energy";
import DashboardTabs from "../components/DashboardTabs";

const EnergyHistory = () => {
  const [energyData, setEnergyData] = useState<EnergyType[]>([]);
  const [contracts, setContracts] = useState<ContractType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

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

  if (isLoading) {
    return (
      <div className="app-root">
        <main className="dashboard-main">
          <h1 className="app-heading">Energy History</h1>
          <p>Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="app-root" data-testid="energy-history">
      <main className="dashboard-main">
        <div className="page-header">
          <h1 className="app-heading">Energy History</h1>
          <p className="page-description">
            View detailed energy consumption data, charts, and analytics
          </p>
        </div>

        {error && (
          <div className="alert-error">
            {error}
          </div>
        )}

        <DashboardTabs energyData={energyData} contracts={contracts} onDelete={onDelete} />

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </main>
    </div>
  );
};

export default EnergyHistory;
