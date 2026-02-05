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
export const readingSchema = z.object({
  meterId: objectIdSchema,
  value: z.number().nonnegative('Reading value cannot be negative'),
  date: z.string().pipe(z.coerce.date()),
}).strict();

export const bulkReadingSchema = z.array(z.object({
  meterId: objectIdSchema,
  value: z.number().nonnegative(),
  date: z.string().pipe(z.coerce.date()),
}));

// Contract Schemas
export const contractSchema = z.object({
  meterId: objectIdSchema,
  providerName: z.string().min(1, 'Provider name is required'),
  type: z.enum(['power', 'gas', 'water']),
  basePrice: z.number().nonnegative(),
  workingPrice: z.number().nonnegative(),
  startDate: z.string().pipe(z.coerce.date()),
  endDate: z.string().pipe(z.coerce.date()).nullable().optional(),
}).strict();

export const contractUpdateSchema = contractSchema.omit({ meterId: true }).partial().strict();

// Helper to handle Zod errors consistently
export function formatZodError(error: z.ZodError): string {
  return error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ');
}
