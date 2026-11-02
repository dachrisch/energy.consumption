import { describe, it, expect } from 'vitest';
import { planIntake, processDocument } from '../processDocument';
import type { ProcessDocumentArgs, ReadingRef } from '../processDocument';
import type { ExtractedDocument } from '../extract';

const meters = [
  { _id: 'm1', meterNumber: '1-234-567', unit: 'kWh' },
  { _id: 'm2', meterNumber: '000987', unit: 'kWh' },
];

const readings: ReadingRef[] = [
  { _id: 'r1', meterId: 'm1', date: '2024-01-01', value: 1000 },
  { _id: 'r2', meterId: 'm1', date: '2024-02-01', value: 2000 },
  // Belongs to another meter: must never be used for m1 comparisons.
  { _id: 'r3', meterId: 'm2', date: '2024-01-02', value: 5000 },
];

function extracted(overrides: Partial<ExtractedDocument> = {}): ExtractedDocument {
  return {
    readings: [{ date: '2024-01-03', value: 1000.5, unit: 'kWh', confidence: 0.9 }],
    ...overrides,
  };
}

function args(overrides: Partial<ProcessDocumentArgs> = {}): ProcessDocumentArgs {
  return {
    document: {
      _id: 'd1',
      mimeType: 'text/csv',
      fileName: 'lastgang.csv',
      receivedAt: new Date('2024-02-10'),
      buffer: Buffer.from('Datum;Wert\n01.01.2024;1000'),
    },
    supplier: { name: 'Stadtwerke', defaultUnit: 'kWh' },
    userId: 'u1',
    meters,
    readings,
    ...overrides,
  };
}

describe('planIntake', () => {
  it('marks a reading that matches the user value as agreeing', () => {
    const plan = planIntake(extracted({ meterNumber: '1234567' }), meters, readings);

    expect(plan.items).toHaveLength(1);
    expect(plan.items[0]).toMatchObject({
      meterId: 'm1',
      meterNumber: '1234567',
      status: 'agrees',
      matchedReadingId: 'r1',
      value: 1000.5,
      unit: 'kWh',
      confidence: 0.9,
    });
  });

  it('flags a disagreeing reading as a conflict and keeps both values', () => {
    const plan = planIntake(
      extracted({ meterNumber: '1234567', readings: [{ date: '2024-01-03', value: 1100 }] }),
      meters,
      readings,
    );

    expect(plan.items[0].status).toBe('conflict');
    expect(plan.items[0].matchedReadingId).toBe('r1');
    expect(plan.items[0].note).toContain('1000');
  });

  it('never compares against readings of a different meter', () => {
    const otherMeterOnly: ReadingRef[] = [
      { _id: 'r9', meterId: 'm2', date: '2024-06-01', value: 5000 },
    ];
    const plan = planIntake(
      extracted({ meterNumber: '1234567', readings: [{ date: '2024-06-01', value: 1100 }] }),
      meters,
      otherMeterOnly,
    );

    expect(plan.items[0].status).toBe('pending');
    expect(plan.items[0].matchedReadingId).toBeUndefined();
  });

  it('uses the closest same-meter reading inside the date window', () => {
    const plan = planIntake(
      extracted({ meterNumber: '1234567', readings: [{ date: '2024-01-02', value: 1100 }] }),
      meters,
      readings,
    );

    expect(plan.items[0].status).toBe('conflict');
    expect(plan.items[0].matchedReadingId).toBe('r1');
  });

  it('leaves readings pending when the meter number is unknown', () => {
    const plan = planIntake(extracted({ meterNumber: '999999' }), meters, readings);

    expect(plan.items[0].status).toBe('pending');
    expect(plan.items[0].meterId).toBeUndefined();
    expect(plan.items[0].note).toBe('unknown meter number');
  });

  it('tolerates missing meter numbers and leading zeros', () => {
    expect(planIntake(extracted(), meters, readings).items[0].meterId).toBeUndefined();
    expect(planIntake(extracted({ meterNumber: '987' }), meters, readings).items[0].meterId).toBe('m2');
  });

  it('attributes a bill only when the meter is known', () => {
    const bill = { periodStart: '2024-01-01', periodEnd: '2024-03-31', consumption: 500, amountGross: 180 };

    const known = planIntake(extracted({ meterNumber: '1234567', bill }), meters, readings);
    const unknown = planIntake(extracted({ meterNumber: '999', bill }), meters, readings);

    expect(known.bill).toEqual({
      meterId: 'm1',
      periodStart: '2024-01-01',
      periodEnd: '2024-03-31',
      consumption: 500,
      unit: 'kWh',
      amountGross: 180,
      amountNet: undefined,
      currency: 'EUR',
    });
    expect(unknown.bill).toBeUndefined();
  });
});

describe('processDocument guards', () => {
  it('rejects formats the extractor does not support', async () => {
    const result = await processDocument(args({
      document: { ...args().document, mimeType: 'application/zip' },
    }));

    expect(result).toEqual({ status: 'failed', intakeItemIds: [], error: 'unsupported format' });
  });

  it('refuses oversized attachments before touching the bytes', async () => {
    const result = await processDocument(args({
      document: { ...args().document, size: 16 * 1024 * 1024 },
    }));

    expect(result.status).toBe('failed');
    expect(result.error).toBe('attachment too large');
  });

  it('reports missing document bytes', async () => {
    const result = await processDocument(args({
      document: { ...args().document, buffer: Buffer.alloc(0) },
    }));

    expect(result).toMatchObject({ status: 'failed', error: 'no document bytes available' });
  });

  it('skips documents that were already processed', async () => {
    for (const status of ['parsed', 'needs_review', 'imported']) {
      const result = await processDocument(args({
        document: { ...args().document, status },
      }));
      expect(result).toEqual({ status: 'skipped', intakeItemIds: [] });
    }
  });

  it('reports a PDF without a Gemini key instead of throwing', async () => {
    const result = await processDocument(args({
      document: { ...args().document, mimeType: 'application/pdf', fileName: 'bill.pdf' },
    }));

    expect(result.status).toBe('failed');
    expect(result.error).toMatch(/Gemini API key/);
  });
});
