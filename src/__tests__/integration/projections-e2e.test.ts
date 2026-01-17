import { ProjectionService } from '@/services/projections/ProjectionService';
import { MongoEnergyRepository } from '@/repositories/mongodb/MongoEnergyRepository';
import { MongoContractRepository } from '@/repositories/mongodb/MongoContractRepository';
import { connectDB } from '@/lib/mongodb';
import SourceEnergyReading from '@/models/SourceEnergyReading';
import Contract from '@/models/Contract';

describe('Projections E2E Integration', () => {
  const testUserId = '000000000000000000000001';
  let service: ProjectionService;

  beforeAll(async () => {
    await connectDB();
    const energyRepo = new MongoEnergyRepository();
    const contractRepo = new MongoContractRepository();
    service = new ProjectionService(energyRepo, contractRepo);
  });

  beforeEach(async () => {
    await SourceEnergyReading.deleteMany({ userId: testUserId });
    await Contract.deleteMany({ userId: testUserId });
  });

  it('should reflect new readings in projections immediately', async () => {
    const today = new Date(Date.UTC(2024, 5, 15));

    // 1. Create contract
    await Contract.create({
      userId: testUserId,
      type: 'power',
      startDate: new Date(Date.UTC(2024, 0, 1)),
      basePrice: 365,
      workingPrice: 0.1
    });

    // 2. Add baseline readings (Jan 1 to May 1)
    // Jan 1: 1000
    // May 1: 2210 (121 days elapsed, 1210 consumed => 10 units/day)
    await SourceEnergyReading.create([
      { userId: testUserId, type: 'power', amount: 1000, date: new Date(Date.UTC(2024, 0, 1)), unit: 'kWh' },
      { userId: testUserId, type: 'power', amount: 2210, date: new Date(Date.UTC(2024, 4, 1)), unit: 'kWh' }
    ]);

    // Initial Projection
    let projection = await service.getProjections(testUserId, 'power', today);
    expect(projection?.currentMonth.daysRemaining).toBe(16);
    expect(projection?.currentMonth.projected).toBeCloseTo(10 * 16, 0);

    // 3. Add a new reading today (June 15) with HIGH consumption
    // June 15: 3000 (45 days since May 1, 790 units => 17.5 units/day)
    // New total range: Jan 1 to June 15 (166 days). Total: 2000 units => 12.048 units/day
    await SourceEnergyReading.create({
      userId: testUserId,
      type: 'power',
      amount: 3000,
      date: new Date(Date.UTC(2024, 5, 15)),
      unit: 'kWh'
    });

    // Updated Projection
    projection = await service.getProjections(testUserId, 'power', today);
    expect(projection?.currentMonth.actual).toBe(790); 
    
    // New avg is higher (approx 12.048), so projected remaining should be higher
    expect(projection?.currentMonth.projected).toBeCloseTo(12.048 * 16, 0);
  });
});