#!/usr/bin/env node
/**
 * Migration A: turn every distinct `providerName` into a real Supplier and
 * point contracts, bills and documents at it.
 *
 * Idempotent: suppliers are matched by a tolerant key, and records that already
 * carry a supplierId are left alone. Mail settings are copied with the union
 * semantics the old derived provider view used, and are also backfilled onto
 * suppliers that already exist but have none.
 *
 * Usage:
 *   MONGODB_URI=mongodb://... node scripts/migrate-suppliers.cjs --dry-run
 *   MONGODB_URI=mongodb://... node scripts/migrate-suppliers.cjs
 *
 * Options:
 *   --dry-run            Report what would change without writing anything.
 *   --map "From=To"      Treat provider names matching "From" as supplier "To"
 *                        (repeatable; matching ignores case, punctuation and
 *                        surrounding whitespace).
 *   --help               Show this help.
 */
const mongoose = require('mongoose');

const USAGE = `Usage: MONGODB_URI=mongodb://... node scripts/migrate-suppliers.cjs [options]

Options:
  --dry-run         Report what would change without writing anything.
  --map "From=To"   Attribute provider names matching "From" to supplier "To".
                    Repeatable. Matching ignores case, punctuation and spacing.
  --help            Show this help.`;

const uri = process.env.MONGODB_URI;

function cleanName(name) {
  return String(name ?? '').trim().replace(/\s+/g, ' ');
}

/** Keep this exactly in sync with Supplier.nameKey in the app. */
function appNameKey(name) {
  return cleanName(name).toLowerCase();
}

/**
 * Looser key used only to line records up during the migration: ignores case,
 * accents, punctuation and whitespace, so "Octo-Energie" and " octo energie "
 * are the same supplier.
 */
