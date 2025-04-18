"use client";

import { useEffect, useState } from "react";
import ContractTable from "@/app/components/contracts/ContractTable";
import Toast from "@/app/components/Toast";
import { ContractBase, ContractType, ToastMessage } from "@/app/types";
import ContractForm from "../components/contracts/ContractForm";
import { addOrUpdateContractAction, deleteContractAction } from "@/actions/contract";
import { fetchAndConvert } from "../handlers/contractsHandler";

const ContractsPage = () => {
  const [contracts, setContracts] = useState<ContractType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [editingContractData, setEditingContractData] = useState<ContractType | null>(null);


  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () =>
    fetchAndConvert().then((data) => setContracts(data))
      .catch((error) => {
        setToast({
          message: "Failed to load contracts",
          type: "error",
        });
        console.error(error);
      }).finally(() => setIsLoading(false));


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
        <h1 className="app-heading mb-6">
          {editingContractData ? "Edit Contract" : "Add New Contract"}
        </h1>

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