import Supplier, { normalizeSupplierName } from '../models/Supplier';
import Contract from '../models/Contract';
import ProviderDocument from '../models/ProviderDocument';

export interface SupplierIdentityInput {
  supplierId?: string | null;
  supplierName?: string | null;
  /** Legacy field from imports and older clients. */
  providerName?: string | null;
}

/** Trim and collapse whitespace so "E.ON " and "E.ON" are the same supplier. */
export function cleanSupplierName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

/**
 * Find the user's supplier by normalized name, creating it when missing.
 * The unique index makes the race safe: a concurrent create loses and we read
 * the winner back.
 */
export async function findOrCreateSupplier(userId: string, name: string) {
  const cleaned = cleanSupplierName(name);
  if (!cleaned) {
    throw new Error('Supplier name is required');
  }
  const nameKey = normalizeSupplierName(cleaned);
  const existing = await Supplier.findOne({ nameKey }).setOptions({ userId });
  if (existing) {
    return existing;
  }
  try {
    return await Supplier.create({ name: cleaned, nameKey, userId });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      const raced = await Supplier.findOne({ nameKey }).setOptions({ userId });
      if (raced) {
        return raced;
      }
    }
    throw error;
  }
}

/** Resolve the supplier referenced by a contract payload. */
export async function resolveSupplierIdentity(
  userId: string,
  input: SupplierIdentityInput,
) {
  if (input.supplierId) {
    const supplier = await Supplier.findOne({ _id: input.supplierId }).setOptions({ userId });
    if (!supplier) {
      throw new Error('Supplier not found');
    }
    return supplier;
  }
  const name = input.supplierName ?? input.providerName;
  if (!name) {
    throw new Error('supplierId or supplierName is required');
  }
  return findOrCreateSupplier(userId, name);
}

export interface SupplierView {
  _id: string;
  name: string;
  senders: string[];
  subjectHints: string[];
  gmailQuery: string | null;
  contractCount: number;
  stagedCount: number;
  meterIds: string[];
}

export interface SupplierOverview {
  suppliers: SupplierView[];
  unassigned: { documents: number; staged: number };
}

const OPEN_FACT_STATUSES = new Set(['pending', 'conflict']);

/** Suppliers with the counts the contracts page needs, plus unassigned mail. */
export async function loadSupplierOverview(userId: string): Promise<SupplierOverview> {
  const [suppliers, contracts, documents] = await Promise.all([
    Supplier.find({}).setOptions({ userId }).sort({ name: 1 }).lean(),
    Contract.find({}).setOptions({ userId }).lean(),
    ProviderDocument.find({}).setOptions({ userId }).lean(),
  ]);

  const contractCounts = new Map<string, number>();
  const meterIds = new Map<string, Set<string>>();
  for (const contract of contracts) {
    if (!contract.supplierId) {
      continue;
    }
    const id = String(contract.supplierId);
    contractCounts.set(id, (contractCounts.get(id) ?? 0) + 1);
    const meters = meterIds.get(id) ?? new Set<string>();
    meters.add(String(contract.meterId));
    meterIds.set(id, meters);
  }

  const stagedCounts = new Map<string, number>();
  let unassignedDocuments = 0;
  let unassignedStaged = 0;
  for (const document of documents) {
    const facts = (document.facts ?? []) as Array<{ status?: string }>;
    const open = facts.filter((fact) => OPEN_FACT_STATUSES.has(fact.status ?? '')).length;
    if (!document.supplierId) {
      unassignedDocuments += 1;
      unassignedStaged += open;
      continue;
    }
    if (open > 0) {
      const id = String(document.supplierId);
      stagedCounts.set(id, (stagedCounts.get(id) ?? 0) + open);
    }
  }

  return {
    suppliers: suppliers.map((supplier) => ({
      _id: String(supplier._id),
      name: supplier.name,
      senders: supplier.senders ?? [],
      subjectHints: supplier.subjectHints ?? [],
      gmailQuery: supplier.gmailQuery ?? null,
      contractCount: contractCounts.get(String(supplier._id)) ?? 0,
      stagedCount: stagedCounts.get(String(supplier._id)) ?? 0,
      meterIds: [...(meterIds.get(String(supplier._id)) ?? [])],
    })),
    unassigned: { documents: unassignedDocuments, staged: unassignedStaged },
  };
}
