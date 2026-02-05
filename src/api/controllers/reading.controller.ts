import Reading from '../../models/Reading';
import Meter from '../../models/Meter';
import { processBulkReadings } from '../../lib/readingService';
import { RouteParams, sanitizeString } from '../utils';
import { readingSchema, bulkReadingSchema, formatZodError } from '../validation';

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
