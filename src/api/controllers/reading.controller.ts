import Reading from '../../models/Reading';
import Meter from '../../models/Meter';
import Contract from '../../models/Contract';
import { processBulkReadings } from '../../lib/readingService';
import { RouteParams, sanitizeString } from '../utils';
import { readingSchema, bulkReadingSchema, formatZodError } from '../validation';

export async function exportReadingsAsJson(userId: string, meterId?: string) {
  let meterQuery = {};
  if (meterId) {
    meterQuery = { _id: meterId };
  }

  const meters = await Meter.find(meterQuery).setOptions({ userId });
  const readings = await Reading.find({}).setOptions({ userId });

  const exportData = meters.map(meter => ({
    meter: {
      id: meter._id.toString(),
      name: meter.name,
      meterNumber: meter.meterNumber,
      type: meter.type,
      unit: meter.unit
    },
    readings: readings
      .filter(r => r.meterId.toString() === meter._id.toString())
      .map(r => ({
        value: r.value,
        date: r.date.toISOString().split('T')[0], // YYYY-MM-DD
        createdAt: r.createdAt
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }));

  return exportData;
}

export async function exportFullBackup(userId: string) {
  const meters = await Meter.find({}).setOptions({ userId });
  const readings = await Reading.find({}).setOptions({ userId });
  const contracts = await Contract.find({}).setOptions({ userId });

  return {
    exportDate: new Date().toISOString(),
    version: '1.0',
    data: {
      meters: meters.map(m => ({
        id: m._id.toString(),
        name: m.name,
        meterNumber: m.meterNumber,
        type: m.type,
        unit: m.unit
      })),
      readings: readings.map(r => ({
        id: r._id.toString(),
        meterId: r.meterId.toString(),
        value: r.value,
        date: r.date.toISOString().split('T')[0]
      })),
      contracts: contracts.map(c => ({
        id: c._id.toString(),
        providerName: c.providerName,
        type: c.type,
        startDate: c.startDate.toISOString().split('T')[0],
        endDate: c.endDate ? c.endDate.toISOString().split('T')[0] : null,
        basePrice: c.basePrice,
        workingPrice: c.workingPrice,
        meterId: c.meterId.toString()
      }))
    }
  };
}

export async function handleBulkReadings({ req, res, userId }: RouteParams) {
  if (req.method === 'POST') {
    const result = bulkReadingSchema.safeParse(req.body);
    if (!result.success) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: formatZodError(result.error) }));
      return;
    }

    // Pass Mongoose models explicitly to service
    const importResult = await processBulkReadings(result.data, userId, Meter, Reading);

    res.statusCode = 200;
    res.end(JSON.stringify(importResult));
    return;
  }
}

export async function handleReadings({ req, res, userId, url }: RouteParams) {
  if (req.method === 'GET') {
    const meterId = sanitizeString(url.searchParams.get('meterId'));
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    const query = meterId ? { meterId: { $eq: meterId } } : {};
    const readings = await Reading.find(query)
      .setOptions({ userId })
      .sort({ date: -1 })
      .skip(offset)
      .limit(limit);
      
    res.end(JSON.stringify(readings));
    return;
  }
  if (req.method === 'POST') {
    const result = readingSchema.safeParse(req.body);
    if (!result.success) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: formatZodError(result.error) }));
      return;
    }
    const reading = await Reading.create({ ...result.data, userId });
    res.statusCode = 201;
    res.end(JSON.stringify(reading));
    return;
  }
}

export async function handleReadingItem({ req, res, userId, path }: RouteParams) {
  const id = sanitizeString(path.split('/').pop());
  if (!id) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Invalid ID' }));
    return;
  }

  if (req.method === 'DELETE') {
    await Reading.deleteOne({ _id: { $eq: id } }).setOptions({ userId });
    res.end(JSON.stringify({ message: 'Deleted' }));
    return;
  }
  if (req.method === 'PATCH' || req.method === 'PUT') {
    const result = readingSchema.omit({ meterId: true }).partial().safeParse(req.body);
    if (!result.success) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: formatZodError(result.error) }));
      return;
    }
    const updated = await Reading.findOneAndUpdate({ _id: { $eq: id } }, { $set: result.data }, { new: true }).setOptions({ userId });
    res.end(JSON.stringify(updated));
    return;
  }
}
