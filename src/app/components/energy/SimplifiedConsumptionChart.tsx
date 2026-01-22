"use client";

import { useMemo, useState } from "react";
import { format, startOfWeek, startOfMonth } from "date-fns";
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
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Reading, Meter } from "@/app/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { TrendingUp } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/app/components/ui/tabs";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SimplifiedConsumptionChartProps {
  readings: Reading[];
  meter: Meter;
}

type Period = "daily" | "weekly" | "monthly";

export default function SimplifiedConsumptionChart({ readings, meter }: SimplifiedConsumptionChartProps) {
  const [period, setPeriod] = useState<Period>("daily");

  const chartData = useMemo(() => {
    if (readings.length < 2) return null;

    // Sort readings by date ascending
    const sorted = [...readings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // 1. Calculate raw consumption between each reading
    const dailyData: { date: Date; consumption: number; days: number }[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      const diff = curr.value - prev.value;
      const days = Math.max(1, (new Date(curr.date).getTime() - new Date(prev.date).getTime()) / (1000 * 60 * 60 * 24));
      
      // Distribute consumption across the days (simplified)
      dailyData.push({ 
        date: new Date(curr.date), 
        consumption: diff,
        days: days
      });
    }

    // 2. Aggregate based on period
    const labels: string[] = [];
    const values: number[] = [];

    if (period === "daily") {
      dailyData.forEach(d => {
        labels.push(format(d.date, "MMM d"));
        values.push(d.consumption / d.days); // Avg daily consumption in that period
      });
    } else if (period === "weekly") {
      // Group by week
      const weeklyMap = new Map<string, number>();
      dailyData.forEach(d => {
        const weekStart = startOfWeek(d.date);
        const key = format(weekStart, "yyyy-'W'ww");
        weeklyMap.set(key, (weeklyMap.get(key) || 0) + d.consumption);
      });
      Array.from(weeklyMap.entries()).sort().forEach(([key, val]) => {
        labels.push(key);
        values.push(val);
      });
    } else {
      // Group by month
      const monthlyMap = new Map<string, number>();
      dailyData.forEach(d => {
        const monthStart = startOfMonth(d.date);
        const key = format(monthStart, "MMM yyyy");
        monthlyMap.set(key, (monthlyMap.get(key) || 0) + d.consumption);
      });
      Array.from(monthlyMap.entries()).forEach(([key, val]) => {
        labels.push(key);
        values.push(val);
      });
    }

    const isPower = meter.type === "power";
    const color = isPower ? "oklch(0.627 0.265 303.9)" : "oklch(0.645 0.246 16.439)";

    return {
      labels,
      datasets: [
        {
          label: period === "daily" ? "Avg Daily Consumption" : "Total Consumption",
          data: values,
          borderColor: color,
          backgroundColor: color.replace(")", " / 0.1)"),
          fill: true,
          tension: 0.4,
        }
      ]
    };
  }, [readings, meter, period]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: "index" as const, intersect: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: meter.unit }
      },
      x: { grid: { display: false } }
    }
  };

  if (readings.length < 2) return null;

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Consumption Trends
          </CardTitle>
          <CardDescription>Usage over time</CardDescription>
        </div>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <TabsList className="grid w-[240px] grid-cols-3">
            <TabsTrigger value="daily">Day</TabsTrigger>
            <TabsTrigger value="weekly">Week</TabsTrigger>
            <TabsTrigger value="monthly">Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full mt-4">
          {chartData && <Line data={chartData} options={options} />}
        </div>
      </CardContent>
    </Card>
  );
}