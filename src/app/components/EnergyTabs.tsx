"use client";

import { useState } from "react";
import EnergyTableFilters from "./EnergyTableFilters";
import { EnergyDataType, EnergyType } from "../types";
import EnergyCharts from "./EnergyCharts";
import EnergyTable from "./EnergyTable";

interface TabsProps {
  energyData: EnergyDataType[];
  onDelete: (id: string) => Promise<void>;
}

const Tabs = ({ energyData, onDelete }: TabsProps) => {
  const [activeTab, setActiveTab] = useState("table");
  // Shared filter state
  const [typeFilter, setTypeFilter] = useState<EnergyType | "all">("all");
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });

  const handleResetFilters = () => {
    setTypeFilter("all");
    setDateRange({ start: null, end: null });
  };

  const tabs = [
    {
      id: "table",
      label: "Table View",
      content: (
        <EnergyTable
          energyData={energyData}
          onDelete={onDelete}
          typeFilter={typeFilter}
          dateRange={dateRange}
        />
      ),
    },
    {
      id: "charts",
      label: "Charts View",
      content: (
        <EnergyCharts
          energyData={energyData}
          typeFilter={typeFilter}
          dateRange={dateRange}
        />
      ),
    },
  ];

  return (
    <div className="border border-border rounded-lg p-4">
    <div className="w-full">
      <EnergyTableFilters
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        dateRange={dateRange}
        setDateRange={setDateRange}
        onReset={handleResetFilters}
      />

      <div className="flex border-b border-border gap-2">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-t-lg ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-foreground border-secondary hover:bg-primary"
            }`}
          >
            {tab.label}
          </div>
        ))}
      </div>
      <div className="mt-4">
        {tabs.find((tab) => tab.id === activeTab)?.content}
      </div>
    </div>
    </div>
  );
};

export default Tabs;
