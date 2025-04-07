import { useState, useEffect } from "react";
import ConfirmationModal from "./ConfirmationModal";

type EnergyType = "power" | "gas";
interface EnergyData {
  date: string;
  type: EnergyType;
  amount: number;
}

interface AddEnergyFormProps {
  onSubmit: (data: EnergyData) => void;
  latestValues: {
    power: number;
    gas: number;
  };
}

export default function AddEnergyForm({ onSubmit, latestValues }: AddEnergyFormProps) {
  const [newData, setNewData] = useState<EnergyData>({
    date: new Date().toISOString().split("T")[0],
    type: "power",
    amount: latestValues.power || 0,
  });
  const [error, setError] = useState<string>("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState<EnergyData | null>(null);

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

  const submitData = (data: EnergyData) => {
    setError("");
    onSubmit(data);
    setNewData({
      date: new Date().toISOString().split("T")[0],
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
    if (type === 'power') {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 21v-5.25a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7.393 2.25 1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7.393 2.25 1.015a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72l1.189-1.19A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72M6.75 18h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .414.336.75.75.75z"
          />
        </svg>
      );
    } else {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z"
          />
        </svg>
      );
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="mb-8 p-6 bg-card text-card-foreground rounded-lg border border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">Date</label>
            <input
              type="date"
              value={newData.date}
              onChange={(e) => setNewData({ ...newData, date: e.target.value })}
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