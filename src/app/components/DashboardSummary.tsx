"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { EnergyType, ContractType, EnergyOptions } from "../types";
import { formatDateToBrowserLocale } from "../utils/dateUtils";
import { PowerIcon, GasIcon, TrendingUpIcon, TrendingDownIcon, CalendarIcon, CurrencyIcon } from "./icons";
import { getProjectionsAction } from "@/actions/projections";
import { ProjectionResult } from "@/services/projections/ProjectionService";
import { useState, useEffect } from "react";

interface DashboardSummaryProps {
  energyData: EnergyType[];
  contracts: ContractType[];
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  onClick?: () => void;
}

const MetricCard = ({ title, value, subtitle, icon, trend, onClick }: MetricCardProps) => {
  const getTrendIcon = () => {
    if (trend === "up") return <TrendingUpIcon className="w-4 h-4 text-destructive" />;
    if (trend === "down") return <TrendingDownIcon className="w-4 h-4 text-success" />;
    return null;
  };

  return (
    <div
      className={`metric-card ${onClick ? 'metric-card-clickable' : ''}`}
      onClick={onClick}
    >
      <div className="metric-card-header">
        <div className="metric-card-icon">{icon}</div>
        {trend && <div className="metric-card-trend">{getTrendIcon()}</div>}
      </div>
      <div className="metric-card-content">
        <h3 className="metric-card-title">{title}</h3>
        <p className="metric-card-value">{value}</p>
        {subtitle && <p className="metric-card-subtitle">{subtitle}</p>}
      </div>
    </div>
  );
};

