"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Toast from "../components/Toast";
import { EnergyType, ToastMessage } from "../types";
import { deleteEnergyAction as deleteEnergyAction } from "@/actions/energy";
import EnergyTabs from "../components/energy/EnergyDisplay";
import { AddEnergyDataIcon } from "../components/icons";

const Dashboard = () => {
  const router = useRouter();
  const [energyData, setEnergyData] = useState<EnergyType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

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
    <div className="app-root">
      <main className="dashboard-main">
        {error && (
          <div className="alert-error">
            {error}
          </div>
        )}

        <EnergyTabs energyData={energyData} onDelete={onDelete} />

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
