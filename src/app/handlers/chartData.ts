import { ChartData } from "chart.js";
import { EnergyTimeSeries, EnergyOptions } from "../types";


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
    backgroundColor: type === "power" ? "rgba(75, 192, 192, 0.5)" : "rgba(255, 99, 132, 0.5)",
    tension: 0.1,
    hidden: typeFilter !== "all" && type !== typeFilter,
    spanGaps: true,
  }));

  return { labels, datasets };
};
