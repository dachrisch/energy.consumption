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
    <div className="mb-4 p-4 rounded-lg border border-dotted">
      <div className="flex flex-wrap gap-4 items-center justify-center"> {/* Center content */}
        {/* Type Filter Buttons */}
        <div className="flex gap-2 flex-wrap justify-center"> {/* Ensure type filter buttons are centered */}
          {[
            { label: "All", value: "all" },
            { label: "Power", value: "power", icon: <PowerIcon /> },
            { label: "Gas", value: "gas", icon: <GasIcon /> },
          ].map(({ label, value, icon }) => (
            <label
              key={value}
              className={`flex items-center gap-2 px-3 py-2 rounded border cursor-pointer transition-colors min-w-[80px] justify-center text-sm
                ${
                  typeFilter === value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-input text-foreground border-border hover:bg-secondary"
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
        <div className="flex-grow min-w-[200px] sm:min-w-[250px] text-center"> {/* Center date picker */}
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
          className="ml-auto p-2 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
          title="Reset filters"
        >
          <ResetIcon />
        </button>
      </div>
    </div>
  );
};

export default EnergyTableFilters;
