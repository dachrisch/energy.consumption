import Meter from '../../models/Meter';
import Reading from '../../models/Reading';
import Contract from '../../models/Contract';
import User from '../../models/User';
import { calculateAggregates } from '../../lib/aggregates';
import { RouteParams } from '../utils';

export async function handleAggregatedRoutes({ res, userId, path }: RouteParams) {
  // Optimization: For dashboard/aggregates, we don't need thousands of historical readings.
  // The last 100-200 are plenty for accurate current projections.
  const [user, meters, contracts, readings] = await Promise.all([
    User.findById(userId),
    Meter.find({}).setOptions({ userId }),
    Contract.find({}).setOptions({ userId }).populate('meterId'),
    Reading.find({}).setOptions({ userId }).sort({ date: -1 }).limit(2000)
  ]);
  
  // Use stored aggregates or fallback to calculation if not yet stored
  let aggregates = user?.stats;
  if (!aggregates || (Array.isArray(aggregates.yearlyHistory) && aggregates.yearlyHistory.length === 0 && readings.length > 0)) {
    aggregates = calculateAggregates(meters, readings, contracts);
  }

  // Dashboard needs both raw data and aggregates for UI
  const data = path === '/api/dashboard'
    ? { meters, contracts, readings, aggregates }
    : aggregates;

  res.end(JSON.stringify(data));
}
