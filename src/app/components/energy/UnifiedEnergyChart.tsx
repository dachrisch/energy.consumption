"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { EnergyType, ContractType, EnergyOptions } from "@/app/types";
import { calculateCosts, getAvailableYears } from "@/app/handlers/costCalculation";
import { getFilteredAndSortedData } from "@/app/handlers/energyHandlers";
import { createTimeSeriesByType, differences } from "@/app/handlers/timeSeries";
import { getChartData } from "@/app/handlers/chartData";
import { TOGGLE_BUTTON_STYLES, CHART_YEAR_RANGE, CHART_BORDER_DASH, CHART_POINT_RADIUS } from "@/app/constants/ui";
import { getEnergyTypeLabel, getEnergyTypeChartConfig } from "@/app/constants/energyTypes";
import { ButtonGroupRadio, ButtonOption } from "../shared/ButtonGroup";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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

const viewModeOptions: ButtonOption<ViewMode>[] = [
  {
    value: "measurements",
    label: "Measurements",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    value: "monthly",
    label: "Monthly",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
  {
    value: "yearly",
    label: "Yearly",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const dataModeOptions: ButtonOption<DataMode>[] = [
  {
    value: "actual",
    label: "Meter Readings",
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v5.25" />
      </svg>
    ),
  },
  {
    value: "difference",
    label: "Consumption",
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
];

const UnifiedEnergyChart = ({
  energyData,
  contracts,
  typeFilter,
  dateRange,
}: UnifiedEnergyChartProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>("measurements");
  const [dataMode, setDataMode] = useState<DataMode>("actual");
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const yearDropdownRef = useRef<HTMLDivElement>(null);

  // Get available years from data
  const availableYears = useMemo(() => getAvailableYears(energyData), [energyData]);
  const currentYear = new Date().getFullYear();
  // Default to the last year in the list (oldest year with data), or current year - 1
  const defaultYear = availableYears.length > 0
    ? availableYears[availableYears.length - 1]
    : currentYear - 1;
  const [selectedYear, setSelectedYear] = useState<number>(defaultYear);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target as Node)) {
        setShowYearDropdown(false);
      }
    };

    if (showYearDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showYearDropdown]);

  // Year range configuration for yearly view
  const yearRangeConfig = CHART_YEAR_RANGE;

  // Filter data for measurements view
  const filteredData = getFilteredAndSortedData(
    energyData,
    typeFilter,
    dateRange,
    "date",
    "asc"
  );

  // Calculate cost data for all views
  const costData = useMemo(() => {
    const period = viewMode === "measurements" ? "monthly" : viewMode === "monthly" ? "monthly" : "yearly";
    const result = calculateCosts(energyData, contracts, period, {
      includeExtrapolation: true,
      year: viewMode === "monthly" ? selectedYear : undefined,
      yearRange: viewMode === "yearly" ? yearRangeConfig : undefined,
    });

    return result;
  }, [energyData, contracts, viewMode, selectedYear, yearRangeConfig]);

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

  // Prepare consumption/cost chart data (for monthly/yearly views)
  const costChartData = useMemo(() => {
    if (!costData || viewMode === "measurements") {
      console.log('[UnifiedEnergyChart] No cost data for chart');
      return null;
    }

    console.log('[UnifiedEnergyChart] Preparing chart data:', {
      costDataLength: costData.length,
      labels: costData.map(d => d.period),
      powerConsumption: costData.map(d => d.breakdown?.power?.consumption || 0),
      gasConsumption: costData.map(d => d.breakdown?.gas?.consumption || 0)
    });

    const datasets = [];

    // Add power dataset if filter allows it
    if (typeFilter === "all" || typeFilter === "power") {
      datasets.push({
        label: getEnergyTypeLabel("power"),
        data: costData.map(d => d.breakdown?.power?.consumption || 0),
        borderColor: getEnergyTypeChartConfig("power").borderColor,
        backgroundColor: getEnergyTypeChartConfig("power").backgroundColor,
        borderWidth: 2.5,
        tension: 0.4,
        pointRadius: CHART_POINT_RADIUS.normal,
        pointHoverRadius: 6,
        pointBackgroundColor: getEnergyTypeChartConfig("power").borderColor,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: getEnergyTypeChartConfig("power").borderColor,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        spanGaps: true,
        fill: false,
        segment: {
          borderDash: (ctx: any) => {
            const point = costData[ctx.p0DataIndex];
            if (point?.isInterpolated) return CHART_BORDER_DASH.interpolated;
            if (point?.isExtrapolated) return CHART_BORDER_DASH.extrapolated;
            return undefined; // Solid for actual
          },
        },
      });
    }

    // Add gas dataset if filter allows it
    if (typeFilter === "all" || typeFilter === "gas") {
      datasets.push({
        label: getEnergyTypeLabel("gas"),
        data: costData.map(d => d.breakdown?.gas?.consumption || 0),
        borderColor: getEnergyTypeChartConfig("gas").borderColor,
        backgroundColor: getEnergyTypeChartConfig("gas").backgroundColor,
        borderWidth: 2.5,
        tension: 0.4,
        pointRadius: CHART_POINT_RADIUS.normal,
        pointHoverRadius: 6,
        pointBackgroundColor: getEnergyTypeChartConfig("gas").borderColor,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: getEnergyTypeChartConfig("gas").borderColor,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        spanGaps: true,
        fill: false,
        segment: {
          borderDash: (ctx: any) => {
            const point = costData[ctx.p0DataIndex];
            if (point?.isInterpolated) return CHART_BORDER_DASH.interpolated;
            if (point?.isExtrapolated) return CHART_BORDER_DASH.extrapolated;
            return undefined; // Solid for actual
          },
        },
      });
    }

    return {
      labels: costData.map(d => d.period),
      datasets,
    };
  }, [costData, viewMode, typeFilter]);

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

  // Chart options for costs (line charts)
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
          label: (context: TooltipItem<'line'>) => {
            const datasetLabel = context.dataset.label || '';
            const consumption = context.parsed.y ?? 0;
            const periodIndex = context.dataIndex;
            const period = costData?.[periodIndex];

            // Get breakdown for this energy type
            const energyType = datasetLabel.toLowerCase().includes('power') ? 'power' : 'gas';
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
              return `${datasetLabel}: ${consumption.toFixed(2)} kWh${dataTypeIndicator}`;
            }

            // Return detailed breakdown with cost
            lines.push(`${datasetLabel}: ${consumption.toFixed(2)} kWh${dataTypeIndicator}`);
            lines.push(`  Cost: €${breakdown.totalCost.toFixed(2)}`);
            lines.push(`  Base: €${breakdown.basePrice.toFixed(2)}`);
            lines.push(`  Rate: €${breakdown.workingPrice.toFixed(4)}/kWh`);

            return lines;
          },
          footer: (tooltipItems: TooltipItem<'line'>[]) => {
            const periodIndex = tooltipItems[0]?.dataIndex;
            const period = costData?.[periodIndex];
            if (period) {
              return `Total Cost: €${period.totalCost.toFixed(2)}`;
            }
            return '';
          },
        },
      },
    },
    scales: {
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
      },
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
          callback: function(value: any) {
            return value + ' kWh';
          },
        },
        title: {
          display: true,
          text: "Consumption (kWh)",
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
        : "Energy Consumption";
    }
    return viewMode === "monthly" ? "Monthly Consumption" : "Yearly Consumption";
  };

  // Calculate detailed cost breakdown with type filter applied
  const costBreakdown = useMemo(() => {
    if (!costData) return null;

    const breakdown = {
      power: { consumption: 0, cost: 0, show: typeFilter === "all" || typeFilter === "power" },
      gas: { consumption: 0, cost: 0, show: typeFilter === "all" || typeFilter === "gas" },
      total: 0,
      periodCount: costData.length,
      avgCostPerPeriod: 0,
    };

    costData.forEach(period => {
      if (breakdown.power.show && period.breakdown?.power) {
        breakdown.power.consumption += period.breakdown.power.consumption;
        breakdown.power.cost += period.breakdown.power.totalCost;
      }
      if (breakdown.gas.show && period.breakdown?.gas) {
        breakdown.gas.consumption += period.breakdown.gas.consumption;
        breakdown.gas.cost += period.breakdown.gas.totalCost;
      }
      // Total always includes all types in the filtered data
      breakdown.total += period.totalCost;
    });

    breakdown.avgCostPerPeriod = breakdown.periodCount > 0 ? breakdown.total / breakdown.periodCount : 0;

    return breakdown;
  }, [costData, typeFilter]);

  return (
    <div className="w-full space-y-4">
      {/* Controls */}
      <div className="flex flex-col gap-3">
        {/* View Mode Selector */}
        <ButtonGroupRadio
          options={viewModeOptions}
          value={viewMode}
          onChange={setViewMode}
          name="viewMode"
          variant="primary"
        />

        {/* Secondary Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Year Navigation (for monthly view) - Secondary Control */}
          {viewMode === "monthly" && availableYears.length > 0 && (
            <div ref={yearDropdownRef} className="relative flex items-center gap-1 bg-secondary/10 rounded-md px-2 py-1 border border-border/50">
              <button
                onClick={() => {
                  const currentIndex = availableYears.indexOf(selectedYear);
                  if (currentIndex < availableYears.length - 1) {
                    setSelectedYear(availableYears[currentIndex + 1]);
                  }
                }}
                disabled={availableYears.indexOf(selectedYear) === availableYears.length - 1}
                className="p-1 rounded hover:bg-secondary/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Previous year"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button
                onClick={() => setShowYearDropdown(!showYearDropdown)}
                className="px-2 py-0.5 text-xs font-medium text-muted-foreground min-w-[3.5rem] text-center hover:bg-secondary/50 hover:text-foreground rounded transition-colors flex items-center justify-center gap-1"
              >
                {selectedYear}
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {showYearDropdown && (
                <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-background border border-border rounded-lg shadow-lg z-10 min-w-[8rem] max-h-[200px] overflow-y-auto">
                  {availableYears.map((year) => (
                    <button
                      key={year}
                      onClick={() => {
                        setSelectedYear(year);
                        setShowYearDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-sm text-left hover:bg-secondary transition-colors ${
                        year === selectedYear ? "bg-primary/10 font-medium" : ""
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={() => {
                  const currentIndex = availableYears.indexOf(selectedYear);
                  if (currentIndex > 0) {
                    setSelectedYear(availableYears[currentIndex - 1]);
                  }
                }}
                disabled={availableYears.indexOf(selectedYear) === 0}
                className="p-1 rounded hover:bg-secondary/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Next year"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          )}

          {/* Meter Reading / Consumption Toggle (for measurements view) - Secondary Control */}
          {viewMode === "measurements" && (
            <ButtonGroupRadio
              options={dataModeOptions}
              value={dataMode}
              onChange={setDataMode}
              name="dataMode"
              variant="secondary"
            />
          )}
        </div>
      </div>

      {/* Title */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          {getTitle()}
        </h3>
      </div>

      {/* Chart Container */}
      <div className="relative w-full" style={{ height: 'clamp(300px, 50vh, 500px)' }}>
        {viewMode === "measurements" && measurementsChartData ? (
          <Line options={measurementsOptions} data={measurementsChartData} />
        ) : costChartData ? (
          <Line options={costOptions} data={costChartData} />
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
          <div className="flex items-center justify-center gap-6 pt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <svg width="24" height="12" viewBox="0 0 24 12" className="inline-block">
                <line x1="0" y1="6" x2="24" y2="6" stroke="currentColor" strokeWidth="2.5" />
              </svg>
              <span>Actual data</span>
            </span>
            <span className="flex items-center gap-2">
              <svg width="24" height="12" viewBox="0 0 24 12" className="inline-block">
                <line x1="0" y1="6" x2="24" y2="6" stroke="currentColor" strokeWidth="2.5" strokeDasharray="5 5" />
              </svg>
              <span>Interpolated</span>
            </span>
            <span className="flex items-center gap-2">
              <svg width="24" height="12" viewBox="0 0 24 12" className="inline-block">
                <line x1="0" y1="6" x2="24" y2="6" stroke="currentColor" strokeWidth="2.5" strokeDasharray="10 5" />
              </svg>
              <span>Extrapolated</span>
            </span>
          </div>
        )}
      </div>

      {/* Cost Summary Section */}
      {costBreakdown && (
        <div className="bg-secondary/20 rounded-lg p-4 border border-border">
          <h4 className="text-sm font-semibold text-foreground mb-3">Cost Summary</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Power Summary - only show if filter allows */}
            {costBreakdown.power.show && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-foreground flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: getEnergyTypeChartConfig("power").borderColor }}></span>
                  {getEnergyTypeLabel("power")}
                </div>
                <div className="text-xs text-muted-foreground">
                  Consumption: <span className="font-medium text-foreground">{costBreakdown.power.consumption.toFixed(2)} kWh</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Cost: <span className="font-medium text-foreground">€{costBreakdown.power.cost.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Gas Summary - only show if filter allows */}
            {costBreakdown.gas.show && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-foreground flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: getEnergyTypeChartConfig("gas").borderColor }}></span>
                  {getEnergyTypeLabel("gas")}
                </div>
                <div className="text-xs text-muted-foreground">
                  Consumption: <span className="font-medium text-foreground">{costBreakdown.gas.consumption.toFixed(2)} kWh</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Cost: <span className="font-medium text-foreground">€{costBreakdown.gas.cost.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Total Summary */}
            <div className="space-y-1">
              <div className="text-xs font-medium text-foreground">Total</div>
              <div className="text-xs text-muted-foreground">
                Total Consumption: <span className="font-medium text-foreground">{(costBreakdown.power.consumption + costBreakdown.gas.consumption).toFixed(2)} kWh</span>
              </div>
              <div className="text-sm font-bold text-foreground">
                Total Cost: €{costBreakdown.total.toFixed(2)}
              </div>
              {viewMode !== "measurements" && (
                <div className="text-xs text-muted-foreground">
                  Avg per {viewMode === "monthly" ? "month" : "year"}: <span className="font-medium text-foreground">€{costBreakdown.avgCostPerPeriod.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedEnergyChart;
