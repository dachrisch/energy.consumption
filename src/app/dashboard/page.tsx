"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Toast from "../components/Toast";
import { EnergyType, ContractType, ToastMessage } from "../types";
import { deleteEnergyAction } from "@/actions/energy";
import DashboardTabs from "../components/DashboardTabs";
import { AddEnergyDataIcon } from "../components/icons";

const Dashboard = () => {
  const router = useRouter();
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
      })
    } catch (err) {
      setError("Failed to delete energy data");
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="app-root">
        <main className="dashboard-main">
          <h1 className="app-heading">
            Energy Consumption Monitor
          </h1>
          <p>Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="app-root" data-testid="dashboard">
      <main className="dashboard-main">
        {error && (
          <div className="alert-error">
            {error}
          </div>
        )}

        <DashboardTabs energyData={energyData} contracts={contracts} onDelete={onDelete} />

        <button
          onClick={() => router.push("/add")}
          className="fab"
        >
          <AddEnergyDataIcon />
        </button>

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

export default Dashboard;
