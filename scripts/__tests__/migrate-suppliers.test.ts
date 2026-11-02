import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

const execFileAsync = promisify(execFile);
const scriptPath = path.resolve(process.cwd(), 'scripts/migrate-suppliers.cjs');

function runMigration(uri: string, ...flags: string[]) {
  return execFileAsync(process.execPath, [scriptPath, ...flags], {
    env: { ...process.env, MONGODB_URI: uri },
  });
}

describe('migrate-suppliers script', () => {
  let mongoServer: MongoMemoryServer;
  let uri: string;
  const ownerId = new mongoose.Types.ObjectId();
  const otherId = new mongoose.Types.ObjectId();
  const octoId = new mongoose.Types.ObjectId();

  const db = () => mongoose.connection.db!;
  const documents = () => db().collection('providerdocuments');
  const suppliers = () => db().collection('suppliers');
  const contracts = () => db().collection('contracts');
  const bills = () => db().collection('bills');

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Promise.all([
      documents().deleteMany({}),
      suppliers().deleteMany({}),
      contracts().deleteMany({}),
      bills().deleteMany({}),
    ]);

    await suppliers().insertOne({
      _id: octoId,
      userId: ownerId,
      name: 'Octo',
      nameKey: 'octo',
      senders: [],
      subjectHints: [],
      gmailQuery: null,
    });
    await contracts().insertMany([
      {
        userId: ownerId, providerName: 'Octo', supplierId: null,
        senders: ['mail@octo.example'], subjectHints: ['Abrechnung'], gmailQuery: null,
      },
      {
        userId: ownerId, providerName: 'Octo', supplierId: null,
        senders: [], subjectHints: [], gmailQuery: null,
      },
      {
        userId: ownerId, providerName: 'Octopus Energy', supplierId: null,
        senders: ['service@octo.example'], subjectHints: [], gmailQuery: null,
      },
      {
        userId: otherId, providerName: 'Vattenfall', supplierId: null,
        senders: [], subjectHints: [], gmailQuery: null,
      },
    ]);
    await documents().insertMany([
      { userId: ownerId, providerName: 'OCTO', sha256: 'a' },
      { userId: ownerId, providerName: 'Octopus Energy', sha256: 'b' },
      { userId: ownerId, providerName: 'Unknown Utility', sha256: 'c' },
      { userId: ownerId, sha256: 'd' },
      { userId: otherId, providerName: 'Vattenfall', sha256: 'e' },
    ]);
    await bills().insertMany([
      { userId: ownerId, providerName: 'octo ', supplierId: null },
      { userId: ownerId, providerName: 'Unknown Utility', supplierId: null },
    ]);
  });

  it('reports what it would do without writing anything', async () => {
    const { stdout } = await runMigration(uri, '--dry-run');

    expect(stdout).toContain('Dry run');
    expect(stdout).toContain('Suppliers to create');
    expect(stdout).toContain('Unknown Utility');
    expect(stdout).toContain('--map');
    expect(stdout).toMatch(/Documents still unassigned:\s*2/);
    expect(stdout).toContain('Suppliers to create (2)');

    expect(await suppliers().countDocuments({})).toBe(1);
    expect(await contracts().countDocuments({ supplierId: { $in: [null] } })).toBe(4);
    expect(await documents().countDocuments({ supplierId: { $in: [null] } })).toBe(5);
  });

  it('matches names case/whitespace-insensitively and honours --map aliases', async () => {
    const { stdout } = await runMigration(uri, '--map', 'Octopus Energy=Octo');

    expect(stdout).toContain('Suppliers created: 1');
    expect(stdout).toContain('Documents linked: 3');

    const octo = await suppliers().findOne({ _id: octoId });
    expect(octo?.senders).toEqual(['mail@octo.example', 'service@octo.example']);
    expect(octo?.subjectHints).toEqual(['Abrechnung']);

    const octoDocs = await documents()
      .find({ userId: ownerId, supplierId: octoId })
      .project({ sha256: 1 })
      .toArray();
    expect(octoDocs.map((doc) => doc.sha256).sort()).toEqual(['a', 'b']);

    // Aliased contract group now points at the existing supplier.
    expect(await contracts().countDocuments({ userId: ownerId, supplierId: octoId })).toBe(3);
    expect(await bills().countDocuments({ userId: ownerId, supplierId: octoId })).toBe(1);

    // Documents from a provider with no contract still need a supplier of their own.
    const vattenfall = await suppliers().findOne({ userId: otherId });
    expect(vattenfall?.name).toBe('Vattenfall');
    expect(await contracts().countDocuments({ userId: otherId, supplierId: vattenfall?._id })).toBe(1);
    expect(await documents().countDocuments({ userId: otherId, supplierId: vattenfall?._id })).toBe(1);

    // Nothing was invented for the genuinely unmatched names.
    expect(await documents().countDocuments({ userId: ownerId, supplierId: null })).toBe(2);
  });

  it('is idempotent', async () => {
    await runMigration(uri, '--map', 'Octopus Energy=Octo');
    const { stdout } = await runMigration(uri, '--map', 'Octopus Energy=Octo');

    expect(stdout).toContain('Suppliers created: 0');
    expect(stdout).toContain('Contracts linked: 0');
    expect(stdout).toContain('Documents linked: 0');
    expect(await documents().countDocuments({ supplierId: null })).toBe(2);
  });
});
