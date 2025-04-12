"use client";

import { EnergyDataType, EnergyType } from "../types";
import { getFilteredAndSortedData } from "../handlers/energyHandlers";
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
  energyData: EnergyDataType[];
  typeFilter: EnergyType | "all";
  dateRange: { start: string; end: string };
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

  // Create a map of dates to power and gas values
  const dataMap = new Map<string, { power?: number; gas?: number }>();

  filteredData.forEach((data) => {
    const dateStr = new Date(data.date).toLocaleDateString();
    if (!dataMap.has(dateStr)) {
      dataMap.set(dateStr, {});
    }
    const entry = dataMap.get(dateStr)!;
    if (data.type === "power") {
      entry.power = data.amount;
    } else {
      entry.gas = data.amount;
    }
  });

  // Convert the map to arrays for the chart
  const labels = Array.from(dataMap.keys());
  const powerData = labels.map((date) => dataMap.get(date)?.power ?? null);
  const gasData = labels.map((date) => dataMap.get(date)?.gas ?? null);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Power",
        data: powerData,
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        tension: 0.1,
        hidden: typeFilter === "gas",
        spanGaps: true, // This will connect points even when there are gaps
      },
      {
        label: "Gas",
        data: gasData,
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        tension: 0.1,
        hidden: typeFilter === "power",
        spanGaps: true, // This will connect points even when there are gaps
      },
    ],
  };

  const options = {
    responsive: true,
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
    <div className="w-full aspect-[2/1] min-h-[300px]">
      <Line options={options} data={chartData} />
    </div>
  );
};

export default EnergyCharts;
