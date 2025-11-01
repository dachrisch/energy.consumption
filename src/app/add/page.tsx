"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { EnergyType, EnergyBase, ToastMessage } from "../types";
import { getLatestValues } from "../handlers/energyHandlers";
import { addEnergyAction, importCSVAction } from "@/actions/energy";
import AddEnergyForm from "../components/add/AddEnergyForm";
import Toast from "../components/Toast";
import TabNavigation from "../components/add/TabNavigation";
import CSVFileUpload from "../components/add/CSVFileUpload";
import CSVClipboardPaste from "../components/add/CSVClipboardPaste";
import { UploadIcon, ClipboardIcon } from "../components/icons";

const AddDataPage = () => {
  const router = useRouter();
  const { status } = useSession();
  const [energyData, setEnergyData] = useState<EnergyType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [activeTab, setActiveTab] = useState<string>("manual");

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

  const onAddEnergy = async (newData: EnergyBase) => {
    try {
      await addEnergyAction(newData);
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

  const onCSVImport = async (data: EnergyBase[]) => {
    try {
      const result = await importCSVAction(data, energyData);

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

  const tabs = [
    { id: "manual", label: "Manual Entry", icon: <span className="text-lg">✏️</span> },
    { id: "file", label: "CSV File", icon: <UploadIcon className="w-4 h-4" /> },
    { id: "clipboard", label: "Clipboard", icon: <ClipboardIcon className="w-4 h-4" /> },
  ];

  return (
    <div className="app-root">
      <main className="dashboard-main">
        {/* Header with back button */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2 hover:bg-secondary rounded-lg transition-colors flex-shrink-0"
            aria-label="Back to dashboard"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="app-heading mb-0">Add Energy Data</h1>
        </div>

        {/* Tab Navigation */}
        <div className="solid-container p-0 overflow-hidden">
          <TabNavigation
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* Tab Content */}
          <div className="p-4 md:p-6">
            {activeTab === "manual" && (
              <AddEnergyForm
                onSubmit={onAddEnergy}
                latestValues={getLatestValues(energyData)}
              />
            )}

            {activeTab === "file" && (
              <CSVFileUpload onDataImported={onCSVImport} />
            )}

            {activeTab === "clipboard" && (
              <CSVClipboardPaste onDataImported={onCSVImport} />
            )}
          </div>
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