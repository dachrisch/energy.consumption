import { useState, useEffect } from "react";
import ConfirmationModal from "./ConfirmationModal";
import { PowerIcon, GasIcon } from "./icons";
import { EnergyData, EnergyType } from "../types";
import { formatDateToIso, parseDateFlexible } from "../utils/dateUtils";

interface AddEnergyFormProps {
  onSubmit: (data: Omit<EnergyData, '_id'>) => void;
  latestValues: {
    power: number;
    gas: number;
  };
}

export default function AddEnergyForm({ onSubmit, latestValues }: AddEnergyFormProps) {
  const [newData, setNewData] = useState<Omit<EnergyData, '_id'>>({
    date: new Date(),
    type: "power",
    amount: latestValues.power || 0,
  });
  const [error, setError] = useState<string>("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState<Omit<EnergyData, '_id'> | null>(null);

  // Update amount when type changes
  useEffect(() => {
    setNewData(prev => ({
      ...prev,
      amount: latestValues[prev.type] || 0
    }));
  }, [newData.type, latestValues]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate amount
    if (isNaN(newData.amount) || newData.amount <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }

    // Check if the new value is lower than the previous value
    const currentValue = latestValues[newData.type];
    if (newData.amount < currentValue) {
      setPendingSubmission(newData);
      setShowConfirmation(true);
      return;
    }
    
    submitData(newData);
  };

  const submitData = (data: Omit<EnergyData, '_id'>) => {
    setError("");
    onSubmit(data);
    setNewData({
      date: new Date(),
      type: "power",
      amount: latestValues.power || 0,
    });
  };

  const handleConfirm = () => {
    if (pendingSubmission) {
      submitData(pendingSubmission);
    }
    setShowConfirmation(false);
    setPendingSubmission(null);
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setPendingSubmission(null);
  };

  const getTypeIcon = (type: EnergyType) => {
    return type === 'power' ? <PowerIcon /> : <GasIcon />;
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="mb-8 p-6 bg-card text-card-foreground rounded-lg border border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">Date</label>
            <input
              type="date"
              value={formatDateToIso(newData.date)}
              onChange={(e) => setNewData({ ...newData, date: parseDateFlexible(e.target.value) })}
              className="w-full p-2 border rounded bg-input text-foreground border-border focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">Type</label>
            <div className="flex gap-2">
              {(["power", "gas"] as const).map((type) => (
                <label
                  key={type}
                  className={`flex-1 flex items-center justify-center gap-2 p-2 border rounded cursor-pointer transition-colors ${
                    newData.type === type
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-input text-foreground border-border hover:bg-secondary"
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value={type}
                    checked={newData.type === type}
                    onChange={(e) => setNewData({ ...newData, type: e.target.value as EnergyType })}
                    className="hidden"
                  />
                  {getTypeIcon(type)}
                  <span className="capitalize">{type}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">Amount</label>
            <input
              type="number"
              value={newData.amount || ""}
              onChange={(e) => setNewData({ ...newData, amount: parseFloat(e.target.value) })}
              className="w-full p-2 border rounded bg-input text-foreground border-border focus:outline-none focus:ring-2 focus:ring-ring"
              step="0.01"
              required
            />
            {error && <p className="text-destructive text-sm mt-1">{error}</p>}
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90"
        >
          Add Energy Data
        </button>
      </form>

      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        currentValue={latestValues[newData.type]}
        newValue={pendingSubmission?.amount || 0}
        type={newData.type}
      />
    </>
  );
} 