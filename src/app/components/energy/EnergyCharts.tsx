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
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Energy Consumption Over Time",
      },
      tooltip: {
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
        title: {
          display: true,
          text: "Amount",
        },
      },
      x: {
        title: {
          display: true,
          text: "Date",
        },
      },
    },
  };

  return (
    <div className="w-full min-h-[300px] sm:aspect-[2/1] aspect-[1/1]">
      <div className="flex justify-end mb-2">
        <button
          onClick={toggleDifferenceMode}
          className={`px-3 py-1 rounded-md text-sm ${
            showDifference ? TOGGLE_BUTTON_STYLES.active : TOGGLE_BUTTON_STYLES.inactive
          }`}
        >
          {showDifference ? "Show Actual" : "Show Difference"}
        </button>
      </div>
      <Line
        options={{
          ...options,
          plugins: {
            ...options.plugins,
            title: {
              ...options.plugins?.title,
              text: showDifference
                ? "Energy Consumption Differences Over Time"
                : "Energy Consumption Over Time"
            }
          }
        }}
        data={chartData}
      />
    </div>
  );
};

export default EnergyCharts;
