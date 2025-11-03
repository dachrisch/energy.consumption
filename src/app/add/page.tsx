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

  const onAddEnergy = async (newData: EnergyBase) => {
    try {
      await addEnergyAction(newData);
      setToast({
        message: "Energy data added successfully",
        type: "success",
      });
      // Refresh the data to show the new entry
      fetchEnergyDataType();
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

      // Refresh the data to show the new entries
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
        <div className="page-content">
          <div className="page-header">
            <h1 className="app-heading">Add Energy Data</h1>
            <p className="page-description">Record new meter readings</p>
          </div>
          <p>Loading...</p>
        </div>
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
      <div className="page-content">
        <div className="page-header">
          <h1 className="app-heading">Add Energy Data</h1>
          <p className="page-description">Record new meter readings using manual entry or CSV import</p>
        </div>

        <div className="content-card">
          <TabNavigation
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* Tab Content */}
          <div className="mt-6">
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
      </div>
    </div>
  );
};

export default AddDataPage;