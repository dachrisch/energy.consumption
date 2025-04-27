import { SortOrder } from "mongoose";
import { EnergyType, EnergyOptions, EnergySortField } from "../types";
import { ChartData } from "chart.js";

export const getLatestValues = (energyData: EnergyType[]) => {
  const latestPower =
    energyData
      .filter((data) => data.type === "power")
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0]?.amount || 0;

  const latestGas =
    energyData
      .filter((data) => data.type === "gas")
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0]?.amount || 0;

  return {
    power: latestPower,
    gas: latestGas,
  };
};

export const getFilteredAndSortedData = (
  energyData: EnergyType[],
  typeFilter: EnergyOptions | "all",
  dateRange: { start: Date | null; end: Date | null },
  sortField: EnergySortField,
  sortOrder: SortOrder
): EnergyType[] => {
  let filtered = [...energyData];

  // Apply type filter
  if (typeFilter !== "all") {
    filtered = filtered.filter((data) => data.type === typeFilter);
  }

  // Apply date range filter
  if (dateRange.start || dateRange.end) {
    filtered = filtered.filter((data) => {
      const date = new Date(data.date);
      const start = dateRange.start ? new Date(dateRange.start) : null;
      const end = dateRange.end ? new Date(dateRange.end) : null;

      if (start && date < start) return false;
      if (end && date > end) return false;
      return true;
    });
  }

  // Apply sorting
  filtered.sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "date":
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case "type":
        comparison = a.type.localeCompare(b.type);
        break;
      case "amount":
        comparison = a.amount - b.amount;
        break;
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  return filtered;
};

export const getChartData = (
  energyData: EnergyType[],
  typeFilter: EnergyOptions | "all"
): ChartData<"line", (number | null)[], string> => {
  const dataMap = new Map<string, { power?: number; gas?: number }>();

  energyData.forEach((data) => {
    const dateStr = new Date(data.date).toLocaleDateString();
    if (!dataMap.has(dateStr)) {
      dataMap.set(dateStr, {});
    }
    const entry = dataMap.get(dateStr)!;
    if (data.type === "power") {
      entry.power = data.amount;
    } else if (data.type === "gas") {
      entry.gas = data.amount;
    }
  });

  const labels = Array.from(dataMap.keys());
  const powerData = labels.map((date) => dataMap.get(date)?.power ?? null);
  const gasData = labels.map((date) => dataMap.get(date)?.gas ?? null);

  return {
    labels,
    datasets: [
      {
        label: "Power",
        data: powerData,
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        tension: 0.1,
        hidden: typeFilter === "gas",
        spanGaps: true,
      },
      {
        label: "Gas",
        data: gasData,
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        tension: 0.1,
        hidden: typeFilter === "power",
        spanGaps: true,
      },
    ],
  };
};
