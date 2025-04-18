"use client";

import { useState } from "react";
import EnergyTableFilters from "./energy/EnergyTableFilters";
import { EnergyType, EnergyOptions } from "../types";
import EnergyCharts from "./energy/EnergyCharts";
import EnergyTable from "./energy/EnergyTable";
import CostCharts from "./energy/CostCharts";

interface TabsProps {
  energyData: EnergyType[];
  onDelete: (id: string) => Promise<void>;
}

const DashboardTabs = ({ energyData, onDelete }: TabsProps) => {
  const [activeTab, setActiveTab] = useState("table");
  const [activeCostChart, setActiveCostChart] = useState<"actual" | "monthly" | "prognosis">("actual");
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
    {
      id: "costs",
      label: "Cost Analysis",
      content: (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveCostChart("actual")}
              className={`button-small ${activeCostChart === "actual" ? "button-primary" : "button-secondary"}`}
            >
              Actual
            </button>
            <button
              onClick={() => setActiveCostChart("monthly")}
              className={`button-small ${activeCostChart === "monthly" ? "button-primary" : "button-secondary"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setActiveCostChart("prognosis")}
              className={`button-small ${activeCostChart === "prognosis" ? "button-primary" : "button-secondary"}`}
            >
              Prognosis
            </button>
          </div>
          <CostCharts
            energyData={energyData}
            typeFilter={typeFilter}
            dateRange={dateRange}
            activeChart={activeCostChart}
          />
        </div>
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

export default DashboardTabs;
