import Contract from '../../models/Contract';
import { RouteParams, sanitizeString } from '../utils';
import { contractSchema, contractUpdateSchema, formatZodError } from '../validation';

interface OverlapParams {
  meterId: string;
  userId: string;
  start: Date;
  end: Date | null;
  excludeId?: string;
}

async function checkContractOverlap(params: OverlapParams): Promise<string | null> {
  const { meterId, userId, start, end, excludeId } = params;
  
  // A and B overlap if (StartA <= EndB) and (EndA >= StartB)
  // Our new contract is [start, end]
  // Existing contract is [startDate, endDate]
  
  const overlapQuery: Record<string, unknown> = {
    meterId,
    startDate: { $lte: end || new Date('9999-12-31') },
    $or: [
      { endDate: { $gte: start } },
      { endDate: null }
    ]
  };

  if (excludeId) {
    overlapQuery._id = { $ne: excludeId };
  }

  const overlapping = await Contract.findOne(overlapQuery).setOptions({ userId });
  if (overlapping) {
    const periodStr = `${new Date(overlapping.startDate).toLocaleDateString()} — ${overlapping.endDate ? new Date(overlapping.endDate).toLocaleDateString() : 'Present'}`;
    return `Overlaps with existing contract (${overlapping.providerName}) for period: ${periodStr}. Please adjust the dates to avoid overlap.`;
  }
  return null;
}

export async function handleContracts({ req, res, userId, url }: RouteParams) {
  if (req.method === 'GET') {
    const meterId = sanitizeString(url.searchParams.get('meterId'));
    const id = sanitizeString(url.searchParams.get('id'));
    const query = id ? { _id: { $eq: id } } : (meterId ? { meterId: { $eq: meterId } } : {});
    const contracts = await Contract.find(query).populate('meterId').setOptions({ userId }).sort({ startDate: -1 });
    res.end(JSON.stringify(contracts));
    return;
  }
  if (req.method === 'POST') {
    const result = contractSchema.safeParse(req.body);
    if (!result.success) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: formatZodError(result.error) }));
      return;
    }

    const { meterId, startDate, endDate } = result.data;
    
    // Validate overlaps
    const overlapError = await checkContractOverlap({
      meterId, 
      userId, 
      start: startDate, 
      end: endDate ?? null
    });
    if (overlapError) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: overlapError }));
      return;
    }

    const contract = await Contract.create({ ...result.data, userId });
    res.statusCode = 201;
    res.end(JSON.stringify(contract));
    return;
  }
}

export async function handleContractItem({ req, res, userId, path }: RouteParams) {
  const id = sanitizeString(path.split('/').pop());
  if (!id) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Invalid ID' }));
    return;
  }

  if (req.method === 'DELETE') {
    await Contract.deleteOne({ _id: { $eq: id } }).setOptions({ userId });
    res.end(JSON.stringify({ message: 'Deleted' }));
    return;
  }
  
  if (req.method !== 'PATCH' && req.method !== 'PUT') {
    return;
  }

  const result = contractUpdateSchema.safeParse(req.body);
  if (!result.success) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: formatZodError(result.error) }));
    return;
  }

  const { startDate, endDate } = result.data;
  
  if (startDate) {
    const current = await Contract.findById(id).setOptions({ userId });
    
    if (current) {
      const overlapError = await checkContractOverlap({
        meterId: current.meterId as string, 
        userId, 
        start: startDate, 
        end: endDate ?? null, 
        excludeId: id
      });
      if (overlapError) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: overlapError }));
        return;
      }
    }
  }

  const updated = await Contract.findOneAndUpdate({ _id: { $eq: id } }, { $set: result.data }, { new: true }).setOptions({ userId });
  res.end(JSON.stringify(updated));
}
