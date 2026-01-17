import { IEnergyRepository } from '@/repositories/interfaces/IEnergyRepository';
import { IContractRepository } from '@/repositories/interfaces/IContractRepository';
import { ProjectionCalculationService } from '@/app/services/ProjectionCalculationService';
import { EnergyOptions, SourceEnergyReading } from '@/app/types';

export interface ProjectionResult {
  currentMonth: {
    actual: number;
    projected: number;
    estimatedTotal: number;
    estimatedCost: number;
    daysRemaining: number;
  };
  year: {
    actualToDate: number;
    projectedRemainder: number;
    estimatedTotal: number;
    estimatedCost: number;
  };
}

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
   * @returns Projection results
   */
  async getProjections(userId: string, type: EnergyOptions): Promise<ProjectionResult | null> {
    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth();
    
    // 1. Fetch historical data to calculate average consumption
    // We take all readings to have a good average
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
    const endOfMonth = new Date(nextMonth.getTime() - 1);
    
    const readingsThisMonth = allReadings.filter(r => r.date >= startOfMonth && r.date <= endOfMonth);
    
    let actualThisMonth = 0;
    let lastReadingThisMonth: SourceEnergyReading | null = null;
    
    if (readingsThisMonth.length >= 2) {
      actualThisMonth = readingsThisMonth[readingsThisMonth.length - 1].amount - readingsThisMonth[0].amount;
      lastReadingThisMonth = readingsThisMonth[readingsThisMonth.length - 1];
    } else if (readingsThisMonth.length === 1) {
      // If only one reading this month, we need the last reading from before this month to calculate actual
      const previousReadings = allReadings.filter(r => r.date < startOfMonth);
      if (previousReadings.length > 0) {
        const lastBefore = previousReadings[previousReadings.length - 1];
        actualThisMonth = readingsThisMonth[0].amount - lastBefore.amount;
        lastReadingThisMonth = readingsThisMonth[0];
      }
    }

    const daysInMonth = (nextMonth.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24);
    const daysElapsed = (now.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24);
    const daysRemaining = Math.max(0, daysInMonth - daysElapsed);
    
    const projectedRemainingMonth = dailyAverage * daysRemaining;
    const estimatedTotalMonth = actualThisMonth + projectedRemainingMonth;
    const estimatedCostMonth = ProjectionCalculationService.calculateProjectedCost(estimatedTotalMonth, daysInMonth, contract);

    // 4. Year Projection
    const startOfYear = new Date(Date.UTC(currentYear, 0, 1));
    const endOfYear = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59));
    
    const readingsThisYear = allReadings.filter(r => r.date >= startOfYear && r.date <= endOfYear);
    
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
    const estimatedTotalYear = actualToDateYear + projectedRemainderYear;
    const estimatedCostYear = ProjectionCalculationService.calculateProjectedCost(estimatedTotalYear, daysInYear, contract);

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
      }
    };
  }
}
