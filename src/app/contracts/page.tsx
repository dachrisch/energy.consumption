"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ContractTable from "@/app/components/contracts/ContractTable";
import Toast from "@/app/components/Toast";
import { ContractBase, ContractType, ToastMessage } from "@/app/types";
import ContractForm from "../components/contracts/ContractForm";
import { addOrUpdateContractAction, deleteContractAction } from "@/actions/contract";
import { fetchAndConvert } from "../handlers/contractsHandler";

const ContractsPage = () => {
  const router = useRouter();
  const [contracts, setContracts] = useState<ContractType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [editingContractData, setEditingContractData] = useState<ContractType | null>(null);

  const fetchContracts = async () =>
    fetchAndConvert().then((data) => setContracts(data))
      .catch((error) => {
        setToast({
          message: "Failed to load contracts",
          type: "error",
        });
        console.error(error);
      }).finally(() => setIsLoading(false));

  useEffect(() => {
    fetchContracts();
  }, []);

  const onAddContract = async (contractData: ContractBase) => {
    try {
      await addOrUpdateContractAction({
        ...contractData,
        _id: editingContractData?._id
      });
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
      await deleteContractAction(id);

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

  const onEditContract = (contract: ContractType) => {
    setEditingContractData(contract);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
          <h1 className="app-heading mb-0">
            {editingContractData ? "Edit Contract" : "Add New Contract"}
          </h1>
        </div>

        <ContractForm
          onSubmit={onAddContract}
          initialData={editingContractData}
          existingContracts={contracts}
          onCancel={() => setEditingContractData(null)}
        />

        <h2 className="app-heading mt-12 mb-6">Existing Contracts</h2>
        <ContractTable
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