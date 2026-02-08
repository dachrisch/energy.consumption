import Meter from '../../models/Meter';
import Reading from '../../models/Reading';
import Contract from '../../models/Contract';
import { calculateAggregates } from '../../lib/aggregates';
import { RouteParams } from '../utils';

export async function handleAggregatedRoutes({ res, userId, path }: RouteParams) {
  // Optimization: For dashboard/aggregates, we don't need thousands of historical readings.
  // The last 100-200 are plenty for accurate current projections.
  const [meters, contracts, readings] = await Promise.all([
    Meter.find({}).setOptions({ userId }),
    Contract.find({}).setOptions({ userId }).populate('meterId'),
    Reading.find({}).setOptions({ userId }).sort({ date: -1 }).limit(2000)
  ]);
  
  const data = path === '/api/dashboard' 
    ? { meters, contracts, readings } 
    : calculateAggregates(meters, readings, contracts);
    
  res.end(JSON.stringify(data));
}
