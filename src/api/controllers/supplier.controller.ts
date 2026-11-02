import mongoose from 'mongoose';
import Supplier, { normalizeSupplierName } from '../../models/Supplier';
import Contract from '../../models/Contract';
import ProviderDocument from '../../models/ProviderDocument';
import Bill from '../../models/Bill';
import { RouteParams } from '../utils';
import { supplierSchema, supplierUpdateSchema, formatZodError } from '../validation';
import { cleanSupplierName, findOrCreateSupplier, loadSupplierOverview } from '../../lib/supplierService';
import {
  handleIntakeSync, handleIntakeItems, handleIntakeBills, handleIntakeDocuments,
} from './intake.controller';

function supplierIdFromPath(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean);
  const id = segments[2];
  return id && mongoose.Types.ObjectId.isValid(id) ? id : null;
}

function actionFromPath(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean);
  return segments[3] ?? null;
}

/** Inject the path's supplier id into the query so the intake handlers scope to it. */
function scopedParams(params: RouteParams, supplierId: string): RouteParams {
  const url = new URL(params.url.toString());
  url.searchParams.set('supplierId', supplierId);
  return { ...params, url };
}

export async function handleSuppliers({ req, res, userId }: RouteParams): Promise<void> {
  if (req.method === 'GET') {
    const overview = await loadSupplierOverview(userId);
    res.statusCode = 200;
    res.end(JSON.stringify(overview));
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405; res.end(JSON.stringify({ error: 'Method not allowed' })); return;
  }

  const result = supplierSchema.safeParse(req.body);
  if (!result.success) {
    res.statusCode = 400; res.end(JSON.stringify({ error: formatZodError(result.error) })); return;
  }

  const { name, senders, subjectHints, gmailQuery } = result.data;
  const supplier = await findOrCreateSupplier(userId, name);
  const updates: Record<string, unknown> = {};
  if (senders !== undefined) { updates.senders = senders; }
  if (subjectHints !== undefined) { updates.subjectHints = subjectHints; }
  if (gmailQuery !== undefined) { updates.gmailQuery = gmailQuery ?? null; }
  if (Object.keys(updates).length > 0) {
    await Supplier.updateOne({ _id: supplier._id }, { $set: updates }).setOptions({ userId });
  }

  const saved = await Supplier.findById(supplier._id).setOptions({ userId }).lean();
  res.statusCode = 201;
  res.end(JSON.stringify({ supplier: saved }));
}

export async function handleSupplierItem(params: RouteParams): Promise<void> {
  const { req, res, userId, path } = params;
  const id = supplierIdFromPath(path);
  if (!id) {
    res.statusCode = 400; res.end(JSON.stringify({ error: 'Invalid supplier id' })); return;
  }

  const action = actionFromPath(path);
  if (action === 'sync') {
    if (req.method !== 'POST') {
      res.statusCode = 405; res.end(JSON.stringify({ error: 'Method not allowed' })); return;
    }
    return handleIntakeSync({
      ...params,
      req: { ...req, body: { ...req.body, supplierId: id } },
    });
  }
  if (action === 'items') {
    if (req.method !== 'GET') {
      res.statusCode = 405; res.end(JSON.stringify({ error: 'Method not allowed' })); return;
    }
    return handleIntakeItems(scopedParams(params, id));
  }
  if (action === 'bills') {
    if (req.method !== 'GET') {
      res.statusCode = 405; res.end(JSON.stringify({ error: 'Method not allowed' })); return;
    }
    return handleIntakeBills(scopedParams(params, id));
  }
  if (action === 'documents') {
    if (req.method !== 'GET') {
      res.statusCode = 405; res.end(JSON.stringify({ error: 'Method not allowed' })); return;
    }
    return handleIntakeDocuments(scopedParams(params, id));
  }
  if (action) {
    res.statusCode = 404; res.end(JSON.stringify({ error: 'Not found' })); return;
  }

  if (req.method === 'GET') {
    const [supplier, contracts, overview] = await Promise.all([
      Supplier.findById(id).setOptions({ userId }).lean(),
      Contract.find({ supplierId: id }).setOptions({ userId }).populate('meterId').sort({ startDate: -1 }),
      loadSupplierOverview(userId),
    ]);
    if (!supplier) {
      res.statusCode = 404; res.end(JSON.stringify({ error: 'Supplier not found' })); return;
    }
    const view = overview.suppliers.find((entry) => entry._id === id);
    res.statusCode = 200;
    res.end(JSON.stringify({ supplier: view ?? { ...supplier, contractCount: contracts.length, stagedCount: 0, meterIds: [] }, contracts }));
    return;
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    const result = supplierUpdateSchema.safeParse(req.body);
    if (!result.success) {
      res.statusCode = 400; res.end(JSON.stringify({ error: formatZodError(result.error) })); return;
    }
    const updates: Record<string, unknown> = { ...result.data };
    if (result.data.name !== undefined) {
      const cleaned = cleanSupplierName(result.data.name);
      updates.name = cleaned;
      updates.nameKey = normalizeSupplierName(cleaned);
    }
    try {
      const updated = await Supplier.findOneAndUpdate(
        { _id: id },
        { $set: updates },
        { new: true },
      ).setOptions({ userId });
      if (!updated) {
        res.statusCode = 404; res.end(JSON.stringify({ error: 'Supplier not found' })); return;
      }
      res.statusCode = 200;
      res.end(JSON.stringify({ supplier: updated }));
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        res.statusCode = 409;
        res.end(JSON.stringify({ error: 'A supplier with that name already exists' }));
        return;
      }
      throw error;
    }
    return;
  }

  if (req.method === 'DELETE') {
    const contracts = await Contract.countDocuments({ supplierId: id }).setOptions({ userId });
    if (contracts > 0) {
      res.statusCode = 409;
      res.end(JSON.stringify({ error: 'Remove this supplier\'s contracts first' }));
      return;
    }
    // Keep the ingested history; it becomes unassigned instead of dangling.
    await ProviderDocument.updateMany(
      { supplierId: id },
      { $unset: { supplierId: '' } },
    ).setOptions({ userId });
    await Bill.updateMany(
      { supplierId: id },
      { $unset: { supplierId: '' } },
    ).setOptions({ userId });
    await Supplier.deleteOne({ _id: id }).setOptions({ userId });
    res.statusCode = 200; res.end(JSON.stringify({ message: 'Deleted' }));
    return;
  }

  res.statusCode = 405; res.end(JSON.stringify({ error: 'Method not allowed' }));
}

/** Legacy read-only alias so older clients keep working for one release. */
export async function handleProvidersAlias(params: RouteParams): Promise<void> {
  const { req, res, userId } = params;
  if (req.method !== 'GET') {
    res.statusCode = 405; res.end(JSON.stringify({ error: 'Method not allowed' })); return;
  }
  const overview = await loadSupplierOverview(userId);
  res.statusCode = 200;
  res.end(JSON.stringify({ providers: overview.suppliers, count: overview.suppliers.length }));
}
