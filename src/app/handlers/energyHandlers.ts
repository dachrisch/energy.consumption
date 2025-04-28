import { SortOrder } from "mongoose";
import {
  EnergyOptions,
  EnergySortField,
  EnergyData,
} from "../types";

export const getLatestValues = (energyData: EnergyData) => {
  const latestPower =
    energyData
      .filter((data) => data.type === "power")
      .sort(
        (a, b) => b.date.getTime() - a.date.getTime()
      )[0]?.amount || 0;

  const latestGas =
    energyData
      .filter((data) => data.type === "gas")
      .sort(
        (a, b) => b.date.getTime() - a.date.getTime()
      )[0]?.amount || 0;

  return {
    power: latestPower,
    gas: latestGas,
  };
};

export const getFilteredAndSortedData = (
  energyData: EnergyData,
  typeFilter: EnergyOptions | "all",
  dateRange: { start: Date | null; end: Date | null },
  sortField: EnergySortField,
  sortOrder: SortOrder
): EnergyData => {
  let filtered = [...energyData];

  // Apply type filter
  if (typeFilter !== "all") {
    filtered = filtered.filter((data) => data.type === typeFilter);
  }

  // Apply date range filter
  if (dateRange.start || dateRange.end) {
    filtered = filtered.filter((data) => {
      const date = data.date;
      const start = dateRange.start ? dateRange.start : null;
      const end = dateRange.end ? dateRange.end : null;

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
        comparison = a.date.getTime() - b.date.getTime();
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

