"use client";

import { useState } from "react";
import EnergyTableFilters from "./energy/EnergyTableFilters";
import { EnergyType, ContractType, EnergyOptions } from "../types";
import UnifiedEnergyChart from "./energy/UnifiedEnergyChart";
import EnergyTable from "./energy/EnergyTable";
import { TableIcon, ChartIcon } from "./icons";

interface TabsProps {
  energyData: EnergyType[];
  contracts: ContractType[];
  onDelete: (id: string) => Promise<void>;
}

const DashboardTabs = ({ energyData, contracts, onDelete }: TabsProps) => {
  const [activeTab, setActiveTab] = useState("table");
  // Shared filter state
  const [typeFilter, setTypeFilter] = useState<EnergyOptions | "all">("all");
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
      icon: <TableIcon className="w-4 h-4" />,
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
      label: "Charts",
      icon: <ChartIcon className="w-4 h-4" />,
      content: (
        <UnifiedEnergyChart
          energyData={energyData}
          contracts={contracts}
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
              className={`tab-base ${activeTab === tab.id
                  ? "button-primary"
                  : "button-secondary"
                }`}
            >
              <span className="flex items-center justify-center gap-2">
                {tab.icon}
                <span>{tab.label}</span>
              </span>
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

export default DashboardTabs;
