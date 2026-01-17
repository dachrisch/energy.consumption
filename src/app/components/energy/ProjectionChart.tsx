"use client";

import { useMemo } from "react";
import { ProjectionResult } from "@/services/projections/ProjectionService";
import { EnergyOptions } from "@/app/types";
import { getEnergyTypeChartConfig } from "@/app/constants/energyTypes";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ProjectionChartProps {
  projection: ProjectionResult;
  type: EnergyOptions;
}

const ProjectionChart = ({ projection, type }: ProjectionChartProps) => {
  const chartConfig = getEnergyTypeChartConfig(type);
  const unit = type === "power" ? "kWh" : "m³";
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const data = useMemo(() => {
    return {
      labels: monthLabels,
      datasets: [
        {
          label: "Actual Consumption",
          data: projection.monthlyData.map(d => d.actual),
          borderColor: chartConfig.borderColor,
          backgroundColor: chartConfig.backgroundColor,
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: chartConfig.borderColor,
          tension: 0.3,
          fill: true,
        },
        {
          label: "Projected Consumption",
          data: projection.monthlyData.map(d => d.projected),
          borderColor: "#94a3b8", // slate-400
          backgroundColor: "rgba(148, 163, 184, 0.1)",
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0,
          tension: 0.3,
          fill: false,
        },
      ],
    };
  }, [projection, chartConfig]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || "";
            const value = context.parsed.y;
            return `${label}: ${value.toFixed(2)} ${unit}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: `Consumption (${unit})`,
        },
      },
    },
  };

  return (
    <div className="w-full bg-surface p-4 rounded-xl border border-border">
      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-primary"></span>
        Consumption Projection
      </h3>
      <div className="h-[300px]">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default ProjectionChart;
