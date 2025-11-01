"use client";

import { EnergyOptions } from "../../types";
import { PowerIcon, GasIcon, ResetIcon } from "../icons";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ButtonGroupRadio, ButtonOption } from "../shared/ButtonGroup";

interface EnergyTableFiltersProps {
  typeFilter: EnergyOptions | "all";
  setTypeFilter: (type: EnergyOptions | "all") => void;
  dateRange: { start: Date | null; end: Date | null };
  setDateRange: (range: { start: Date | null; end: Date | null }) => void;
  onReset: () => void;
}

const EnergyTableFilters = ({
  typeFilter,
  setTypeFilter,
  dateRange,
  setDateRange,
  onReset,
}: EnergyTableFiltersProps) => {
  const typeFilterOptions: ButtonOption<EnergyOptions | "all">[] = [
    { label: "All", value: "all" },
    { label: "Power", value: "power", icon: <PowerIcon /> },
    { label: "Gas", value: "gas", icon: <GasIcon /> },
  ];

  return (
    <div className="dotted-container">
      <div className="flow-group-big">
        {/* Type Filter Buttons */}
        <ButtonGroupRadio
          options={typeFilterOptions}
          value={typeFilter}
          onChange={setTypeFilter}
          name="typeFilter"
          variant="primary"
        />

        {/* Date Picker */}
        <div className="flow-group-grow min-w-[200px] sm:min-w-[250px] "> 
          <DatePicker
            selectsRange
            startDate={dateRange.start}
            endDate={dateRange.end}
            onChange={(dates: [Date | null, Date | null]) => {
              const [start, end] = dates;
              setDateRange({ start, end });
            }}
            dateFormat="yyyy-MM-dd"
            className="w-full px-3 py-2 border rounded bg-input text-foreground border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            placeholderText="Date range"
          />
        </div>

        {/* Reset Button */}
        <button
          onClick={onReset}
          className="ml-auto p-2"
          title="Reset filters"
        >
          <ResetIcon />
        </button>
      </div>
    </div>
  );
};

export default EnergyTableFilters;
