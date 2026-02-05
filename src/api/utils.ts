import crypto from 'crypto';

export const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET environment variable is not set. Using a random secret. Sessions will not persist across restarts.');
}

/**
 * Ensures a value is a string, preventing NoSQL injection via objects.
 */
export function sanitizeString(val: unknown): string | null {
  if (typeof val !== 'string') {
    return null;
  }
  return val;
}

export interface ApiRequest {
  url: string;
  method: string;
  headers: { [key: string]: string | undefined };
  body: Record<string, unknown>;
}

export interface ApiResponse {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(data: string): void;
}

export interface RouteParams {
  req: ApiRequest;
  res: ApiResponse;
  userId: string;
  path: string;
  url: URL;
}
