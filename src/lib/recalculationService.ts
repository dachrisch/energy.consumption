import Meter from '../models/Meter';
import Reading from '../models/Reading';
import Contract from '../models/Contract';
import User from '../models/User';
import { calculateAggregates } from './aggregates';
import { calculateMeterStats } from './pricing';

export async function recalculateUserStats(userId: string) {
  // Fetch all necessary data
  const [meters, allReadings, allContracts] = await Promise.all([
    Meter.find({ userId }),
    Reading.find({ userId }),
    Contract.find({ userId })
  ]);

  // 1. Calculate and update individual meter stats
  for (const meter of meters) {
    const meterReadings = allReadings
      .filter(r => r.meterId.toString() === meter._id.toString())
      .map(r => ({
        value: r.value,
        date: new Date(r.date)
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const meterContracts = allContracts
      .filter(c => c.meterId.toString() === meter._id.toString())
      .map(c => ({
        startDate: new Date(c.startDate),
        endDate: c.endDate ? new Date(c.endDate) : null,
        basePrice: c.basePrice,
        workingPrice: c.workingPrice
      }));

    const stats = calculateMeterStats(meterReadings, meterContracts);
    
    // Efficiently update the meter stats in DB
    await Meter.updateOne({ _id: meter._id }, { $set: { stats } });
  }

  // 2. Calculate and update global dashboard aggregates
  const aggregates = calculateAggregates(meters, allReadings, allContracts);
  
  // Update the user document with the latest aggregates
  await User.updateOne({ _id: userId }, { $set: { stats: aggregates } });

  return { success: true };
}
