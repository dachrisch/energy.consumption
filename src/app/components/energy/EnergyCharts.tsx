"use client";

import { EnergyType, EnergyOptions } from "@/app/types";
import {  getFilteredAndSortedData } from "@/app/handlers/energyHandlers";
import { getChartData } from "@/app/handlers/chartData";
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

  const timeSeriesData = createTimeSeriesByType(filteredData);

  const chartData = getChartData(timeSeriesData, typeFilter);

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

      <Line options={options} data={chartData} />
    </div>
  );
};

export default EnergyCharts;
