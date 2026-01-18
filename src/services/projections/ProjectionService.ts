import { IEnergyRepository } from '@/repositories/interfaces/IEnergyRepository';
import { IContractRepository } from '@/repositories/interfaces/IContractRepository';
import { ProjectionCalculationService } from '@/app/services/ProjectionCalculationService';
import { EnergyOptions, SourceEnergyReading, ProjectionResult } from '@/app/types';

export class ProjectionService {
  constructor(
    private energyRepository: IEnergyRepository,
    private contractRepository: IContractRepository
  ) {}

  /**
   * Get projections for a user and energy type
   * 
   * @param userId - User ID
   * @param type - Energy type
   * @param referenceDate - Optional reference date (defaults to now)
   * @returns Projection results
   */
  async getProjections(
    userId: string, 
    type: EnergyOptions, 
    referenceDate: Date = new Date()
  ): Promise<ProjectionResult | null> {
    try {
      const now = referenceDate;
      const currentYear = now.getUTCFullYear();
      const currentMonth = now.getUTCMonth();
      
      // 1. Fetch historical data to calculate average consumption
      const allReadings = await this.energyRepository.findAll(userId, { type, sortBy: 'date', sortOrder: 'asc' });
      
      if (allReadings.length < 2) {
        return null;
      }

      const dailyAverage = ProjectionCalculationService.calculateDailyAverage(allReadings);
      
      // 2. Fetch active contract
      const contract = await this.contractRepository.findActive(userId, type, now);
      if (!contract) {
        return null;
      }

      // 3. Current Month Projection
      const startOfMonth = new Date(Date.UTC(currentYear, currentMonth, 1));
      const nextMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 1));
      
      const readingsThisMonth = allReadings.filter(r => r.date >= startOfMonth && r.date < nextMonth);
      
      let actualThisMonth = 0;
      
      if (readingsThisMonth.length >= 2) {
        actualThisMonth = readingsThisMonth[readingsThisMonth.length - 1].amount - readingsThisMonth[0].amount;
      } else if (readingsThisMonth.length === 1) {
        // If only one reading this month, we need the last reading from before this month to calculate actual
        const previousReadings = allReadings.filter(r => r.date < startOfMonth);
        if (previousReadings.length > 0) {
          const lastBefore = previousReadings[previousReadings.length - 1];
          actualThisMonth = readingsThisMonth[0].amount - lastBefore.amount;
        }
      }

      const daysInMonth = (nextMonth.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24);
      const daysElapsed = (now.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24);
      const daysRemaining = Math.max(0, daysInMonth - daysElapsed);
      
      const projectedRemainingMonth = dailyAverage * daysRemaining;
      const projectedElapsedMonth = readingsThisMonth.length > 0 ? actualThisMonth : (dailyAverage * daysElapsed);
      
      const estimatedTotalMonth = projectedElapsedMonth + projectedRemainingMonth;
      const estimatedCostMonth = ProjectionCalculationService.calculateProjectedCost(estimatedTotalMonth, daysInMonth, contract);

      // 4. Year Projection
      const startOfYear = new Date(Date.UTC(currentYear, 0, 1));
      
      const readingsThisYear = allReadings.filter(r => r.date >= startOfYear);
      
      let actualToDateYear = 0;
      if (readingsThisYear.length >= 2) {
        actualToDateYear = readingsThisYear[readingsThisYear.length - 1].amount - readingsThisYear[0].amount;
      } else if (readingsThisYear.length === 1) {
        const previousReadings = allReadings.filter(r => r.date < startOfYear);
        if (previousReadings.length > 0) {
          actualToDateYear = readingsThisYear[0].amount - previousReadings[previousReadings.length - 1].amount;
        }
      }

      const daysInYear = (Date.UTC(currentYear, 11, 31) - Date.UTC(currentYear, 0, 1)) / (1000 * 60 * 60 * 24) + 1;
      const daysElapsedYear = (now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24);
      const daysRemainingYear = Math.max(0, daysInYear - daysElapsedYear);
      
      const projectedRemainderYear = dailyAverage * daysRemainingYear;
      const projectedElapsedYear = readingsThisYear.length > 0 ? actualToDateYear : (dailyAverage * daysElapsedYear);
      
      const estimatedTotalYear = projectedElapsedYear + projectedRemainderYear;
      const estimatedCostYear = ProjectionCalculationService.calculateProjectedCost(estimatedTotalYear, daysInYear, contract);

      // 5. Monthly data for chart
      let actualReadingsForYear = [...readingsThisYear];
      if (readingsThisYear.length > 0) {
        const prev = allReadings.filter(r => r.date < startOfYear).pop();
        if (prev) {
          actualReadingsForYear.unshift(prev);
        }
      }
      const actualMonthlyData = ProjectionCalculationService.calculateMonthlyAverages(actualReadingsForYear);
      const projectionMonthlyAverages = ProjectionCalculationService.calculateMonthlyAverages(allReadings);
      
      const monthlyData = [];
      for (let m = 0; m < 12; m++) {
        const monthStart = new Date(Date.UTC(currentYear, m, 1));
        const monthEnd = new Date(Date.UTC(currentYear, m + 1, 1, 0, 0, 0, -1));
        const daysInM = (monthEnd.getTime() - monthStart.getTime() + 1) / (1000 * 60 * 60 * 24);
        
        let actual = actualMonthlyData[m] * daysInM;
        
        const hasReadingsInOrAfterMonth = readingsThisYear.some(r => r.date >= monthStart);
        if (!hasReadingsInOrAfterMonth && m >= currentMonth) {
          actual = null;
        }
        if (m > currentMonth) {
          actual = null;
        }

        monthlyData.push({
          month: m,
          actual,
          projected: projectionMonthlyAverages[m] * daysInM
        });
      }

      return {
        currentMonth: {
          actual: actualThisMonth,
          projected: projectedRemainingMonth,
          estimatedTotal: estimatedTotalMonth,
          estimatedCost: estimatedCostMonth,
          daysRemaining
        },
        year: {
          actualToDate: actualToDateYear,
          projectedRemainder: projectedRemainderYear,
          estimatedTotal: estimatedTotalYear,
          estimatedCost: estimatedCostYear
        },
        monthlyData
      };
    } catch (error) {
      console.error(`[ProjectionService] Error in getProjections:`, error);
      return null;
    }
  }
}
