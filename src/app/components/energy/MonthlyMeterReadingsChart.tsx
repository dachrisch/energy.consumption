"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { EnergyType } from "@/app/types";
import { calculateMonthlyReadings } from "@/app/services/MonthlyDataAggregationService";
import { getEnergyTypeLabel, getEnergyTypeChartConfig } from "@/app/constants/energyTypes";
import { CHART_BORDER_DASH, CHART_POINT_RADIUS } from "@/app/constants/ui";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { ChartOptions, ScriptableLineSegmentContext } from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface MonthlyMeterReadingsChartProps {
  energyData: EnergyType[];
  selectedYear: number;
  onYearChange: (year: number) => void;
  availableYears: number[];
}

const MonthlyMeterReadingsChart = ({
  energyData,
  selectedYear,
  onYearChange,
  availableYears,
}: MonthlyMeterReadingsChartProps) => {
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const yearDropdownRef = useRef<HTMLDivElement>(null);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Calculate monthly data for Power and Gas
  const powerData = useMemo(
    () => calculateMonthlyReadings(energyData, selectedYear, 'power'),
    [energyData, selectedYear]
  );

  const gasData = useMemo(
    () => calculateMonthlyReadings(energyData, selectedYear, 'gas'),
    [energyData, selectedYear]
  );

  // Transform Power data to Chart.js format
  const powerChartData = useMemo(() => {
    const labels = powerData.map(d => d.monthLabel);
    const values = powerData.map(d => d.meterReading);
    const config = getEnergyTypeChartConfig('power');

    return {
      labels,
      datasets: [{
        label: getEnergyTypeLabel('power'),
        data: values,
        borderColor: config.borderColor,
        backgroundColor: config.backgroundColor,
        borderWidth: 2.5,
        tension: 0.4,
        pointRadius: powerData.map(d => d.meterReading !== null ? CHART_POINT_RADIUS.normal : 0),
        pointHoverRadius: 6,
        pointStyle: 'circle',
        pointBackgroundColor: powerData.map(d => {
          if (d.meterReading === null) return 'transparent';
          return d.isActual ? config.borderColor : 'transparent';
        }),
        pointBorderColor: powerData.map(d => {
          if (d.meterReading === null) return 'transparent';
          return config.borderColor;
        }),
        pointBorderWidth: powerData.map(d => {
          if (d.meterReading === null) return 0;
          return d.isActual ? 0 : 2;
        }),
        pointHoverBackgroundColor: config.borderColor,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        spanGaps: true,
        fill: false,
        segment: {
          borderDash: (ctx: ScriptableLineSegmentContext) => {
            const point = powerData[ctx.p0DataIndex];
            const nextPoint = powerData[ctx.p1DataIndex];
            // Use dashed if either point is interpolated or extrapolated
            if (point?.isInterpolated || nextPoint?.isInterpolated) {
              return CHART_BORDER_DASH.interpolated;
            }
            if (point?.isExtrapolated || nextPoint?.isExtrapolated) {
              return CHART_BORDER_DASH.extrapolated;
            }
            return undefined; // Solid for actual
          },
        },
      }],
    };
  }, [powerData]);

  // Transform Gas data to Chart.js format
  const gasChartData = useMemo(() => {
    const labels = gasData.map(d => d.monthLabel);
    const values = gasData.map(d => d.meterReading);
    const config = getEnergyTypeChartConfig('gas');

    return {
      labels,
      datasets: [{
        label: getEnergyTypeLabel('gas'),
        data: values,
        borderColor: config.borderColor,
        backgroundColor: config.backgroundColor,
        borderWidth: 2.5,
        tension: 0.4,
        pointRadius: gasData.map(d => d.meterReading !== null ? CHART_POINT_RADIUS.normal : 0),
        pointHoverRadius: 6,
        pointStyle: 'circle',
        pointBackgroundColor: gasData.map(d => {
          if (d.meterReading === null) return 'transparent';
          return d.isActual ? config.borderColor : 'transparent';
        }),
        pointBorderColor: gasData.map(d => {
          if (d.meterReading === null) return 'transparent';
          return config.borderColor;
        }),
        pointBorderWidth: gasData.map(d => {
          if (d.meterReading === null) return 0;
          return d.isActual ? 0 : 2;
        }),
        pointHoverBackgroundColor: config.borderColor,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        spanGaps: true,
        fill: false,
        segment: {
          borderDash: (ctx: ScriptableLineSegmentContext) => {
            const point = gasData[ctx.p0DataIndex];
            const nextPoint = gasData[ctx.p1DataIndex];
            // Use dashed if either point is interpolated or extrapolated
            if (point?.isInterpolated || nextPoint?.isInterpolated) {
              return CHART_BORDER_DASH.interpolated;
            }
            if (point?.isExtrapolated || nextPoint?.isExtrapolated) {
              return CHART_BORDER_DASH.extrapolated;
            }
            return undefined; // Solid for actual
          },
        },
      }],
    };
  }, [gasData]);

  // Chart options
  const chartOptions: ChartOptions<'line'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false, // We'll use custom legend
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: isMobile ? 8 : 12,
        cornerRadius: 8,
        titleFont: {
          size: isMobile ? 12 : 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: isMobile ? 11 : 13,
        },
        callbacks: {
          label: (context) => {
            const dataIndex = context.dataIndex;
            const dataPoint = context.chart.data.datasets[0].label?.includes('Power')
              ? powerData[dataIndex]
              : gasData[dataIndex];

            const value = context.parsed.y;
            if (value === null) return 'No data';

            let typeIndicator = '';
            if (dataPoint.isActual) {
              typeIndicator = ' (Actual)';
            } else if (dataPoint.isInterpolated) {
              typeIndicator = ' (Interpolated)';
            } else if (dataPoint.isExtrapolated) {
              typeIndicator = ' (Extrapolated)';
            }

            return `${context.dataset.label}: ${value.toFixed(2)} kWh${typeIndicator}`;
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
          padding: isMobile ? 4 : 8,
          font: {
            size: isMobile ? 9 : 11,
          },
        },
        title: {
          display: !isMobile,
          text: "Month",
          font: {
            size: isMobile ? 10 : 12,
            weight: 'bold' as const,
          },
        },
      },
      y: {
        beginAtZero: false, // Start from data minimum for better readability
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        ticks: {
          padding: isMobile ? 4 : 8,
          font: {
            size: isMobile ? 9 : 11,
          },
        },
        title: {
          display: !isMobile,
          text: "Meter Reading (kWh)",
          font: {
            size: isMobile ? 10 : 12,
            weight: 'bold' as const,
          },
        },
      },
    },
  }), [isMobile, powerData, gasData]);

  // Handle year navigation
  const handlePrevYear = () => {
    const currentIndex = availableYears.indexOf(selectedYear);
    if (currentIndex < availableYears.length - 1) {
      onYearChange(availableYears[currentIndex + 1]);
    }
  };

  const handleNextYear = () => {
    const currentIndex = availableYears.indexOf(selectedYear);
    if (currentIndex > 0) {
      onYearChange(availableYears[currentIndex - 1]);
    }
  };

  // Empty state
  if (energyData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No meter readings available. Add energy readings to see monthly charts.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Year Navigation */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Monthly Meter Readings - {selectedYear}
        </h3>

        {availableYears.length > 0 && (
          <div ref={yearDropdownRef} className="relative flex items-center gap-1 bg-secondary/10 rounded-md px-2 py-1 border border-border/50">
            <button
              onClick={handlePrevYear}
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
                      onYearChange(year);
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
              onClick={handleNextYear}
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
      </div>

      {/* Power Chart */}
      <div>
        <h4 className="text-md font-semibold mb-2 text-foreground">Power Meter Readings</h4>
        <div className="relative w-full" style={{ height: 'clamp(300px, 50vh, 500px)' }}>
          <Line data={powerChartData} options={chartOptions} />
        </div>
      </div>

      {/* Gas Chart */}
      <div>
        <h4 className="text-md font-semibold mb-2 text-foreground">Gas Meter Readings</h4>
        <div className="relative w-full" style={{ height: 'clamp(300px, 50vh, 500px)' }}>
          <Line data={gasChartData} options={chartOptions} />
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          <svg width="24" height="12" viewBox="0 0 24 12">
            <line x1="0" y1="6" x2="24" y2="6" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="6" r="4" fill="currentColor" />
          </svg>
          <span>Actual</span>
        </span>
        <span className="flex items-center gap-2">
          <svg width="24" height="12" viewBox="0 0 24 12">
            <line x1="0" y1="6" x2="24" y2="6" stroke="currentColor" strokeWidth="2" strokeDasharray="5 5" />
            <circle cx="12" cy="6" r="4" fill="transparent" stroke="currentColor" strokeWidth="2" />
          </svg>
          <span>Interpolated</span>
        </span>
        <span className="flex items-center gap-2">
          <svg width="24" height="12" viewBox="0 0 24 12">
            <line x1="0" y1="6" x2="24" y2="6" stroke="currentColor" strokeWidth="2" strokeDasharray="10 5" />
            <circle cx="12" cy="6" r="4" fill="transparent" stroke="currentColor" strokeWidth="2" />
          </svg>
          <span>Extrapolated</span>
        </span>
      </div>
    </div>
  );
};

export default MonthlyMeterReadingsChart;
