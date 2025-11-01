"use client";

import { useState, useMemo } from "react";
import { EnergyType, ContractType, EnergyOptions } from "@/app/types";
import { calculateCosts, getAvailableYears } from "@/app/handlers/costCalculation";
import { getFilteredAndSortedData } from "@/app/handlers/energyHandlers";
import { createTimeSeriesByType, differences } from "@/app/handlers/timeSeries";
import { getChartData } from "@/app/handlers/chartData";
import { TOGGLE_BUTTON_STYLES } from "@/app/constants/ui";
import { getEnergyTypeLabel, getEnergyTypeChartConfig } from "@/app/constants/energyTypes";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

type ViewMode = "measurements" | "monthly" | "yearly";
type DataMode = "actual" | "difference";

interface UnifiedEnergyChartProps {
  energyData: EnergyType[];
  contracts: ContractType[];
  typeFilter: EnergyOptions | "all";
  dateRange: { start: Date | null; end: Date | null };
}

const UnifiedEnergyChart = ({
  energyData,
  contracts,
  typeFilter,
  dateRange,
}: UnifiedEnergyChartProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>("measurements");
  const [dataMode, setDataMode] = useState<DataMode>("actual");

  // Get available years from data
  const availableYears = useMemo(() => getAvailableYears(energyData), [energyData]);
  const currentYear = new Date().getFullYear();
  // Default to the last year in the list (oldest year with data), or current year - 1
  const defaultYear = availableYears.length > 0
    ? availableYears[availableYears.length - 1]
    : currentYear - 1;
  const [selectedYear, setSelectedYear] = useState<number>(defaultYear);

  // Year range configuration for yearly view
  const yearRangeConfig = { past: 2, future: 3 };

  // Filter data for measurements view
  const filteredData = getFilteredAndSortedData(
    energyData,
    typeFilter,
    dateRange,
    "date",
    "asc"
  );

  // Calculate cost data
  const costData = useMemo(() => {
    if (viewMode === "measurements") return null;

    const period = viewMode === "monthly" ? "monthly" : "yearly";
    const result = calculateCosts(energyData, contracts, period, {
      includeExtrapolation: false,
      year: viewMode === "monthly" ? selectedYear : undefined,
      yearRange: viewMode === "yearly" ? yearRangeConfig : undefined,
    });

    console.log('[UnifiedEnergyChart] Cost data calculation:', {
      viewMode,
      period,
      selectedYear,
      energyDataCount: energyData.length,
      contractsCount: contracts.length,
      resultCount: result?.length,
      result: result
    });

    return result;
  }, [energyData, contracts, viewMode, selectedYear, yearRangeConfig]);

  // Calculate total cost
  const totalCost = useMemo(() => {
    if (!costData) return null;
    return costData.reduce((sum, d) => sum + d.totalCost, 0);
  }, [costData]);

  // Prepare measurements chart data
  const measurementsChartData = useMemo(() => {
    if (viewMode !== "measurements") return null;

    const timeSeriesData = createTimeSeriesByType(filteredData);
    const processedData = dataMode === "difference"
      ? Object.fromEntries(
          Object.entries(timeSeriesData).map(([type, series]) => [
            type,
            differences(series),
          ])
        )
      : timeSeriesData;

    return getChartData(processedData as any, typeFilter);
  }, [filteredData, dataMode, typeFilter, viewMode]);

  // Prepare cost chart data
  const costChartData = useMemo(() => {
    if (!costData) {
      console.log('[UnifiedEnergyChart] No cost data for chart');
      return null;
    }

    console.log('[UnifiedEnergyChart] Preparing chart data:', {
      costDataLength: costData.length,
      labels: costData.map(d => d.period),
      powerCosts: costData.map(d => d.costs.power || 0),
      gasCosts: costData.map(d => d.costs.gas || 0)
    });

    return {
      labels: costData.map(d => d.period),
      datasets: [
        {
          label: getEnergyTypeLabel("power"),
          data: costData.map(d => d.costs.power || 0),
          backgroundColor: costData.map(d => {
            const config = getEnergyTypeChartConfig("power");
            // Adjust opacity based on data type
            if (d.isInterpolated) {
              return config.backgroundColor.replace('0.5', '0.25'); // Very light for interpolated
            }
            if (d.isExtrapolated) {
              return config.backgroundColor.replace('0.5', '0.15'); // Even lighter for extrapolated
            }
            return config.backgroundColor; // Normal opacity for actual data
          }),
          borderColor: getEnergyTypeChartConfig("power").borderColor,
          borderWidth: 2,
        },
        {
          label: getEnergyTypeLabel("gas"),
          data: costData.map(d => d.costs.gas || 0),
          backgroundColor: costData.map(d => {
            const config = getEnergyTypeChartConfig("gas");
            // Adjust opacity based on data type
            if (d.isInterpolated) {
              return config.backgroundColor.replace('0.5', '0.25'); // Very light for interpolated
            }
            if (d.isExtrapolated) {
              return config.backgroundColor.replace('0.5', '0.15'); // Even lighter for extrapolated
            }
            return config.backgroundColor; // Normal opacity for actual data
          }),
          borderColor: getEnergyTypeChartConfig("gas").borderColor,
          borderWidth: 2,
        },
      ],
    };
  }, [costData]);

  // Chart options for measurements
  const measurementsOptions = {
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
          label: (context: any) => {
            const label = context.dataset.label || "";
            const value = context.raw;
            return value !== null ? `${label}: ${value}` : `${label}: No data`;
          },
        },
      },
    },
    scales: {
      y: {
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
        },
        title: {
          display: true,
          text: dataMode === "actual" ? "Meter Reading" : "Consumption (kWh)",
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
      },
      x: {
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
          text: "Date",
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
      },
    },
  };

  // Chart options for costs
  const costOptions = {
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
            const period = costData?.[periodIndex];

            // Get breakdown for this energy type
            const energyType = datasetLabel.toLowerCase() === 'power' ? 'power' : 'gas';
            const breakdown = period?.breakdown?.[energyType];

            const lines = [];

            // Add data type indicator
            let dataTypeIndicator = '';
            if (period?.isInterpolated) {
              dataTypeIndicator = ' (Interpolated)';
            } else if (period?.isExtrapolated) {
              dataTypeIndicator = ' (Extrapolated)';
            }

            if (!breakdown || breakdown.consumption === 0) {
              return `${datasetLabel}: €${value.toFixed(2)}${dataTypeIndicator}`;
            }

            // Return detailed breakdown
            lines.push(`${datasetLabel}: €${value.toFixed(2)}${dataTypeIndicator}`);
            lines.push(`  Consumption: ${breakdown.consumption.toFixed(2)} kWh`);
            lines.push(`  Base: €${breakdown.basePrice.toFixed(2)}`);
            lines.push(`  Rate: €${breakdown.workingPrice.toFixed(4)}/kWh`);
            lines.push(`  = €${breakdown.basePrice.toFixed(2)} + (${breakdown.consumption.toFixed(2)} × €${breakdown.workingPrice.toFixed(4)})`);

            return lines;
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
          callback: function(value: any) {
            return '€' + value;
          },
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

  const getTitle = () => {
    if (viewMode === "measurements") {
      return dataMode === "actual"
        ? "Meter Readings Over Time"
        : "Energy Consumption (Differences)";
    }
    return viewMode === "monthly" ? "Monthly Costs" : "Yearly Costs";
  };

  return (
    <div className="w-full space-y-4">
      {/* Controls */}
      <div className="flex flex-col gap-3">
        {/* View Mode Selector */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setViewMode("measurements")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "measurements" ? TOGGLE_BUTTON_STYLES.active : TOGGLE_BUTTON_STYLES.inactive
            }`}
          >
            Measurements
          </button>
          <button
            onClick={() => setViewMode("monthly")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "monthly" ? TOGGLE_BUTTON_STYLES.active : TOGGLE_BUTTON_STYLES.inactive
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setViewMode("yearly")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "yearly" ? TOGGLE_BUTTON_STYLES.active : TOGGLE_BUTTON_STYLES.inactive
            }`}
          >
            Yearly
          </button>
        </div>

        {/* Secondary Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Year Selector (for monthly view) */}
          {viewMode === "monthly" && availableYears.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-foreground">Year:</label>
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
            </div>
          )}

          {/* Actual/Difference Toggle (for measurements view) */}
          {viewMode === "measurements" && (
            <button
              onClick={() => setDataMode(dataMode === "actual" ? "difference" : "actual")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dataMode === "difference" ? TOGGLE_BUTTON_STYLES.active : TOGGLE_BUTTON_STYLES.inactive
              }`}
            >
              {dataMode === "actual" ? "Show Differences" : "Show Actual Values"}
            </button>
          )}
        </div>
      </div>

      {/* Title and Cost Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-lg font-semibold text-foreground">
          {getTitle()}
        </h3>
        {totalCost !== null && (
          <div className="bg-secondary/30 rounded-lg px-4 py-2">
            <div className="text-xs text-muted-foreground">Total Cost</div>
            <div className="text-xl font-bold text-foreground">
              €{totalCost.toFixed(2)}
            </div>
          </div>
        )}
      </div>

      {/* Chart Container */}
      <div className="relative w-full" style={{ height: 'clamp(300px, 50vh, 500px)' }}>
        {viewMode === "measurements" && measurementsChartData ? (
          <Line options={measurementsOptions} data={measurementsChartData} />
        ) : costChartData ? (
          <Bar options={costOptions} data={costChartData} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No data available
          </div>
        )}
      </div>

      {/* Info Note */}
      <div className="text-xs text-muted-foreground text-center space-y-1">
        {viewMode === "yearly" && (
          <div>Showing {yearRangeConfig.past} past years and {yearRangeConfig.future} future years</div>
        )}
        {viewMode === "monthly" && (
          <div>Showing all months of {selectedYear}</div>
        )}
        {viewMode === "measurements" && dataMode === "difference" && (
          <div>Consumption calculated as differences between consecutive readings</div>
        )}
        {(viewMode === "monthly" || viewMode === "yearly") && (
          <div className="flex items-center justify-center gap-4 pt-1">
            <span className="flex items-center gap-1">
              <span className="inline-block w-4 h-4 bg-current opacity-100 border border-current"></span>
              Actual data
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-4 h-4 bg-current opacity-50 border border-current"></span>
              Interpolated
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-4 h-4 bg-current opacity-30 border border-current"></span>
              Extrapolated
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedEnergyChart;
