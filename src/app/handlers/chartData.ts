import { ChartData } from "chart.js";
import { EnergyTimeSeries, EnergyOptions } from "../types";
import { getEnergyTypeLabel, getEnergyTypeChartConfig } from "@/app/constants/energyTypes";

export const getChartData = (
  seriesData: EnergyTimeSeries,
  typeFilter: EnergyOptions | "all"
): ChartData<"line", (number | null)[], string> => {
  const uniqueDateLabels = new Set<string>();
  const energyValuesByDate = new Map<string, Partial<Record<EnergyOptions, number>>>();

  (Object.keys(seriesData) as EnergyOptions[]).forEach((type) => {
    const series = seriesData[type];
    if (!series) return;

    series.forEach((event) => {
      if (undefined !== event) {
        const dateStr = event.timestamp().toLocaleDateString();
        uniqueDateLabels.add(dateStr);

        if (!energyValuesByDate.has(dateStr)) {
          energyValuesByDate.set(dateStr, {});
        }

        const entry = energyValuesByDate.get(dateStr)!;
        entry[type] = event.get("amount");
      }
    });
  });

  const labels = Array.from(uniqueDateLabels).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  const datasets = (Object.keys(seriesData) as EnergyOptions[]).map((type) => {
    const config = getEnergyTypeChartConfig(type);
    return {
      label: getEnergyTypeLabel(type),
      data: labels.map((date) => energyValuesByDate.get(date)?.[type] ?? null),
      borderColor: config.borderColor,
      backgroundColor: config.backgroundColor,
      borderWidth: 2.5,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: config.borderColor,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointHoverBackgroundColor: config.borderColor,
      pointHoverBorderColor: '#fff',
      pointHoverBorderWidth: 2,
      tension: 0.4,
      hidden: typeFilter !== "all" && type !== typeFilter,
      spanGaps: true,
      fill: false,
    };
  });

  return { labels, datasets };
};
