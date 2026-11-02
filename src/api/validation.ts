import { z } from 'zod';

// Base schemas for reuse
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

// Auth Schemas
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  googleApiKey: z.string().optional(),
}).strict();

// Meter Schemas
export const meterSchema = z.object({
  name: z.string().min(1, 'Meter name is required'),
  meterNumber: z.string().min(1, 'Meter number is required'),
  type: z.enum(['power', 'gas', 'water']),
  unit: z.string().min(1, 'Unit is required'),
}).strict();

// Reading Schemas
export const readingKindSchema = z.enum(['regular', 'meterChange']);

export const readingSchema = z.object({
  meterId: objectIdSchema,
  value: z.number().nonnegative('Reading value cannot be negative'),
  date: z.string().pipe(z.coerce.date()),
  kind: readingKindSchema.optional(),
}).strict();

export const bulkReadingSchema = z.array(z.object({
  meterId: objectIdSchema,
  value: z.number().nonnegative(),
  date: z.string().pipe(z.coerce.date()),
}));

// Contract Schemas
const contractFields = {
  meterId: objectIdSchema,
  /** Existing supplier, or a name that is upserted on save. */
  supplierId: objectIdSchema.optional(),
  supplierName: z.string().trim().min(1).max(120).optional(),
  /** Legacy alias accepted from imports and older clients. */
  providerName: z.string().trim().min(1).max(120).optional(),
  basePrice: z.number().nonnegative(),
  workingPrice: z.number().nonnegative(),
  startDate: z.string().pipe(z.coerce.date()),
  endDate: z.string().pipe(z.coerce.date()).nullable().optional(),
};

export const contractSchema = z.object(contractFields).strict().refine(
  (data) => Boolean(data.supplierId || data.supplierName || data.providerName),
  { message: 'supplierId or supplierName is required', path: ['supplierId'] },
);

export const contractUpdateSchema = z.object(contractFields).partial().strict();

/** Supplier master data plus the mail settings the intake uses. */
export const supplierSchema = z.object({
  name: z.string().trim().min(1, 'Supplier name is required').max(120),
  senders: z.array(z.string().trim().min(3)).max(20).optional(),
  subjectHints: z.array(z.string().trim().min(1)).max(20).optional(),
  gmailQuery: z.string().trim().max(300).nullable().optional(),
}).strict();

export const supplierUpdateSchema = supplierSchema.partial().strict();

/** File an ingested document under a supplier; null moves it back to unassigned. */
export const documentSupplierSchema = z.object({
  supplierId: objectIdSchema.nullable(),
}).strict();

// Unified Export Schema
export const unifiedExportSchema = z.object({
  exportDate: z.string().datetime(),
  version: z.literal('1.0'),
  data: z.object({
    suppliers: z.array(z.object({
      id: z.string().optional(),
      name: z.string(),
      senders: z.array(z.string()).optional(),
      subjectHints: z.array(z.string()).optional(),
      gmailQuery: z.string().nullable().optional(),
    })).optional(),
    meters: z.array(z.object({
      id: z.string(),
      name: z.string(),
      meterNumber: z.string(),
      type: z.enum(['power', 'gas', 'water']),
      unit: z.string()
    })),
    readings: z.array(z.object({
      id: z.string(),
      meterId: z.string(),
      value: z.number(),
      date: z.string(),
      kind: readingKindSchema.optional()
    })),
    contracts: z.array(z.object({
      id: z.string(),
      providerName: z.string().optional(),
      supplierId: z.string().optional(),
      supplierName: z.string().optional(),
      startDate: z.string(),
      endDate: z.string().nullable().optional(),
      basePrice: z.number(),
      workingPrice: z.number(),
      meterId: z.string()
    }))
  })
});

// Helper to handle Zod errors consistently
export function formatZodError(error: z.ZodError): string {
  return error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ');
}
