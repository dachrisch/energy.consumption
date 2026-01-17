import { ProjectionService } from '../projections/ProjectionService';
import { IEnergyRepository } from '@/repositories/interfaces/IEnergyRepository';
import { IContractRepository } from '@/repositories/interfaces/IContractRepository';
import { EnergyOptions, SourceEnergyReading, ContractType } from '@/app/types';

describe('ProjectionService', () => {
  let energyRepository: jest.Mocked<IEnergyRepository>;
  let contractRepository: jest.Mocked<IContractRepository>;
  let service: ProjectionService;

  const userId = 'user-1';

  beforeEach(() => {
    energyRepository = {
      findAll: jest.fn(),
    } as any;

    contractRepository = {
      findActive: jest.fn(),
    } as any;

    service = new ProjectionService(energyRepository, contractRepository);
    
    // Mock Date to 2024-06-15 for stable tests
    jest.useFakeTimers();
    jest.setSystemTime(new Date(Date.UTC(2024, 5, 15))); // June 15, 2024
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return null if there are fewer than 2 readings', async () => {
    energyRepository.findAll.mockResolvedValue([
      { amount: 1000, date: new Date(Date.UTC(2024, 0, 1)) } as SourceEnergyReading
    ]);

    const result = await service.getProjections(userId, 'power');
    expect(result).toBeNull();
  });

  it('should return null if no active contract is found', async () => {
    energyRepository.findAll.mockResolvedValue([
      { amount: 1000, date: new Date(Date.UTC(2024, 0, 1)) } as SourceEnergyReading,
      { amount: 2000, date: new Date(Date.UTC(2024, 4, 31)) } as SourceEnergyReading,
    ]);
    contractRepository.findActive.mockResolvedValue(null);

    const result = await service.getProjections(userId, 'power');
    expect(result).toBeNull();
  });

  it('should calculate projections correctly', async () => {
    // 2024 is a leap year (Feb has 29 days)
    // Jan:31, Feb:29, Mar:31, Apr:30, May:31 = 152 days
    
    const readings: Partial<SourceEnergyReading>[] = [
      { amount: 1000, date: new Date(Date.UTC(2024, 0, 1)) }, // Jan 1
      { amount: 2520, date: new Date(Date.UTC(2024, 4, 31)) }, // May 31
      // Consumption: 1520, Days: 152 => Avg: 10/day
    ];
    
    energyRepository.findAll.mockResolvedValue(readings as SourceEnergyReading[]);
    
    contractRepository.findActive.mockResolvedValue({
      basePrice: 365.25, // approx 1/day
      workingPrice: 0.1,
    } as ContractType);

    const result = await service.getProjections(userId, 'power');
    
    expect(result).not.toBeNull();
    if (result) {
      // Current Month (June):
      // Today is June 15 (UTC).
      // startOfMonth: June 1. nextMonth: July 1.
      // daysInMonth: 30.
      // daysElapsed: (June 15 - June 1) = 14 days.
      // daysRemaining: 30 - 14 = 16 days.
      
      // actualThisMonth (since last reading on May 31):
      // Jan 1 to May 31 is before June. 
      // There are no readings in June yet in this refined test case.
      // actualThisMonth should be 0 (if we only look at June readings).
      // BUT my logic says: readingsThisMonth.length === 0 ? 0.
      // Wait, if 0 readings this month, we still want to project from the last known reading.
      
      // Let's check my implementation of actualThisMonth
      expect(result.currentMonth.daysRemaining).toBe(16);
      
      const expectedProjected = 161.1; // 1520 / 151 * 16
      expect(result.currentMonth.projected).toBeCloseTo(expectedProjected, 1);
      
      // Monthly Data
      expect(result.monthlyData).toHaveLength(12);
      // Jan (index 0) should have actual around 310 based on our mock data (Jan 1: 1000, May 31: 2520, Avg 10)
      // Actually, my mock data is: Jan 1 (1000), May 31 (2520).
      // Feb 1 to Mar 1 is 29 days * 10.066 = 291.9...
      expect(result.monthlyData[1].actual).toBeCloseTo(291.9, 0);
    }
  });
});
