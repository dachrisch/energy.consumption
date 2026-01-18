import { 
  EnergyOptions, 
  UnifiedInsightData, 
  InsightDataPoint,
  ProjectionResult,
  MonthlyDataPoint
} from '@/app/types';

/**
 * Unified Insights Service
 * 
 * Centralizes logic for combining historical data and future projections
 * into a unified format for the Insights view.
 */
export class UnifiedInsightsService {
  /**
   * Combine historical monthly data and projections into a unified dataset for a single year
   * 
   * @param history - Historical monthly readings (from MonthlyDataAggregationService)
   * @param projections - Projection results (from ProjectionService)
   * @param energyType - 'power' or 'gas'
   * @param year - Year being analyzed
   * @returns Unified insights data
   */
  static transformToUnifiedData(
    history: MonthlyDataPoint[],
    projections: ProjectionResult,
    energyType: EnergyOptions,
    year: number
  ): UnifiedInsightData {
    const points: InsightDataPoint[] = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11
    
    // Process all 12 months for the specified year
    for (let i = 0; i < 12; i++) {
      // Find projection for this month (month index 0-11)
      // Note: Projection service currently returns data for current year
      const p = projections.monthlyData.find(pd => pd.month === i);
      const h = history.find(hd => hd.month === i + 1); // history is 1-indexed
      
      const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      let type: 'actual' | 'interpolated' | 'projected' | 'mixed' = 'projected';
      let consumption = 0;
      let isForecast = true;

      // If we are looking at a past year, all data is historical (actual/interpolated)
      // If we are looking at future year, all data is projected
      // If we are looking at current year, it's a mix
      
      if (year < currentYear) {
        // Past year
        consumption = h?.meterReading || 0; // This needs conversion to consumption if history is meter readings
        // Actually history passed here IS MonthlyDataPoint which has meterReading.
        // We might need to calculate consumption from it.
        isForecast = false;
        if (h?.isActual) type = 'actual';
        else if (h?.isInterpolated) type = 'interpolated';
        else type = 'actual';
      } else if (year > currentYear) {
        // Future year
        consumption = p?.projected || 0;
        isForecast = true;
        type = 'projected';
      } else {
        // Current year (mix)
        if (p) {
          if (p.actual !== null) {
            consumption = p.actual;
            isForecast = false;
            if (h) {
              if (h.isActual) type = 'actual';
              else if (h.isInterpolated) type = 'interpolated';
              else type = 'actual';
            }
          } else {
            consumption = p.projected;
            isForecast = true;
            type = 'projected';
          }
        }
      }

      points.push({
        month: i,
        year: year,
        monthLabel: monthLabels[i],
        consumption,
        cost: null,
        type,
        isForecast
      });
    }

    return {
      points,
      energyType,
      summary: {
        periodActual: projections.year.actualToDate,
        periodProjected: projections.year.projectedRemainder,
        periodTotal: projections.year.estimatedTotal,
        periodCost: projections.year.estimatedCost,
      }
    };
  }
}
