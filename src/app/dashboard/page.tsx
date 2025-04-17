"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Toast from "../components/Toast";
import { EnergyDataType } from "../types";
import {  deleteEnergy } from "@/actions/energyData";
import EnergyTabs from "../components/EnergyTabs";

const Dashboard = () => {
  const router = useRouter();
  const [energyData, setEnergyDataType] = useState<EnergyDataType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  useEffect(() => {
    fetchEnergyDataType();
  }, []);

  const fetchEnergyDataType = async () => {
    try {
      const response = await fetch("/api/energy");
      if (!response.ok) throw new Error("Failed to fetch data");
      const data = await response.json();
      const parsed = data.map((item: { date: string | number | Date }) => ({
        ...item,
        date: new Date(item.date),
      }));
      setEnergyDataType(parsed);
    } catch (err) {
      setError("Failed to load energy data");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const onDelete = async (id: string): Promise<void> => {
    try {
      await deleteEnergy(id);
      fetchEnergyDataType();
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
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
