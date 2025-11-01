import { useState, useEffect } from "react";
import ConfirmationModal from "@/app/components/modals/ConfirmationModal";
import { EnergyType, EnergyOptions, EnergyBase } from "@/app/types";
import { formatDateToIso, parseDateFlexible } from "@/app/utils/dateUtils";
import { getTypeIcon } from "@/app/utils/iconUtils";
import { EnergyValidationService } from "@/app/services/validationService";
import { useConfirmationModal } from "@/app/hooks/useConfirmationModal";
import { ENERGY_TYPES } from "@/app/constants/energyTypes";

interface AddEnergyFormProps {
  onSubmit: (data: EnergyBase) => void;
  latestValues: {
    power: number;
    gas: number;
  };
}

const AddEnergyForm = ({ onSubmit, latestValues }: AddEnergyFormProps) => {
  const [newData, setNewData] = useState<EnergyBase>(() => ({
    date: new Date(),
    type: "power",
    amount: latestValues.power || 0,
  }));

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  const [error, setError] = useState<string>("");
  const confirmationModal = useConfirmationModal<EnergyBase>();

  // Update amount when type changes
  const handleTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newType = event.target.value as EnergyOptions;
    setNewData(prev => ({
      ...prev,
      type: newType,
      amount: latestValues[newType] || 0,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate amount
    const validation = EnergyValidationService.validateAmount(newData.amount);
    if (!validation.isValid) {
      setError(validation.error || "Invalid amount");
      return;
    }

    // Check if the new value is lower than the previous value
    if (EnergyValidationService.shouldConfirmLowerReading(newData, latestValues)) {
      confirmationModal.show(newData);
      return;
    }

    submitData(newData);
  };

  const submitData = (data: Omit<EnergyType, "_id" | "userId">) => {
    setError("");
    onSubmit(data);
    if (isClient) {
      setNewData({
        date: new Date(),
        type: "power",
        amount: latestValues.power || 0,
      });
    }
  };

  const handleConfirm = () => {
    confirmationModal.confirm((data) => {
      if (data) {
        submitData(data);
      }
    });
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="solid-container"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="add-energy-date"
              className="block text-sm font-medium mb-1 text-foreground"
            >
              Date
            </label>
            <input
              id="add-energy-date"
              type="date"
              value={formatDateToIso(newData.date)}
              onChange={(e) =>
                setNewData({
                  ...newData,
                  date: parseDateFlexible(e.target.value),
                })
              }
              className="w-full p-2 border rounded bg-input text-foreground border-border focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">
              Type
            </label>
            <div className="flex gap-2">
              {ENERGY_TYPES.map((type) => (
                <label
                  htmlFor={"add-energy-type-" + type}
                  key={type}
                  className={`flex-1 flex items-center justify-center gap-2 p-2 border rounded cursor-pointer transition-colors ${newData.type === type
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-input text-foreground border-border hover:bg-secondary"
                    }`}
                >
                  <input
                    id={"add-energy-type-" + type}
                    data-testid={"add-energy-type-" + type}
                    type="radio"
                    name="type"
                    value={type}
                    checked={newData.type === type}
                    onChange={handleTypeChange}
                    className="hidden"
                  />
                  {getTypeIcon(type)}
                  <span className="capitalize">{type}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label
              htmlFor="add-energy-amount"
              className="block text-sm font-medium mb-1 text-foreground"
            >
              Amount
            </label>
            <input
              id="add-energy-amount"
              type="number"
              value={newData.amount || ""}
              onChange={(e) =>
                setNewData({ ...newData, amount: parseFloat(e.target.value) })
              }
              className="w-full p-2 border rounded bg-input text-foreground border-border focus:outline-none focus:ring-2 focus:ring-ring"
              step="10"
              required
            />
            {error && <p className="text-destructive text-sm mt-1">{error}</p>}
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 px-4 py-2 "
        >
          Add Energy Data
        </button>
      </form>

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={confirmationModal.cancel}
        onConfirm={handleConfirm}
        currentValue={latestValues[newData.type]}
        newValue={confirmationModal.pendingData?.amount || 0}
        type={newData.type}
      />
    </>
  );
};

export default AddEnergyForm;
