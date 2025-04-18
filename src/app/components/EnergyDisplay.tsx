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
    <div className="solid-container">
    <div className="container-inner">
      <EnergyTableFilters
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        dateRange={dateRange}
        setDateRange={setDateRange}
        onReset={handleResetFilters}
      />

      <div className="tabs-container">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-base ${
              activeTab === tab.id
                ? "tab-active"
                : "tab-inactive"
            }`}
          >
            {tab.label}
          </div>
        ))}
      </div>
      <div className="tab-outlet">
        {tabs.find((tab) => tab.id === activeTab)?.content}
      </div>
    </div>
    </div>
  );
};

export default Tabs;
