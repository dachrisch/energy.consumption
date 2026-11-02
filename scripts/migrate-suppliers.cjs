#!/usr/bin/env node
/**
 * Migration A: turn every distinct `providerName` into a real Supplier and
 * point contracts, bills and documents at it.
 *
 * Idempotent: suppliers are upserted by (userId, nameKey); records that already
 * carry a supplierId are left alone. Mail settings are copied with the union
 * semantics the old derived provider view used (newest non-empty gmailQuery).
 *
 * Usage: MONGODB_URI=mongodb://... node scripts/migrate-suppliers.cjs
 */
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is required');
  process.exit(1);
}

function cleanName(name) {
  return String(name ?? '').trim().replace(/\s+/g, ' ');
}

function nameKey(name) {
  return cleanName(name).toLowerCase();
}

function union(values) {
  return [...new Set((values ?? []).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

async function main() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const contracts = db.collection('contracts');
  const suppliers = db.collection('suppliers');
  const bills = db.collection('bills');
  const documents = db.collection('providerdocuments');

  const pending = await contracts
    .find({ providerName: { $exists: true, $ne: '' } })
    .toArray();

  const groups = new Map();
  for (const contract of pending) {
    const key = `${contract.userId}:${nameKey(contract.providerName)}`;
    const group = groups.get(key) ?? {
      userId: contract.userId,
      name: cleanName(contract.providerName),
      senders: [],
      subjectHints: [],
      gmailQuery: null,
    };
    group.senders.push(...(contract.senders ?? []));
    group.subjectHints.push(...(contract.subjectHints ?? []));
    if (contract.gmailQuery) {
      group.gmailQuery = contract.gmailQuery;
    }
    groups.set(key, group);
  }

  let created = 0;
  let linkedContracts = 0;
  for (const group of groups.values()) {
    const key = nameKey(group.name);
    let supplier = await suppliers.findOne({ userId: group.userId, nameKey: key });
    if (!supplier) {
      const result = await suppliers.insertOne({
        name: group.name,
        nameKey: key,
        senders: union(group.senders),
        subjectHints: union(group.subjectHints),
        gmailQuery: group.gmailQuery,
        userId: group.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      supplier = { _id: result.insertedId };
      created += 1;
    }

    const updated = await contracts.updateMany(
      {
        userId: group.userId,
        providerName: group.name,
        $or: [{ supplierId: { $exists: false } }, { supplierId: null }],
      },
      { $set: { supplierId: supplier._id } },
    );
    linkedContracts += updated.modifiedCount;

    // Bills and documents carry a display snapshot of the supplier name.
    await bills.updateMany(
      { userId: group.userId, providerName: group.name, supplierId: null },
      { $set: { supplierId: supplier._id } },
    );
    await documents.updateMany(
      { userId: group.userId, providerName: group.name, supplierId: null },
      { $set: { supplierId: supplier._id } },
    );
  }

  const remainingContracts = await contracts.countDocuments({
    $or: [{ supplierId: { $exists: false } }, { supplierId: null }],
  });
  const remainingDocuments = await documents.countDocuments({
    $or: [{ supplierId: { $exists: false } }, { supplierId: null }],
  });

  console.log(`Suppliers created: ${created}`);
  console.log(`Contracts linked: ${linkedContracts}`);
  console.log(`Contracts without supplier: ${remainingContracts}`);
  console.log(`Documents without supplier (unassigned): ${remainingDocuments}`);

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
