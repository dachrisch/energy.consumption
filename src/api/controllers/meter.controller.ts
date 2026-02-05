import Meter from '../../models/Meter';
import Reading from '../../models/Reading';
import Contract from '../../models/Contract';
import { RouteParams, sanitizeString } from '../utils';
import { meterSchema, formatZodError } from '../validation';

export async function handleMeters({ req, res, userId, url }: RouteParams) {
  if (req.method === 'GET') {
    const id = sanitizeString(url.searchParams.get('id'));
    const query = id ? { _id: { $eq: id } } : {};
    const meters = await Meter.find(query).setOptions({ userId });
    res.end(JSON.stringify(meters));
    return;
  }
  if (req.method === 'POST') {
    const result = meterSchema.safeParse(req.body);
    if (!result.success) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: formatZodError(result.error) }));
      return;
    }
    const meter = await Meter.create({ ...result.data, userId });
    res.statusCode = 201;
    res.end(JSON.stringify(meter));
    return;
  }
}

export async function handleMeterItem({ req, res, userId, path }: RouteParams) {
  const id = sanitizeString(path.split('/').pop());
  if (!id) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Invalid ID' }));
    return;
  }

  if (req.method === 'DELETE') {
    await Promise.all([
      Reading.deleteMany({ meterId: { $eq: id } }).setOptions({ userId }),
      Contract.deleteMany({ meterId: { $eq: id } }).setOptions({ userId }),
      Meter.deleteOne({ _id: { $eq: id } }).setOptions({ userId })
    ]);
    res.end(JSON.stringify({ message: 'Meter and associated data deleted' }));
    return;
  }
  if (req.method === 'PATCH' || req.method === 'PUT') {
    const result = meterSchema.partial().safeParse(req.body);
    if (!result.success) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: formatZodError(result.error) }));
      return;
    }
    const updated = await Meter.findOneAndUpdate({ _id: { $eq: id } }, { $set: result.data }, { new: true }).setOptions({ userId });
    res.end(JSON.stringify(updated));
    return;
  }
}
