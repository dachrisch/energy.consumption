import { useEffect, useState } from "react";
import { PowerIcon, GasIcon } from "@/app/components/icons";
import { formatDateToIso, parseDateFlexible } from "@/app/utils/dateUtils";
import { ContractBase, ContractType, EnergyOptions } from "@/app/types";

interface ContractFormProps {
  onSubmit: (data: ContractBase) => void;
  initialData?: ContractType | null;
  onCancel?: () => void;
}

const ContractForm = ({ onSubmit, initialData, onCancel }: ContractFormProps) => {
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

  const handleSubmit = (e: React.FormEvent) => {
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

    setError("");
    onSubmit(contractData);
  };

  const getTypeIcon = (type: EnergyOptions) => {
    return type === "power" ? <PowerIcon /> : <GasIcon />;
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="solid-container"
    >
      <div className="grid grid-cols-1 gap-4">
        <div className="flow-group-big">
          <div className="flex gap-2">
            {(["power", "gas"] as const).map((type) => (
              <label
                htmlFor={"contract-type-" + type}
                key={type}
                className={`switch-label ${contractData.type === type
                  ? "button-primary"
                  : "highlight-secondary"
                  }`}
              >
                <input
                  id={"contract-type-" + type}
                  type="radio"
                  name="type"
                  value={type}
                  checked={contractData.type === type}
                  onChange={(e) =>
                    setContractData({
                      ...contractData,
                      type: e.target.value as EnergyOptions,
                    })
                  }
                  className="hidden"
                />
                {getTypeIcon(type)}
                <span className="capitalize">{type}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flow-group-big">
          <div>
            <label
              htmlFor="contract-start-date"
              className="form-label"
            >
              Start Date
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
              className="form-input"
              required
            />
          </div>

          <div>
            <label
              htmlFor="contract-end-date"
              className="form-label"
            >
              End Date (optional)
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
              className="form-input"
            />
          </div>
        </div>
        <div className="flow-group-big ">
          <div>
            <label htmlFor="contract-base-price" className="form-label">
              Base Price (per year)
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
              className="form-input w-40"
              step="0.01"
              required
            />
          </div>

          <div>
            <label htmlFor="contract-working-price" className="form-label">
              Working Price (per unit)
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
              className="form-input w-40"
              step="0.0001"
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
  );
};

export default ContractForm;