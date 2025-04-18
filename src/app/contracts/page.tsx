"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import EnergyContractForm from "@/app/components/contracts/EnergyContractForm";
import Toast from "@/app/components/Toast";
import { EnergyContractBase } from "../types";
import { addContract } from "@/actions/energyContract";

const ContractsPage = () => {
  const router = useRouter();
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);


  const onAddContract = async (contractData: EnergyContractBase) => {
    try {
      await addContract(contractData);
      
      setToast({
        message: "Contract added successfully",
        type: "success",
      });
      setTimeout(() => router.push("/dashboard"), 1000);
    } catch (err) {
      setToast({
        message: "Failed to add contract",
        type: "error",
      });
      console.error(err);
    }
  };

  return (
    <div className="app-root">
      <main className="dashboard-main">
        <h1 className="app-heading mb-6">Energy Contracts</h1>

        <EnergyContractForm onSubmit={onAddContract} />

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