const DashboardSummary = ({ energyData, contracts }: DashboardSummaryProps) => {
  const router = useRouter();
  const [powerProjection, setPowerProjection] = useState<ProjectionResult | null>(null);
  const [gasProjection, setGasProjection] = useState<ProjectionResult | null>(null);

  useEffect(() => {
    const fetchProjections = async () => {
      try {
        const [p, g] = await Promise.all([
          getProjectionsAction("power"),
          getProjectionsAction("gas"),
        ]);
        setPowerProjection(p);
        setGasProjection(g);
      } catch (err) {
        console.error("Failed to fetch projections:", err);
      }
    };
    fetchProjections();
  }, []);

  const metrics = useMemo(() => {
    // Total readings
    const totalReadings = energyData.length;

    // Get latest readings by type
    const getLatestReading = (type: EnergyOptions): EnergyType | undefined => {
      return energyData
        .filter((d) => d.type === type)
        .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
    };

    const latestPower = getLatestReading("power");
    const latestGas = getLatestReading("gas");

    // Calculate this month's consumption
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthData = energyData.filter((d) => d.date >= firstDayOfMonth);

    const calculateConsumption = (type: EnergyOptions): number => {
      const typeData = thisMonthData
        .filter((d) => d.type === type)
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      if (typeData.length < 2) return 0;

      const firstReading = typeData[0].amount;
      const lastReading = typeData[typeData.length - 1].amount;
      return lastReading - firstReading;
    };

    const powerConsumption = calculateConsumption("power");
    const gasConsumption = calculateConsumption("gas");

    // Get active contracts
    const activeContracts = contracts.filter((c) => {
      const isStarted = c.startDate <= now;
      const isNotEnded = !c.endDate || c.endDate >= now;
      return isStarted && isNotEnded;
    });

    // Calculate estimated cost for this month
    const calculateEstimatedCost = (): number => {
      let totalCost = 0;

      activeContracts.forEach((contract) => {
        const consumption =
          contract.type === "power" ? powerConsumption : gasConsumption;
        const cost = contract.basePrice + consumption * contract.workingPrice;
        totalCost += cost;
      });

      return totalCost;
    };

    const estimatedCost = calculateEstimatedCost();

    return {
      totalReadings,
      latestPower,
      latestGas,
      powerConsumption,
      gasConsumption,
      activeContracts: activeContracts.length,
      estimatedCost,
    };
  }, [energyData, contracts]);

  return (
    <div className="dashboard-summary">
      <div className="dashboard-welcome">
        <h1 className="dashboard-title">Energy Dashboard</h1>
        <p className="dashboard-subtitle">
          Overview of your energy consumption and costs
        </p>
      </div>

      <div className="metrics-grid">
        <MetricCard
          title="Total Readings"
          value={metrics.totalReadings}
          subtitle="All time"
          icon={<CalendarIcon className="w-6 h-6" />}
          onClick={() => router.push("/readings")}
        />

        <MetricCard
          title="Latest Power Reading"
          value={metrics.latestPower ? `${metrics.latestPower.amount.toFixed(2)} kWh` : "No data"}
          subtitle={
            metrics.latestPower
              ? formatDateToBrowserLocale(metrics.latestPower.date)
              : undefined
          }
          icon={<PowerIcon className="w-6 h-6" />}
        />

        <MetricCard
          title="Latest Gas Reading"
          value={metrics.latestGas ? `${metrics.latestGas.amount.toFixed(2)} m³` : "No data"}
          subtitle={
            metrics.latestGas
              ? formatDateToBrowserLocale(metrics.latestGas.date)
              : undefined
          }
          icon={<GasIcon className="w-6 h-6" />}
        />

        <MetricCard
          title="Active Contracts"
          value={metrics.activeContracts}
          subtitle="Currently active"
          icon={<CurrencyIcon className="w-6 h-6" />}
          onClick={() => router.push("/contracts")}
        />
      </div>

      <div className="consumption-section">
        <h2 className="section-title">This Month&apos;s Consumption</h2>
        <div className="consumption-grid">
          <MetricCard
            title="Power Consumption"
            value={
              metrics.powerConsumption > 0
                ? `${metrics.powerConsumption.toFixed(2)} kWh`
                : "Insufficient data"
            }
            icon={<PowerIcon className="w-6 h-6" />}
            trend={metrics.powerConsumption > 0 ? "up" : "neutral"}
          />

          <MetricCard
            title="Gas Consumption"
            value={
              metrics.gasConsumption > 0
                ? `${metrics.gasConsumption.toFixed(2)} m³`
                : "Insufficient data"
            }
            icon={<GasIcon className="w-6 h-6" />}
            trend={metrics.gasConsumption > 0 ? "up" : "neutral"}
          />

          {metrics.estimatedCost > 0 && (
            <MetricCard
              title="Estimated Cost"
              value={`€${metrics.estimatedCost.toFixed(2)}`}
              subtitle="Based on active contracts"
              icon={<CurrencyIcon className="w-6 h-6" />}
            />
          )}
        </div>
      </div>

      <div className="consumption-section">
        <h2 className="section-title">Consumption Projections</h2>
        <div className="consumption-grid">
          <MetricCard
            title="Power Projection"
            value={
              powerProjection 
                ? `€${powerProjection.currentMonth.estimatedCost.toFixed(2)}`
                : "Calculating..."
            }
            subtitle={
              powerProjection 
                ? `Est. total for this month`
                : undefined
            }
            icon={<TrendingUpIcon className="w-6 h-6 text-primary" />}
            onClick={() => router.push("/history")}
          />

          <MetricCard
            title="Gas Projection"
            value={
              gasProjection 
                ? `€${gasProjection.currentMonth.estimatedCost.toFixed(2)}`
                : "Calculating..."
            }
            subtitle={
              gasProjection 
                ? `Est. total for this month`
                : undefined
            }
            icon={<TrendingUpIcon className="w-6 h-6 text-secondary" />}
            onClick={() => router.push("/history")}
          />
        </div>
      </div>

      <div className="quick-actions">
        <h2 className="section-title">Quick Actions</h2>
        <div className="actions-grid">
          <button
            onClick={() => router.push("/add")}
            className="action-card button-primary"
          >
            <div className="action-card-content">
              <h3 className="action-card-title">Add Reading</h3>
              <p className="action-card-description">
                Record new energy consumption data
              </p>
            </div>
          </button>

          <button
            onClick={() => router.push("/readings")}
            className="action-card button-secondary"
          >
            <div className="action-card-content">
              <h3 className="action-card-title">View Readings</h3>
              <p className="action-card-description">
                Browse detailed energy meter readings
              </p>
            </div>
          </button>

          <button
            onClick={() => router.push("/contracts")}
            className="action-card button-secondary"
          >
            <div className="action-card-content">
              <h3 className="action-card-title">Manage Contracts</h3>
              <p className="action-card-description">
                View and edit your energy contracts
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardSummary;
