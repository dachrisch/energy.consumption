"use client";

import React from 'react';
import { InsightDataPoint, EnergyOptions } from '@/app/types';

interface InsightsDataCardProps {
  point: InsightDataPoint;
  energyType: EnergyOptions;
}

/**
 * Insights Data Card
 * 
 * Displays monthly consumption details in a mobile-optimized card format.
 * Distinguishes between historical data and future projections.
 */
const InsightsDataCard = ({ point, energyType }: InsightsDataCardProps) => {
  const unit = energyType === 'power' ? 'kWh' : 'm³';
  
  // Define styling based on data type
  const getTypeStyles = () => {
    switch (point.type) {
      case 'actual':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'projected':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'interpolated':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'mixed':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div className={`p-4 rounded-xl border transition-all hover:shadow-md ${
      point.isForecast 
        ? 'border-blue-500/30 bg-blue-500/5 shadow-sm' 
        : 'border-border bg-card'
    }`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="text-sm font-semibold text-foreground">
            {point.monthLabel} {point.year}
          </h4>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            {point.isForecast ? 'Forecast Period' : 'Historical Data'}
          </p>
        </div>
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getTypeStyles()}`}>
          {point.type}
        </span>
      </div>
      
      <div className="space-y-1">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {point.consumption?.toFixed(1) || '0.0'}
          </span>
          <span className="text-sm font-medium text-muted-foreground">{unit}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[11px] text-muted-foreground font-medium">Monthly Consumption</span>
          {point.cost !== null && (
            <span className="text-sm font-bold text-foreground">
              €{point.cost.toFixed(2)}
            </span>
          )}
        </div>
      </div>
      
      {point.isForecast && (
        <div className="mt-3 pt-3 border-t border-blue-500/10">
          <div className="flex items-center gap-1.5 text-[10px] text-blue-500 font-medium">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Based on current usage trends
          </div>
        </div>
      )}
    </div>
  );
};

export default InsightsDataCard;
