import { useEffect, useState } from "react";
import { PowerIcon, GasIcon } from "@/app/components/icons";
import { formatDateToIso, parseDateFlexible } from "@/app/utils/dateUtils";
import { ContractBase, ContractType, EnergyOptions } from "@/app/types";

interface ContractFormProps {
  onSubmit: (data: ContractBase) => void;
  initialData?: ContractType | null;
  existingContracts: ContractType[];
  onCancel?: () => void;
}

const ContractForm = ({ onSubmit, initialData, existingContracts, onCancel }: ContractFormProps) => {
  const [contractData, setContractData] = useState<ContractBase>({
    type: "power" as EnergyOptions,
    startDate: new Date(),
    endDate: undefined as Date | undefined,
    basePrice: 0,
    workingPrice: 0,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setContractData({
        type: initialData.type,
        startDate: initialData.startDate,
        endDate: initialData.endDate,
        basePrice: initialData.basePrice,
        workingPrice: initialData.workingPrice,
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate prices
    if (contractData.basePrice < 0 || contractData.workingPrice < 0) {
      setError("Prices must be positive numbers");
      return;
    }

    // Validate dates
    if (contractData.endDate && contractData.endDate < contractData.startDate) {
      setError("End date must be after start date");
      return;
    }

    try {
      // Check for overlapping contracts

      const hasOverlap = existingContracts.some((contract: ContractType) => {
        // Skip current contract if editing
        if (initialData?._id === contract._id) return false;

        const existingStart = new Date(contract.startDate);
        const existingEnd = contract.endDate ? new Date(contract.endDate) : null;
        const newStart = contractData.startDate;
        const newEnd = contractData.endDate || null;

        // Check if periods overlap
        return (
          (newEnd === null || existingStart <= newEnd) &&
          (existingEnd === null || newStart <= existingEnd)
        );
      });

      if (hasOverlap) {
        setError("Cannot have overlapping contract periods for the same energy type");
        return;
      }

      setError("");
      onSubmit(contractData);
    } catch (error) {
      console.error(error);
      setError("Failed to validate contract dates");
    }
  };

  const getTypeIcon = (type: EnergyOptions) => {
    return type === "power" ? <PowerIcon /> : <GasIcon />;
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="solid-container"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">
              Type
            </label>
            <div className="flex gap-2">
              {(["power", "gas"] as const).map((type) => (
                <label
                  htmlFor={"contract-type-" + type}
                  key={type}
                  className={`flex-1 flex items-center justify-center gap-2 p-2 border rounded cursor-pointer transition-colors ${contractData.type === type
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-input text-foreground border-border hover:bg-secondary"
                    }`}
                >
                  <input
                    id={"contract-type-" + type}
                    data-testid={"contract-type-" + type}
                    type="radio"
                    name="type"
                    value={type}
                    checked={contractData.type === type}
                    onChange={(e) => {
                      setContractData({
                        ...contractData,
                        type: e.target.value as EnergyOptions,
                      });
                      setError("");
                    }}
                    className="hidden"
                  />
                  {getTypeIcon(type)}
                  <span className="capitalize">{type}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <div>
              <label
                htmlFor="contract-start-date"
                className="block text-sm font-medium mb-1 text-foreground"
              >
                Start
              </label>
              <input
                id="contract-start-date"
                type="date"
                value={formatDateToIso(contractData.startDate)}
                onChange={(e) =>
                  setContractData({
                    ...contractData,
                    startDate: parseDateFlexible(e.target.value),
                  })
                }
                className="w-full p-2 border rounded bg-input text-foreground border-border focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
            <div>
              <label
                htmlFor="contract-end-date"
                className="block text-sm font-medium mb-1 text-foreground"
              >
                End
              </label>
              <input
                id="contract-end-date"
                type="date"
                value={contractData.endDate ? formatDateToIso(contractData.endDate) : ""}
                onChange={(e) =>
                  setContractData({
                    ...contractData,
                    endDate: e.target.value ? parseDateFlexible(e.target.value) : undefined,
                  })
                }
                className="w-full p-2 border rounded bg-input text-foreground border-border focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <div>
              <label
                htmlFor="contract-base-price"
                className="block text-sm font-medium mb-1 text-foreground"
              >
                Base Price <span className="text-xs text-gray-400">/year</span>
              </label>
              <input
                id="contract-base-price"
                type="number"
                value={contractData.basePrice || ""}
                onChange={(e) =>
                  setContractData({
                    ...contractData,
                    basePrice: parseFloat(e.target.value),
                  })
                }
                className="w-full p-2 border rounded bg-input text-foreground border-border focus:outline-none focus:ring-2 focus:ring-ring"
                step="1"
                required
              />
            </div>
            <div>
              <label
                htmlFor="contract-working-price"
                className="block text-sm font-medium mb-1 text-foreground"
              >
                Working Price <span className="text-xs text-gray-400">/unit</span>
              </label>
              <input
                id="contract-working-price"
                type="number"
                value={contractData.workingPrice || ""}
                onChange={(e) =>
                  setContractData({
                    ...contractData,
                    workingPrice: parseFloat(e.target.value),
                  })
                }
                className="w-full p-2 border rounded bg-input text-foreground border-border focus:outline-none focus:ring-2 focus:ring-ring"
                step=".0001"
                required
              />
            </div>
          </div>
        </div>
        {error && <p className="text-destructive text-sm mt-2">{error}</p>}

        <div className="flex gap-2 mt-4">
          <button
            type="submit"
            className="px-4 py-2"
          >
            {initialData ? "Update Contract" : "Save Contract"}
          </button>
          {initialData && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive/20"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </>
  );
};

export default ContractForm;