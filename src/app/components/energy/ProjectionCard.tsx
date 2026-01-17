"use client";

import { ProjectionResult } from "@/services/projections/ProjectionService";
import { EnergyOptions } from "@/app/types";
import { PowerIcon, GasIcon, CurrencyIcon, CalendarIcon } from "../icons";

interface ProjectionCardProps {
  projection: ProjectionResult | null;
  type: EnergyOptions;
}

const ProjectionCard = ({ projection, type }: ProjectionCardProps) => {
  const unit = type === "power" ? "kWh" : "m³";
  const icon = type === "power" ? <PowerIcon className="w-6 h-6" /> : <GasIcon className="w-6 h-6" />;

  if (!projection) {
    return (
      <div className="metric-card bg-surface-variant/20 border-dashed border-2 border-outline-variant/30">
        <div className="metric-card-content flex flex-col items-center justify-center py-6 text-center">
          <div className="mb-2 opacity-50">{icon}</div>
          <h3 className="metric-card-title text-foreground-muted">Insufficient data for projection</h3>
          <p className="metric-card-subtitle">Add more readings to see your projected costs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Current Month Projection */}
        <div className="metric-card bg-primary/5 border-primary/20">
          <div className="metric-card-header flex justify-between items-start">
            <div className="metric-card-icon text-primary">{icon}</div>
            <div className="px-2 py-1 bg-primary/10 rounded text-[10px] font-bold text-primary uppercase tracking-wider">
              Monthly Est.
            </div>
          </div>
          <div className="metric-card-content">
            <h3 className="metric-card-title">Estimated Monthly Bill</h3>
            <p className="metric-card-value text-primary">
              €{projection.currentMonth.estimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="mt-2 space-y-1">
              <p className="text-sm flex justify-between">
                <span className="text-foreground-muted">Projected Usage:</span>
                <span className="font-medium">{projection.currentMonth.estimatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {unit}</span>
              </p>
              <p className="text-xs text-foreground-subtle flex justify-between">
                <span>{projection.currentMonth.daysRemaining.toFixed(0)} days remaining</span>
                <span>(Avg. { (projection.currentMonth.estimatedTotal / 30).toFixed(2) } {unit}/day)</span>
              </p>
            </div>
          </div>
        </div>

        {/* Year Projection */}
        <div className="metric-card bg-secondary/5 border-secondary/20">
          <div className="metric-card-header flex justify-between items-start">
            <div className="metric-card-icon text-secondary"><CurrencyIcon className="w-6 h-6" /></div>
            <div className="px-2 py-1 bg-secondary/10 rounded text-[10px] font-bold text-secondary uppercase tracking-wider">
              Yearly Est.
            </div>
          </div>
          <div className="metric-card-content">
            <h3 className="metric-card-title">Full Year Projection</h3>
            <p className="metric-card-value text-secondary">
              €{projection.year.estimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="mt-2 space-y-1">
              <p className="text-sm flex justify-between">
                <span className="text-foreground-muted">Projected Usage:</span>
                <span className="font-medium">{projection.year.estimatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {unit}</span>
              </p>
              <p className="text-xs text-foreground-subtle italic">
                * Based on current average consumption
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectionCard;
