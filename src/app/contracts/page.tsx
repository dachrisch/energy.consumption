"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import EnergyContractTable from "@/app/components/contracts/EnergyContractTable";
import Toast from "@/app/components/Toast";
import { EnergyContractType } from "@/app/types";
import EnergyContractForm from "../components/contracts/EnergyContractForm";

const ContractsPage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [contracts, setContracts] = useState<EnergyContractType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [editingContractData, setEditingContractData] = useState<EnergyContractType | null>(null);

  useEffect(() => {
    if (status !== "authenticated") {
      router.push("/login");
      return;
    }
    fetchContracts();
  }, [status, router]);

  const fetchContracts = async () => {
    try {
      const response = await fetch("/api/contracts");
      if (!response.ok) throw new Error("Failed to fetch contracts");
      const data = await response.json();
      const parsed = data.map((item: { startDate: string | number | Date, endDate?: string | number | Date}) => ({
        ...item,
        startDate: new Date(item.startDate),
        ...(item.endDate && { endDate: new Date(item.endDate) }),
      }));
      setContracts(parsed);
    } catch (error) {
      setToast({
        message: "Failed to load contracts",
        type: "error",
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const onAddContract = async (contractData: {
    type: "power" | "gas";
    startDate: Date;
    endDate?: Date;
    basePrice: number;
    workingPrice: number;
  }) => {
    try {
      const response = await fetch("/api/contracts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...contractData,
          userId: session?.user?.id
        }),
      });

      if (!response.ok) throw new Error("Failed to save contract");

      setToast({
        message: editingContractData ? "Contract updated successfully" : "Contract added successfully",
        type: "success",
      });
      fetchContracts();
      setEditingContractData(null);
    } catch (err) {
      setToast({
        message: "Failed to save contract",
        type: "error",
      });
      console.error(err);
    }
  };

  const onDeleteContract = async (id: string) => {
    try {
      const response = await fetch(`/api/contracts?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete contract");

      setToast({
        message: "Contract deleted successfully",
        type: "success",
      });
      fetchContracts();
    } catch (err) {
      setToast({
        message: "Failed to delete contract",
        type: "error",
      });
      console.error(err);
    }
  };

  const onEditContract = (contract: EnergyContractType) => {
    setEditingContractData(contract);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (status !== "authenticated") {
    return null;
  }

  if (isLoading) {
    return (
      <div className="app-root">
        <main className="dashboard-main">
          <h1 className="app-heading">Loading contracts...</h1>
        </main>
      </div>
    );
  }

  return (
    <div className="app-root">
      <main className="dashboard-main">
        <h1 className="app-heading mb-6">
          {editingContractData ? "Edit Contract" : "Add New Contract"}
        </h1>

        <EnergyContractForm 
          onSubmit={onAddContract}
          initialData={editingContractData}
          onCancel={() => setEditingContractData(null)}
        />

        <h2 className="app-heading mt-12 mb-6">Existing Contracts</h2>
        <EnergyContractTable
          contracts={contracts}
          onDelete={onDeleteContract}
          onEdit={onEditContract}
          typeFilter="all"
        />

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

export default ContractsPage;