"use client";

import { useState, useEffect } from "react";
import Toast from "../components/Toast";
import { EnergyDataType, NewEnergyDataType } from "../types";
import { getLatestValues } from "../handlers/energyHandlers";
import { addEnergy, deleteEnergy, importCSV } from "@/actions/energyData";
import EnergyTabs from "../components/EnergyTabs";
import { CSVDropZone } from "../components/add/CSVDropZone";
import AddEnergyForm from "../components/add/AddEnergyForm";

const Dashboard = () => {
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

  const onAddEnergy = async (newData: NewEnergyDataType) => {
    console.log("onAddEnergy");
    try {
      const addResult = await addEnergy(newData);
      console.log(`addResult: ${JSON.stringify(addResult)}`);
      fetchEnergyDataType();
    } catch (err) {
      setError("Failed to add energy data");
      console.error(err);
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

  const onCSVImport = async (data: NewEnergyDataType[]) => {
    try {
      const result = await importCSV(data, energyData);

      // Show import results
      const message = [
        result.success > 0 && `${result.success} entries imported`,
        result.skipped > 0 &&
          `${result.skipped} entries skipped (already exist)`,
        result.error > 0 && `${result.error} entries failed`,
      ]
        .filter(Boolean)
        .join(", ");

      setToast({
        message,
        type: result.error > 0 ? "error" : "success",
      });

      // Refresh the data
      fetchEnergyDataType();
    } catch (error) {
      console.error("Error importing CSV data:", error);
      setToast({
        message: "Failed to import CSV data",
        type: "error",
      });
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
        <div className="csv-dropzone-container">
          <CSVDropZone onDataImported={onCSVImport} />
        </div>

        {error && (
          <div className="alert-error">
            {error}
          </div>
        )}

        <AddEnergyForm
          onSubmit={onAddEnergy}
          latestValues={getLatestValues(energyData)}
        />

        <EnergyTabs energyData={energyData} onDelete={onDelete} />

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
