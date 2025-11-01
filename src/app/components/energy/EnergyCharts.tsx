"use client";

import { useState } from "react";
import { EnergyType, EnergyOptions, EnergyTimeSeries } from "@/app/types";
import { differences } from "@/app/handlers/timeSeries";
import { getFilteredAndSortedData } from "@/app/handlers/energyHandlers";
import { getChartData } from "@/app/handlers/chartData";
import { TOGGLE_BUTTON_STYLES } from "@/app/constants/ui";
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
import { createTimeSeriesByType } from "@/app/handlers/timeSeries";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface EnergyChartsProps {
  energyData: EnergyType[];
  typeFilter: EnergyOptions | "all";
  dateRange: { start: Date | null; end: Date | null };
}

const EnergyCharts = ({
  energyData,
  typeFilter,
  dateRange,
}: EnergyChartsProps) => {

  const filteredData = getFilteredAndSortedData(
    energyData,
    typeFilter,
    dateRange,
    "date",
    "asc"
  );

  const [showDifference, setShowDifference] = useState(false);

  const timeSeriesData = createTimeSeriesByType(filteredData);

  const processedData: EnergyTimeSeries = showDifference
    ? Object.fromEntries(
      Object.entries(timeSeriesData).map(([type, series]) => [
        type,
        differences(series),
      ])
    ) as EnergyTimeSeries
    : timeSeriesData;

  const chartData = getChartData(processedData, typeFilter);

  const toggleDifferenceMode = () => {
    setShowDifference(!showDifference);
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          text: "Amount",
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

  return (
    <div className="w-full space-y-4">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-lg font-semibold text-foreground">
          {showDifference
            ? "Energy Consumption Differences"
            : "Energy Consumption Over Time"}
        </h3>
        <button
          onClick={toggleDifferenceMode}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            showDifference ? TOGGLE_BUTTON_STYLES.active : TOGGLE_BUTTON_STYLES.inactive
          }`}
        >
          {showDifference ? "Show Actual Values" : "Show Differences"}
        </button>
      </div>

      {/* Chart Container */}
      <div className="relative w-full" style={{ height: 'clamp(300px, 50vh, 500px)' }}>
        <Line options={options} data={chartData} />
      </div>
    </div>
  );
};

export default EnergyCharts;
