"use client";

import { useState, useMemo } from "react";
import { EnergyType, ContractType } from "@/app/types";
import { calculateCosts, CostPeriod, getAvailableYears } from "@/app/handlers/costCalculation";
import { TOGGLE_BUTTON_STYLES } from "@/app/constants/ui";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { getEnergyTypeLabel, getEnergyTypeChartConfig } from "@/app/constants/energyTypes";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface CostViewProps {
  energyData: EnergyType[];
  contracts: ContractType[];
}

const CostView = ({ energyData, contracts }: CostViewProps) => {
  const [period, setPeriod] = useState<CostPeriod>("monthly");

  // Get available years from data
  const availableYears = useMemo(() => getAvailableYears(energyData), [energyData]);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(availableYears[0] || currentYear);

  // Year range configuration for yearly view (could be moved to settings later)
  const yearRangeConfig = { past: 2, future: 3 };

  const costData = calculateCosts(energyData, contracts, period, {
    includeExtrapolation: false,
    year: period === "monthly" ? selectedYear : undefined,
    yearRange: period === "yearly" ? yearRangeConfig : undefined,
  });

  const chartData = {
    labels: costData.map(d => d.period),
    datasets: [
      {
        label: getEnergyTypeLabel("power"),
        data: costData.map(d => d.costs.power || 0),
        backgroundColor: getEnergyTypeChartConfig("power").backgroundColor,
        borderColor: getEnergyTypeChartConfig("power").borderColor,
        borderWidth: 1,
      },
      {
        label: getEnergyTypeLabel("gas"),
        data: costData.map(d => d.costs.gas || 0),
        backgroundColor: getEnergyTypeChartConfig("gas").backgroundColor,
        borderColor: getEnergyTypeChartConfig("gas").borderColor,
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            family: "'Inter', 'system-ui', sans-serif",
          },
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          label: (context: TooltipItem<'bar'>) => {
            const datasetLabel = context.dataset.label || '';
            const value = context.parsed.y ?? 0;
            const periodIndex = context.dataIndex;
            const period = costData[periodIndex];

            // Get breakdown for this energy type
            const energyType = datasetLabel.toLowerCase() === 'power' ? 'power' : 'gas';
            const breakdown = period?.breakdown?.[energyType];

            if (!breakdown || breakdown.consumption === 0) {
              return `${datasetLabel}: €${value.toFixed(2)}`;
            }

            // Return detailed breakdown
            return [
              `${datasetLabel}: €${value.toFixed(2)}`,
              `  Consumption: ${breakdown.consumption.toFixed(2)} kWh`,
              `  Base: €${breakdown.basePrice.toFixed(2)}`,
              `  Rate: €${breakdown.workingPrice.toFixed(4)}/kWh`,
              `  = €${breakdown.basePrice.toFixed(2)} + (${breakdown.consumption.toFixed(2)} × €${breakdown.workingPrice.toFixed(4)})`,
            ];
          },
          footer: (tooltipItems: TooltipItem<'bar'>[]) => {
            const total = tooltipItems.reduce((sum, item) => sum + (item.parsed.y ?? 0), 0);
            return `Total: €${total.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          padding: 8,
          maxRotation: 45,
          minRotation: 0,
          font: {
            size: 11,
          },
        },
        title: {
          display: true,
          text: period === "monthly" ? "Month" : "Year",
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        ticks: {
          padding: 8,
          font: {
            size: 11,
          },
          callback: (value: string | number) => `€${value}`,
        },
        title: {
          display: true,
          text: "Cost (€)",
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
      },
    },
  };

  const togglePeriod = () => {
    setPeriod(period === "monthly" ? "yearly" : "monthly");
  };

  if (energyData.length === 0) {
    return (
      <div className="w-full space-y-4">
        <div className="text-center text-gray-500 py-8">
          No energy data available. Add some energy readings to see cost calculations.
        </div>
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className="w-full space-y-4">
        <div className="text-center text-gray-500 py-8">
          No contracts available. Add energy contracts to see cost calculations.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-foreground">
            {period === "monthly" ? "Monthly Costs" : "Yearly Costs"}
          </h3>
          {/* Year Selector for Monthly View */}
          {period === "monthly" && availableYears.length > 0 && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1 rounded-lg text-sm border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          )}
        </div>
        <button
          onClick={togglePeriod}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            period === "yearly" ? TOGGLE_BUTTON_STYLES.active : TOGGLE_BUTTON_STYLES.inactive
          }`}
        >
          {period === "monthly" ? "Show Yearly" : "Show Monthly"}
        </button>
      </div>

      {/* Chart Container */}
      <div className="relative w-full" style={{ height: 'clamp(300px, 50vh, 500px)' }}>
        <Bar options={options} data={chartData} />
      </div>

      {/* Cost Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        <div className="bg-secondary/30 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Total Power Costs</div>
          <div className="text-2xl font-bold text-foreground">
            €{costData.reduce((sum, d) => sum + (d.costs.power || 0), 0).toFixed(2)}
          </div>
        </div>
        <div className="bg-secondary/30 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Total Gas Costs</div>
          <div className="text-2xl font-bold text-foreground">
            €{costData.reduce((sum, d) => sum + (d.costs.gas || 0), 0).toFixed(2)}
          </div>
        </div>
        <div className="bg-secondary/30 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Total Costs</div>
          <div className="text-2xl font-bold text-foreground">
            €{costData.reduce((sum, d) => sum + d.totalCost, 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Info Note */}
      <div className="text-xs text-gray-500 text-center mt-2">
        {period === "yearly"
          ? `* Showing ${yearRangeConfig.past} past years and ${yearRangeConfig.future} future years. Hover over bars for cost breakdown.`
          : `* Showing all months of ${selectedYear}. Hover over bars for cost breakdown.`
        }
      </div>
    </div>
  );
};

export default CostView;
