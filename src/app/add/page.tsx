"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { EnergyDataType, NewEnergyDataType } from "../types";
import { getLatestValues } from "../handlers/energyHandlers";
import { addEnergy, importCSV } from "@/actions/energyData";
import { CSVDropZone } from "../components/add/CSVDropZone";
import AddEnergyForm from "../components/add/AddEnergyForm";
import Toast from "../components/Toast";

const AddDataPage = () => {
  const router = useRouter();
  const { status } = useSession();
  const [energyData, setEnergyData] = useState<EnergyDataType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  useEffect(() => {
    if (status !== "authenticated") {
      router.push("/login");
    }
    fetchEnergyDataType();
  }, [status, router]);

  const fetchEnergyDataType = async () => {
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
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const redirectToDashboard = () => {
    setTimeout(() => router.push("/dashboard"), 1000);
  };

  const onAddEnergy = async (newData: NewEnergyDataType) => {
    try {
      await addEnergy(newData);
      setToast({
        message: "Energy data added successfully",
        type: "success",
      });
      redirectToDashboard();
    } catch (err) {
      setToast({
        message: "Failed to add energy data",
        type: "error",
      });
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

      // Refresh the data and redirect if successful
      fetchEnergyDataType();
      if (result.error === 0) {
        redirectToDashboard();
      }
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
        <h1 className="app-heading mb-6">Add Energy Data</h1>

        <div className="space-y-6">
          <CSVDropZone onDataImported={onCSVImport} />
          <AddEnergyForm
            onSubmit={onAddEnergy}
            latestValues={getLatestValues(energyData)}
          />
        </div>

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

export default AddDataPage;