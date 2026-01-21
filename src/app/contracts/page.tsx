"use client";

import { useState, useEffect } from "react";
import { Loader2, Trash2, Zap, Flame, FileText, Plus } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { getMeters } from "@/actions/meter";
import { getContractsAction, deleteContractAction } from "@/actions/contract";
import { Meter, ContractType } from "@/app/types";
import { format } from "date-fns";
import Toast from "@/app/components/Toast";
import { ToastMessage } from "@/app/types";
import SimplifiedContractForm from "../components/contracts/SimplifiedContractForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";

export default function ContractsPage() {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [contracts, setContracts] = useState<ContractType[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMeterForContract, setSelectedMeterForForContract] = useState<Meter | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [m, c] = await Promise.all([getMeters(), getContractsAction()]);
      setMeters(m);
      setContracts(c);
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this contract?")) return;
    
    setActionLoading(id);
    try {
      const result = await deleteContractAction(id);
      if (result.success) {
        setContracts(contracts.filter(c => c._id !== id));
        setToast({ message: "Contract deleted successfully", type: "success" });
      } else {
        setToast({ message: result.error || "Failed to delete contract", type: "error" });
      }
    } catch (err) {
      console.error("Failed to delete contract", err);
      setToast({ message: "An error occurred", type: "error" });
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Contracts</h1>
          <p className="text-muted-foreground">
            Manage your pricing and supply contracts for each meter.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Contract
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Contract</DialogTitle>
              <DialogDescription>
                Select a meter to set up its supply contract and pricing.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {!selectedMeterForContract ? (
                <div className="grid gap-2">
                  <span className="text-sm font-medium">Select Meter:</span>
                  {meters.length > 0 ? (
                    <div className="grid gap-2">
                      {meters.map(meter => (
                        <Button 
                          key={meter._id} 
                          variant="outline" 
                          className="justify-start h-auto py-3 px-4"
                          onClick={() => setSelectedMeterForForContract(meter)}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div className="bg-primary/10 p-2 rounded-full">
                              {meter.type === "power" ? <Zap className="h-4 w-4 text-primary" /> : <Flame className="h-4 w-4 text-orange-500" />}
                            </div>
                            <div className="flex flex-col items-start">
                              <span className="font-semibold">{meter.name}</span>
                              <span className="text-xs text-muted-foreground">{meter.meterNumber}</span>
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4 italic">
                      No meters found. Please add a meter reading first.
                    </p>
                  )}
                </div>
              ) : (
                <SimplifiedContractForm 
                  meter={selectedMeterForContract} 
                  onSuccess={() => {
                    setIsDialogOpen(false);
                    setSelectedMeterForForContract(null);
                    loadData();
                    setToast({ message: "Contract saved successfully", type: "success" });
                  }}
                  onCancel={() => setSelectedMeterForForContract(null)}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/30 flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Supply Contracts</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Meter</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Base Price</TableHead>
              <TableHead>Working Price</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.length > 0 ? (
              contracts.map((contract) => {
                const meter = meters.find(m => m._id === contract.meterId);
                return (
                  <TableRow key={contract._id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{meter?.name || "Unknown Meter"}</span>
                        <span className="text-xs text-muted-foreground">{contract.type.toUpperCase()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(contract.startDate), "PP")}
                    </TableCell>
                    <TableCell>
                      €{contract.basePrice.toFixed(2)}<span className="text-xs text-muted-foreground">/yr</span>
                    </TableCell>
                    <TableCell>
                      €{contract.workingPrice.toFixed(4)}<span className="text-xs text-muted-foreground">/kWh</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(contract._id)}
                        disabled={actionLoading === contract._id}
                      >
                        {actionLoading === contract._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No contracts defined. Add your first contract to see cost projections.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}