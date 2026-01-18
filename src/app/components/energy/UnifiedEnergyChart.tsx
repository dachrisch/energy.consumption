"use client";

import { useMemo } from "react";
import { UnifiedInsightData } from "@/app/types";
import { getEnergyTypeLabel, getEnergyTypeChartConfig } from "@/app/constants/energyTypes";
import { CHART_BORDER_DASH, CHART_POINT_RADIUS } from "@/app/constants/ui";
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
import type { ScriptableLineSegmentContext } from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface UnifiedEnergyChartProps {
  data: UnifiedInsightData;
}

const UnifiedEnergyChart = ({ data }: UnifiedEnergyChartProps) => {
  const { points, energyType } = data;
  
  const chartData = useMemo(() => {
    const labels = points.map(p => p.monthLabel);
    const values = points.map(p => p.consumption);
    const config = getEnergyTypeChartConfig(energyType);

    return {
      labels,
      datasets: [
        {
          label: `${getEnergyTypeLabel(energyType)} Consumption`,
          data: values,
          borderColor: config.borderColor,
          backgroundColor: config.backgroundColor,
          borderWidth: 2.5,
          tension: 0.4,
          pointRadius: points.map(p => p.consumption !== null ? CHART_POINT_RADIUS.normal : 0),
          pointHoverRadius: 6,
          pointBackgroundColor: points.map(p => {
             if (p.type === 'actual') return config.borderColor;
             return 'transparent';
          }),
          pointBorderColor: config.borderColor,
          pointBorderWidth: points.map(p => p.type === 'actual' ? 0 : 2),
          spanGaps: true,
          segment: {
            borderDash: (ctx: ScriptableLineSegmentContext) => {
              const point = points[ctx.p0DataIndex];
              const nextPoint = points[ctx.p1DataIndex];
              
              // Priority: Forecast/Projected > Interpolated > Actual
              if (point?.isForecast || nextPoint?.isForecast || point?.type === 'projected' || nextPoint?.type === 'projected') {
                return CHART_BORDER_DASH.extrapolated;
              }
              if (point?.type === 'interpolated' || nextPoint?.type === 'interpolated') {
                return CHART_BORDER_DASH.interpolated;
              }
              return undefined; // Solid for actual
            },
          },
        }
      ]
    };
  }, [points, energyType]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const dataIndex = context.dataIndex;
            const point = points[dataIndex];
            const value = context.parsed.y;
            const unit = energyType === 'power' ? 'kWh' : 'm³';
            
            let typeLabel = '';
            switch (point.type) {
              case 'actual': typeLabel = '(Actual)'; break;
              case 'interpolated': typeLabel = '(Interpolated)'; break;
              case 'projected': typeLabel = '(Projected)'; break;
              case 'mixed': typeLabel = '(Mixed)'; break;
            }
            
            return `Consumption: ${value.toFixed(2)} ${unit} ${typeLabel}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        title: {
          display: true,
          text: `Consumption (${energyType === 'power' ? 'kWh' : 'm³'})`,
        }
      },
      x: {
        grid: {
          display: false,
        }
      }
    }
  };

  return (
    <div className="w-full space-y-4">
      <h3 className="text-lg font-semibold capitalize">
        {energyType} Consumption Insights
      </h3>
      <div className="relative w-full h-[350px] md:h-[450px]">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Line data={chartData as any} options={options as any} />
      </div>
    </div>
  );
};

export default UnifiedEnergyChart;