function matchKey(name) {
  return cleanName(name)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function union(values) {
  const seen = new Map();
  for (const value of values ?? []) {
    const cleaned = cleanName(value);
    if (!cleaned) {
      continue;
    }
    const key = cleaned.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, cleaned);
    }
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

function hasNewValue(existing, incoming) {
  const known = new Set((existing ?? []).map((value) => cleanName(value).toLowerCase()));
  return (incoming ?? []).some((value) => !known.has(cleanName(value).toLowerCase()));
}

function parseArgs(argv) {
  const options = { dryRun: false, maps: new Map(), help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }
    if (arg === '--map' || arg.startsWith('--map=')) {
      const raw = arg === '--map' ? argv[index + 1] : arg.slice('--map='.length);
      if (arg === '--map') {
        index += 1;
      }
      const [from, to] = String(raw ?? '').split('=');
      if (!from?.trim() || !to?.trim()) {
        throw new Error('--map expects "Document Name=Supplier Name"');
      }
      options.maps.set(matchKey(from), cleanName(to));
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function unassignedFilter() {
  return { $or: [{ supplierId: { $exists: false } }, { supplierId: null }] };
}

function bucketNames(records) {
  const buckets = new Map();
  for (const record of records) {
    const name = record.providerName ? cleanName(record.providerName) : '';
    buckets.set(name, (buckets.get(name) ?? 0) + 1);
  }
  return [...buckets.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

/** Supplier for one provider name, or null when nothing matches. */
function supplierFor(suppliersByUser, options, userId, providerName) {
  if (!providerName) {
    return null;
  }
  const target = options.maps.get(matchKey(providerName)) ?? cleanName(providerName);
  return suppliersByUser.get(String(userId))?.get(matchKey(target)) ?? null;
}

async function run(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    console.log(USAGE);
    return;
  }
  if (!uri) {
    console.error('MONGODB_URI is required');
    process.exitCode = 1;
    return;
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const suppliersCollection = db.collection('suppliers');
  const contractsCollection = db.collection('contracts');
  const documentsCollection = db.collection('providerdocuments');
  const billsCollection = db.collection('bills');

  const [contracts, suppliers, openDocuments, openBills] = await Promise.all([
    contractsCollection.find({ providerName: { $exists: true, $ne: '' } }).toArray(),
    suppliersCollection.find({}).toArray(),
    documentsCollection.find(unassignedFilter()).toArray(),
    billsCollection.find(unassignedFilter()).toArray(),
  ]);

  /** userId -> (matchKey -> supplier). Populated with existing and planned rows. */
  const suppliersByUser = new Map();
  const indexSupplier = (supplier) => {
    const key = String(supplier.userId);
    const map = suppliersByUser.get(key) ?? new Map();
    const entry = matchKey(supplier.name);
    if (!entry) {
      return;
    }
    if (!map.has(entry)) {
      map.set(entry, supplier);
    }
    suppliersByUser.set(key, map);
  };
  suppliers.forEach(indexSupplier);

  // Group contracts by the supplier they should belong to, merging aliases.
  const groups = new Map();
  for (const contract of contracts) {
    const target = options.maps.get(matchKey(contract.providerName)) ?? cleanName(contract.providerName);
    if (!matchKey(target)) {
      continue;
    }
    const key = `${contract.userId}:${matchKey(target)}`;
    const group = groups.get(key) ?? {
      userId: contract.userId,
      name: target,
      sources: new Set(),
      senders: [],
      subjectHints: [],
      gmailQuery: null,
      supplier: null,
      contractsToLink: 0,
      documentsToLink: 0,
    };
    group.sources.add(contract.providerName);
    group.senders.push(...(contract.senders ?? []));
    group.subjectHints.push(...(contract.subjectHints ?? []));
    if (contract.gmailQuery) {
      group.gmailQuery = contract.gmailQuery;
    }
    groups.set(key, group);
  }

  // Plan suppliers first; applies the creates immediately so documents can be
  // pointed at the new ids (dry-run keeps a placeholder instead).
  const plans = [...groups.values()];
  const toCreate = [];
  const toUpdate = [];
  for (const group of plans) {
    const existing = suppliersByUser.get(String(group.userId))?.get(matchKey(group.name));
    if (!existing) {
      toCreate.push(group);
      group.supplier = {
        _id: null,
        userId: group.userId,
        name: group.name,
        nameKey: appNameKey(group.name),
        senders: union(group.senders),
        subjectHints: union(group.subjectHints),
        gmailQuery: group.gmailQuery,
      };
      indexSupplier(group.supplier);
      if (!options.dryRun) {
        const now = new Date();
        const result = await suppliersCollection.insertOne({
          name: group.supplier.name,
          nameKey: group.supplier.nameKey,
          senders: group.supplier.senders,
          subjectHints: group.supplier.subjectHints,
          gmailQuery: group.supplier.gmailQuery,
          userId: group.userId,
          createdAt: now,
          updatedAt: now,
        });
        group.supplier._id = result.insertedId;
      }
      continue;
    }

    group.supplier = existing;
    const updates = {};
    const notes = [];
    if (hasNewValue(existing.senders, group.senders)) {
      updates.senders = union([...(existing.senders ?? []), ...group.senders]);
      notes.push('senders');
    }
    if (hasNewValue(existing.subjectHints, group.subjectHints)) {
      updates.subjectHints = union([...(existing.subjectHints ?? []), ...group.subjectHints]);
      notes.push('subject hints');
    }
    if (!existing.gmailQuery && group.gmailQuery) {
      updates.gmailQuery = group.gmailQuery;
      notes.push('gmail query');
    }
    if (Object.keys(updates).length > 0) {
      group.settingsNotes = notes;
      toUpdate.push(group);
      if (!options.dryRun) {
        await suppliersCollection.updateOne(
          { _id: existing._id },
          { $set: { ...updates, updatedAt: new Date() } },
        );
        Object.assign(existing, updates);
      }
    }
  }

  // Documents and bills keep their display name; they only gain the supplier.
  const documentPlan = openDocuments
    .map((document) => ({
      document,
      supplier: supplierFor(suppliersByUser, options, document.userId, document.providerName),
    }))
    .filter((entry) => entry.supplier);

  const billPlan = openBills
    .map((bill) => ({
      bill,
      supplier: supplierFor(suppliersByUser, options, bill.userId, bill.providerName),
    }))
    .filter((entry) => entry.supplier);

  // Count the documents each planned supplier will collect, for the report.
  for (const group of plans) {
    group.documentsToLink = documentPlan.filter(
      (entry) => String(entry.supplier.userId) === String(group.userId)
        && matchKey(entry.supplier.name) === matchKey(group.name),
    ).length;
  }

  const linkedContracts = async (group) => {
    const filter = {
      userId: group.userId,
      providerName: { $in: [...group.sources] },
      ...unassignedFilter(),
    };
    return group.supplier._id === null || options.dryRun
      ? contractsCollection.countDocuments(filter)
      : (await contractsCollection.updateMany(filter, { $set: { supplierId: group.supplier._id } })).modifiedCount;
  };

  let contractsLinked = 0;
  for (const group of plans) {
    group.contractsToLink = await linkedContracts(group);
    contractsLinked += group.contractsToLink;
  }

  /**
   * Point every open document/bill whose provider name resolves to a supplier
   * at it. Grouped by raw name so one update per name covers many rows.
   */
  async function linkOpen(collection, entries, field) {
    const groupsByRecord = new Map();
    for (const { [field]: record, supplier } of entries) {
      const key = `${record.userId}:${record.providerName}`;
      const group = groupsByRecord.get(key) ?? {
        userId: record.userId,
        providerName: record.providerName,
        supplier,
      };
      groupsByRecord.set(key, group);
    }
    let linked = 0;
    for (const group of groupsByRecord.values()) {
      const filter = {
        userId: group.userId,
        providerName: group.providerName,
        ...unassignedFilter(),
      };
      linked += options.dryRun
        ? await collection.countDocuments(filter)
        : (await collection.updateMany(filter, { $set: { supplierId: group.supplier._id } })).modifiedCount;
    }
    return linked;
  }

  const documentsLinked = await linkOpen(documentsCollection, documentPlan, 'document');
  const billsLinked = await linkOpen(billsCollection, billPlan, 'bill');

  let stillUnassigned;
  if (options.dryRun) {
    const linkable = new Set(documentPlan.map((entry) => String(entry.document._id)));
    stillUnassigned = openDocuments.filter((document) => !linkable.has(String(document._id)));
  } else {
    stillUnassigned = await documentsCollection.find(unassignedFilter()).toArray();
  }

  const header = options.dryRun ? 'Dry run — no writes.' : null;
  if (header) {
    console.log(header);
    console.log('');
  }

  if (toCreate.length > 0) {
    if (options.dryRun) {
      console.log(`Suppliers to create (${toCreate.length}):`);
      for (const group of toCreate) {
        console.log(
          `  + ${group.name}  (contracts: ${group.contractsToLink}, documents: ${group.documentsToLink})`,
        );
      }
    } else {
      const names = toCreate.map((group) => group.name).join(', ');
      console.log(`Suppliers created: ${toCreate.length} (${names})`);
    }
  } else {
    console.log(options.dryRun ? 'Suppliers to create: 0' : 'Suppliers created: 0');
  }

  if (options.dryRun && toUpdate.length > 0) {
    console.log(`Suppliers to update (${toUpdate.length}):`);
    for (const group of toUpdate) {
      console.log(`  ~ ${group.supplier.name}  (+${(group.settingsNotes ?? []).join(', +')})`);
    }
  }

  if (options.dryRun) {
    console.log(`Contracts to link: ${contractsLinked}`);
    console.log(`Bills to link: ${billsLinked}`);
    console.log(`Documents to link: ${documentsLinked}`);
  } else {
    console.log(`Suppliers updated: ${toUpdate.length}`);
    console.log(`Contracts linked: ${contractsLinked}`);
    console.log(`Bills linked: ${billsLinked}`);
    console.log(`Documents linked: ${documentsLinked}`);
  }

  console.log(`Documents still unassigned: ${stillUnassigned.length}`);
  for (const [name, count] of bucketNames(stillUnassigned)) {
    if (!name) {
      console.log(`  (no providerName) × ${count} — assign manually`);
      continue;
    }
    const mapped = options.maps.get(matchKey(name));
    if (mapped) {
      console.log(`  "${name}" × ${count} — maps to "${mapped}", but no such supplier exists yet`);
    } else {
      console.log(`  "${name}" × ${count} — no supplier matches; add --map "${name}=<supplier>"`);
    }
  }

  await mongoose.disconnect();
}

if (require.main === module) {
  run().catch(async (error) => {
    console.error(error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
}

module.exports = {
  cleanName,
  appNameKey,
  matchKey,
  parseArgs,
  union,
  run,
};
