#!/usr/bin/env node
/**
 * Migration B: fold staged `intakeitems` into `providerdocuments.facts[]`.
 *
 * Idempotent: a fact is skipped when the document already carries its _id.
 * The old collection is renamed (not dropped) so it can be removed by hand
 * once the counts are verified.
 *
 * Usage: MONGODB_URI=mongodb://... node scripts/migrate-document-facts.cjs
 */
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is required');
  process.exit(1);
}

const FACT_FIELDS = [
  'kind', 'meterNumber', 'meterId', 'date', 'value', 'unit',
  'periodStart', 'periodEnd', 'consumption', 'amountGross', 'amountNet',
  'currency', 'matchedReadingId', 'confidence', 'status', 'note',
];

async function main() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const items = db.collection('intakeitems');
  const documents = db.collection('providerdocuments');

  const total = await items.countDocuments({});
  if (total === 0) {
    console.log('No intake items to migrate.');
    await mongoose.disconnect();
    return;
  }

  const cursor = items.find({});
  let moved = 0;
  let skipped = 0;
  let orphaned = 0;

  while (await cursor.hasNext()) {
    const item = await cursor.next();
    const document = await documents.findOne(
      { _id: item.documentId },
      { projection: { facts: 1 } },
    );
    if (!document) {
      orphaned += 1;
      continue;
    }
    const already = (document.facts ?? []).some(
      (fact) => String(fact._id) === String(item._id),
    );
    if (already) {
      skipped += 1;
      continue;
    }

    const fact = { _id: item._id };
    for (const field of FACT_FIELDS) {
      if (item[field] !== undefined && item[field] !== null) {
        fact[field] = item[field];
      }
    }
    await documents.updateOne(
      { _id: item.documentId },
      { $push: { facts: fact } },
    );
    moved += 1;
  }

  console.log(`Items found: ${total}`);
  console.log(`Facts moved: ${moved}`);
  console.log(`Already migrated: ${skipped}`);
  console.log(`Orphaned items (no document): ${orphaned}`);

  const backupName = `intakeitems_backup_${new Date().toISOString().replace(/[:.]/g, '-')}`;
  await items.rename(backupName);
  console.log(`Old collection renamed to ${backupName}`);

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
