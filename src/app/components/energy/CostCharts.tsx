"use client";

import { EnergyType, ContractType, EnergyOptions, CostData } from "../../types";
import { getFilteredAndSortedData } from "../../handlers/energyHandlers";
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
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { useEffect, useState } from "react";
import { fetchAndConvert } from "@/app/handlers/contractsHandler";

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

interface CostChartsProps {
  energyData: EnergyType[];
  typeFilter: EnergyOptions | "all";
  dateRange: { start: Date | null; end: Date | null };
  activeChart: "actual" | "monthly" | "prognosis";
}

const calculateCosts = (energyData: EnergyType[], contractData: ContractType[]): CostData[] => {
  // Group contracts by type and find the active one for each date
  const activeContracts = new Map<string, ContractType>();
  
  contractData.forEach(contract => {
    const key = contract.type;
    const existingContract = activeContracts.get(key);
    if (!existingContract || contract.startDate > existingContract.startDate) {
      activeContracts.set(key, contract);
    }
  });

  return energyData.map(energy => {
    const contract = activeContracts.get(energy.type);
    if (!contract) return null;

    const workingPrice = contract.workingPrice;
    const basePrice = contract.basePrice;
    const cost = energy.amount * workingPrice + basePrice;

    return {
      ...energy,
      cost,
      workingPrice,
      basePrice
    };
  }).filter((item): item is CostData => item !== null);
};

const CostCharts = ({
  energyData,
  typeFilter,
  dateRange,
  activeChart,
}: CostChartsProps) => {
  const [contractData, setContractData] = useState<ContractType[]>([]);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () =>
    fetchAndConvert().then((data) => setContractData(data));


  const costData = calculateCosts(energyData, contractData);
  const filteredData = getFilteredAndSortedData(
    costData,
    typeFilter,
    dateRange,
    "date",
    "asc"
  ) as CostData[];

  // Create a map of dates to power and gas costs
  const dataMap = new Map<string, { power?: number; gas?: number }>();

  filteredData.forEach((data) => {
    const dateStr = new Date(data.date).toLocaleDateString();
    if (!dataMap.has(dateStr)) {
      dataMap.set(dateStr, {});
    }
    const entry = dataMap.get(dateStr)!;
    if (data.type === "power") {
      entry.power = data.cost;
    } else {
      entry.gas = data.cost;
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
        label: "Power Cost",
        data: powerData,
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        tension: 0.1,
        hidden: typeFilter === "gas",
        spanGaps: true,
      },
      {
        label: "Gas Cost",
        data: gasData,
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        tension: 0.1,
        hidden: typeFilter === "power",
        spanGaps: true,
      },
    ],
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
        text: "Energy Costs Over Time",
      },
      tooltip: {
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: (context: any) => {
            const label = context.dataset.label || "";
            const value = context.raw;
            return value !== null ? `${label}: €${value.toFixed(2)}` : `${label}: No data`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Cost (€)",
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
      {activeChart === "actual" && <Line options={options} data={chartData} />}
      {activeChart === "monthly" && <Bar options={options} data={chartData} />}
      {activeChart === "prognosis" && <Line options={options} data={chartData} />}
    </div>
  );
};

export default CostCharts;