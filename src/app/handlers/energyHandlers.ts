import { SortOrder } from "mongoose";
import {
  EnergyOptions,
  EnergySortField,
  EnergyData,
  EnergyTimeSeries,
} from "../types";
import { ChartData } from "chart.js";
import { timeEvent } from "@/lib/pond/event";
import { time } from "@/lib/pond/time";
import { TimeSeries } from "@/lib/pond/timeseries";
import * as Immutable from 'immutable';

export const getLatestValues = (energyData: EnergyData) => {
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
  seriesData: EnergyTimeSeries,
  typeFilter: EnergyOptions | "all"
): ChartData<"line", (number | null)[], string> => {
  const labelsSet = new Set<string>();
  const dataMap = new Map<string, Partial<Record<EnergyOptions, number>>>();

  (Object.keys(seriesData) as EnergyOptions[]).forEach((type) => {
    const series = seriesData[type];
    if (!series) return;

    series.forEach((event) => {
      if (undefined !== event) {
        const dateStr = event.timestamp().toLocaleDateString();
        labelsSet.add(dateStr);

        if (!dataMap.has(dateStr)) {
          dataMap.set(dateStr, {});
        }

        const entry = dataMap.get(dateStr)!;
        entry[type] = event.get("amount");
      }
    });
  });

  const labels = Array.from(labelsSet).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  const datasets = (Object.keys(seriesData) as EnergyOptions[]).map((type) => ({
    label: type.charAt(0).toUpperCase() + type.slice(1),
    data: labels.map((date) => dataMap.get(date)?.[type] ?? null),
    borderColor: type === "power" ? "rgb(75, 192, 192)" : "rgb(255, 99, 132)",
    backgroundColor:
      type === "power" ? "rgba(75, 192, 192, 0.5)" : "rgba(255, 99, 132, 0.5)",
    tension: 0.1,
    hidden: typeFilter !== "all" && type !== typeFilter,
    spanGaps: true,
  }));

  return { labels, datasets };
};

export const createTimeSeriesByType = (
  energyData: EnergyData
): EnergyTimeSeries => {
  const groupedData = energyData.reduce((acc, d) => {
    if (!acc[d.type]) {
      acc[d.type] = [];
    }
    acc[d.type].push(d);
    return acc;
  }, {} as Record<EnergyOptions, EnergyData>);

  const result: EnergyTimeSeries = Object.fromEntries(
    Object.entries(groupedData).map(([type, data]) => {
      const events = data.map((d) =>
        timeEvent(time(d.date), Immutable.Map({ amount: d.amount }))
      );

      return [
        type,
        new TimeSeries({
          name: type,
          events: Immutable.List(events),
        }),
      ];
    })
  ) as EnergyTimeSeries;

  return result;
};
