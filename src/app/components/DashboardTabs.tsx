"use client";

import { useState, useMemo } from "react";
import EnergyTableFilters from "./energy/EnergyTableFilters";
import { EnergyType, ContractType, EnergyOptions } from "../types";
import UnifiedEnergyChart from "./energy/UnifiedEnergyChart";
import EnergyTable from "./energy/EnergyTable";
import { TableIcon, ChartIcon } from "./icons";
import { DateRange } from "./energy/RangeSlider/types";
import { ENERGY_TYPES } from "../constants/energyTypes";

interface TabsProps {
  energyData: EnergyType[];
  contracts: ContractType[];
  onDelete: (id: string) => Promise<void>;
}

const DashboardTabs = ({ energyData, contracts, onDelete }: TabsProps) => {
  const [activeTab, setActiveTab] = useState("table");

  // V3 API: Multi-select types
  const [selectedTypes, setSelectedTypes] = useState<EnergyOptions[]>([]);

  // V3 API: DateRange with non-null dates
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const now = new Date();
    const past = new Date(now);
    past.setFullYear(past.getFullYear() - 1);
    return { start: past, end: now };
  });

  const handleResetFilters = () => {
    setSelectedTypes([]);
    if (energyData.length > 0) {
      const dates = energyData.map((item) => new Date(item.date));
      setDateRange({
        start: new Date(Math.min(...dates.map((d) => d.getTime()))),
        end: new Date(Math.max(...dates.map((d) => d.getTime()))),
      });
    }
  };

  // Convert new API to old API for child components
  const typeFilterLegacy: EnergyOptions | "all" = useMemo(() => {
    if (selectedTypes.length === 0 || selectedTypes.length === ENERGY_TYPES.length) {
      return "all";
    }
    return selectedTypes[0];
  }, [selectedTypes]);

  const dateRangeLegacy = useMemo(() => ({
    start: dateRange.start,
    end: dateRange.end,
  }), [dateRange]);

  const tabs = [
    {
      id: "table",
      label: "Table View",
      icon: <TableIcon className="w-4 h-4" />,
      content: (
        <EnergyTable
          energyData={energyData}
          onDelete={onDelete}
          typeFilter={typeFilterLegacy}
          dateRange={dateRangeLegacy}
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
          typeFilter={typeFilterLegacy}
          dateRange={dateRangeLegacy}
        />
      ),
    },
  ];

  return (
    <div className="solid-container">
      <div className="container-inner">
        <EnergyTableFilters
          energyData={energyData}
          selectedTypes={selectedTypes}
          onTypesChange={setSelectedTypes}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
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
