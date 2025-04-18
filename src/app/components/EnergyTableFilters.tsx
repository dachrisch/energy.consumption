"use client";

import { EnergyType } from "../types";
import { PowerIcon, GasIcon, ResetIcon } from "./icons";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface EnergyTableFiltersProps {
  typeFilter: EnergyType | "all";
  setTypeFilter: (type: EnergyType | "all") => void;
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
  return (
    <div className="dotted-container">
      <div className="flow-group-big">
        {/* Type Filter Buttons */}
        <div className="flow-group-wrap"> 
          {[
            { label: "All", value: "all" },
            { label: "Power", value: "power", icon: <PowerIcon /> },
            { label: "Gas", value: "gas", icon: <GasIcon /> },
          ].map(({ label, value, icon }) => (
            <label
              key={value}
              className={`switch-label
                ${
                  typeFilter === value
                    ? "button-primary"
                    : "highlight-secondary"
                }`}
            >
              <input
                type="radio"
                name="typeFilter"
                value={value}
                checked={typeFilter === value}
                onChange={(e) =>
                  setTypeFilter(e.target.value as EnergyType | "all")
                }
                className="hidden"
              />
              {icon}
              {label}
            </label>
          ))}
        </div>

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
