"use client";

import { useState, useMemo } from "react";
import { useEnergyInsights } from "@/app/hooks/useEnergyInsights";
import { useEnergyData } from "@/app/hooks/useEnergyData";
import { EnergyOptions } from "@/app/types";
import UnifiedEnergyChart from "@/app/components/energy/UnifiedEnergyChart";
import EnergyTableFilters from "@/app/components/energy/EnergyTableFilters";
import { getAvailableYears } from "@/app/handlers/costCalculation";

/**
 * Insights Page
 * 
 * Unified view combining historical consumption and future projections.
 */
export default function InsightsPage() {
  const [energyType, setEnergyType] = useState<EnergyOptions>("power");
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  
  const { data: energyData } = useEnergyData();
  const { data, isLoading, error, refetch } = useEnergyInsights(energyType, selectedYear);

  // Date range state for filters (required but insights are currently year-based)
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1),
    end: new Date()
  });

  const availableYears = useMemo(() => {
    const years = getAvailableYears(energyData || []);
    // Ensure current year is always available for projections
    if (!years.includes(currentYear)) {
      years.unshift(currentYear);
      years.sort((a, b) => b - a);
    }
    return years;
  }, [energyData, currentYear]);

  // Handle type toggle
  const handleTypeChange = (types: EnergyOptions[]) => {
    if (types.length > 0) {
      setEnergyType(types[0]);
    }
  };

  // Handle reset
  const handleReset = () => {
    setEnergyType("power");
    setSelectedYear(currentYear);
  };

  // Handle year navigation
  const handlePrevYear = () => {
    const currentIndex = availableYears.indexOf(selectedYear);
    if (currentIndex < availableYears.length - 1) {
      setSelectedYear(availableYears[currentIndex + 1]);
    }
  };

  const handleNextYear = () => {
    const currentIndex = availableYears.indexOf(selectedYear);
    if (currentIndex > 0) {
      setSelectedYear(availableYears[currentIndex - 1]);
    }
  };

  return (
    <div className="app-root" data-testid="insights-page">
      <div className="page-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="page-header mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="app-heading text-3xl font-bold text-foreground">Energy Insights</h1>
            <p className="text-muted-foreground mt-2">
              Intelligent analysis combining your history and future usage projections.
            </p>
          </div>
          
          {/* Year Selector */}
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-1 self-start md:self-auto">
            <button 
              onClick={handlePrevYear}
              disabled={availableYears.indexOf(selectedYear) === availableYears.length - 1}
              className="p-2 hover:bg-secondary rounded-md disabled:opacity-30 transition-colors"
              title="Previous year"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-lg font-bold px-4">{selectedYear}</span>
            <button 
              onClick={handleNextYear}
              disabled={availableYears.indexOf(selectedYear) === 0}
              className="p-2 hover:bg-secondary rounded-md disabled:opacity-30 transition-colors"
              title="Next year"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="mb-8">
          <EnergyTableFilters
            energyData={energyData || []}
            selectedTypes={[energyType]}
            onTypesChange={handleTypeChange}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onReset={handleReset}
          />
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-8 border border-destructive/20">
            <p className="font-semibold">Error loading insights</p>
            <p className="text-sm">{error}</p>
            <button 
              onClick={() => refetch()}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground font-medium animate-pulse">Analyzing your energy data...</p>
          </div>
        ) : data ? (
          <div className="space-y-12 transition-all duration-500 ease-in-out">
            {/* Chart Section */}
            <section className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <UnifiedEnergyChart data={data} />
            </section>

            {/* Summary Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Actual (YTD)</p>
                <p className="text-2xl font-bold">{data.summary.periodActual.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">{energyType === 'power' ? 'kWh' : 'm³'}</span></p>
              </div>
              <div className="bg-card border border-border rounded-xl p-5 hover:border-blue-500/50 transition-colors text-blue-500">
                <p className="text-xs font-semibold uppercase tracking-wider mb-1 opacity-80">Projected (Remaining)</p>
                <p className="text-2xl font-bold">{data.summary.periodProjected.toFixed(1)} <span className="text-sm font-normal opacity-80">{energyType === 'power' ? 'kWh' : 'm³'}</span></p>
              </div>
              <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Est. (Year)</p>
                <p className="text-2xl font-bold">{data.summary.periodTotal.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">{energyType === 'power' ? 'kWh' : 'm³'}</span></p>
              </div>
              <div className="bg-card border border-border rounded-xl p-5 bg-primary/5 border-primary/20 hover:border-primary/50 transition-colors">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Total Est. Cost</p>
                <p className="text-2xl font-bold text-primary">€{data.summary.periodCost.toFixed(2)}</p>
              </div>
            </section>
          </div>
        ) : (
          <div className="text-center py-20 bg-secondary/10 rounded-2xl border border-dashed border-border">
            <p className="text-muted-foreground">No insights available. Please add more meter readings to enable projections.</p>
          </div>
        )}
      </div>
    </div>
  );
}
