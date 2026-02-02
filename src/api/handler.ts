import connectDB from '../lib/mongodb';
import User from '../models/User';
import Meter from '../models/Meter';
import Reading from '../models/Reading';
import Contract from '../models/Contract';
import OcrCache from '../models/OcrCache';
import { calculateAggregates } from '../lib/aggregates';
import { processBulkReadings } from '../lib/readingService';
import { processOcrScan } from '../lib/ocrService';
import { encrypt, decrypt } from '../lib/encryption';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET environment variable is not set. Using a random secret. Sessions will not persist across restarts.');
}

/**
 * Ensures a value is a string, preventing NoSQL injection via objects.
 */
function sanitizeString(val: unknown): string | null {
  if (typeof val !== 'string') {
    return null;
  }
  return val;
}

/**
 * Picks only allowed keys from an object to prevent mass assignment.
 */
function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj && obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
}

interface ApiRequest {
  url: string;
  method: string;
  headers: { [key: string]: string | undefined };
  body: Record<string, unknown>;
}

interface ApiResponse {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(data: string): void;
}

interface RouteParams {
  req: ApiRequest;
  res: ApiResponse;
  userId: string;
  path: string;
  url: URL;
}

function getUserId(req: ApiRequest) {
  const cookie = req.headers.cookie;
  if (!cookie) { return null; }
  const token = cookie.split('; ').find((c: string) => c.trim().startsWith('token='))?.split('=')[1];
  if (!token) { return null; }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch (_e) {
    return null;
  }
}

async function handleSession(res: ApiResponse, userId: string) {
  const user = await User.findById(userId).select('-password').lean();
  if (user && user.googleApiKey) {
    user.googleApiKey = decrypt(user.googleApiKey);
  }
  res.end(JSON.stringify(user));
}

async function handleRegister(req: ApiRequest, res: ApiResponse) {
  const allowSignup = process.env.ALLOW_SIGNUP !== 'false';
  if (!allowSignup) {
    res.statusCode = 403;
    res.end(JSON.stringify({ error: 'Registration is currently disabled' }));
    return;
  }
  const { name, email, password } = req.body as { name?: unknown, email?: unknown, password?: unknown };
  const sEmail = sanitizeString(email);
  const sName = sanitizeString(name);
  const sPassword = sanitizeString(password);

  if (!sEmail || !sName || !sPassword) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Name, email and password are required and must be strings' }));
    return;
  }

  const existingUser = await User.findOne({ email: { $eq: sEmail } });
  if (existingUser) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'User already exists' }));
    return;
  }

  const hashedPassword = await bcrypt.hash(sPassword, 10);
  const user = await User.create({ name: sName, email: sEmail, password: hashedPassword });
  res.statusCode = 201;
  res.end(JSON.stringify({ message: 'User created', userId: user._id }));
}

async function handleLogin(req: ApiRequest, res: ApiResponse) {
  const { email, password } = req.body as { email?: unknown, password?: unknown };
  const sEmail = sanitizeString(email);
  const sPassword = sanitizeString(password);

  if (!sEmail || !sPassword) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Email and password are required' }));
    return;
  }

  const user = await User.findOne({ email: { $eq: sEmail } });
  if (!user || !(await bcrypt.compare(sPassword, user.password))) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Invalid credentials' }));
    return;
  }
  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
  res.setHeader('Set-Cookie', `token=${token}; Path=/; HttpOnly; Max-Age=604800; SameSite=Lax`);
  res.statusCode = 200;
  res.end(JSON.stringify({ message: 'Logged in', user: { name: user.name, email: user.email } }));
}

async function handleProfileUpdate(req: ApiRequest, res: ApiResponse, userId: string) {
  const { name, email, password, googleApiKey } = req.body as { name?: unknown, email?: unknown, password?: unknown, googleApiKey?: unknown };
  const updateData: Record<string, unknown> = {};

  const sName = sanitizeString(name);
  if (sName) { updateData.name = sName; }

  const sEmail = sanitizeString(email);
  if (sEmail) {
    const existing = await User.findOne({ email: { $eq: sEmail }, _id: { $ne: userId } });
    if (existing) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Email already in use' }));
      return;
    }
    updateData.email = sEmail;
  }

  const sPassword = sanitizeString(password);
  if (sPassword) {
    updateData.password = await bcrypt.hash(sPassword, 10);
  }

  if (googleApiKey !== undefined) {
    const sGoogleApiKey = sanitizeString(googleApiKey);
    updateData.googleApiKey = encrypt(sGoogleApiKey || '');
  }

  const updated = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true }).select('-password').lean();
  if (updated && updated.googleApiKey) {
    updated.googleApiKey = decrypt(updated.googleApiKey);
  }
  res.end(JSON.stringify(updated));
}

async function handleMeters({ req, res, userId, url }: RouteParams) {
  if (req.method === 'GET') {
    const id = sanitizeString(url.searchParams.get('id'));
    const query = id ? { _id: { $eq: id } } : {};
    const meters = await Meter.find(query).setOptions({ userId });
    res.end(JSON.stringify(meters));
    return;
  }
  if (req.method === 'POST') {
    const allowed = pick(req.body, ['name', 'meterNumber', 'type', 'unit']);
    const meter = await Meter.create({ ...allowed, userId });
    res.statusCode = 201;
    res.end(JSON.stringify(meter));
    return;
  }
}

async function handleMeterItem({ req, res, userId, path }: RouteParams) {
  const id = sanitizeString(path.split('/').pop());
  if (!id) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Invalid ID' }));
    return;
  }

  if (req.method === 'DELETE') {
    await Promise.all([
      Reading.deleteMany({ meterId: { $eq: id } }).setOptions({ userId }),
      Contract.deleteMany({ meterId: { $eq: id } }).setOptions({ userId }),
      Meter.deleteOne({ _id: { $eq: id } }).setOptions({ userId })
    ]);
    res.end(JSON.stringify({ message: 'Meter and associated data deleted' }));
    return;
  }
  if (req.method === 'PATCH' || req.method === 'PUT') {
    const allowed = pick(req.body, ['name', 'meterNumber', 'type', 'unit']);
    const updated = await Meter.findOneAndUpdate({ _id: { $eq: id } }, { $set: allowed }, { new: true }).setOptions({ userId });
    res.end(JSON.stringify(updated));
    return;
  }
}

interface BulkReading {
  meterId: string;
  date: string | Date;
  value: number;
}

async function handleBulkReadings({ req, res, userId }: RouteParams) {
  if (req.method === 'POST') {
    const readings = req.body as unknown as BulkReading[];
    if (!Array.isArray(readings)) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Expected array of readings' }));
      return;
    }

    // Pass Mongoose models explicitly to service
    const result = await processBulkReadings(readings, userId, Meter, Reading);

    res.statusCode = 200;
    res.end(JSON.stringify(result));
    return;
  }
}
async function getGeminiApiKey(userId: string): Promise<string | undefined> {
  const user = await User.findById(userId);
  const key = user?.googleApiKey ? decrypt(user.googleApiKey) : undefined;
  return key || process.env.GOOGLE_API_KEY;
}

async function handleOcrScan({ req, res, userId }: RouteParams) {
  if (req.method !== 'POST') {return;}

  const { image } = req.body as { image?: string };
  if (!image) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Image required (base64)' }));
    return;
  }

  const apiKey = await getGeminiApiKey(userId);
  if (!apiKey) {
    res.statusCode = 503;
    res.end(JSON.stringify({ error: 'Gemini OCR not configured. Set GOOGLE_API_KEY in Profile Settings.' }));
    return;
  }

  try {
    const result = await processOcrScan(image, userId, apiKey, { Meter, OcrCache });
    res.end(JSON.stringify(result));
  } catch (e) {
    console.error('Gemini OCR Error:', e);
    res.statusCode = 502;
    res.end(JSON.stringify({ error: e instanceof Error ? e.message : 'OCR failed' }));
  }
}

async function handleReadings({ req, res, userId, url }: RouteParams) {
  if (req.method === 'GET') {
    const meterId = sanitizeString(url.searchParams.get('meterId'));
    const query = meterId ? { meterId: { $eq: meterId } } : {};
    const readings = await Reading.find(query).setOptions({ userId }).sort({ date: -1 });
    res.end(JSON.stringify(readings));
    return;
  }
  if (req.method === 'POST') {
    const allowed = pick(req.body, ['meterId', 'value', 'date']);
    const reading = await Reading.create({ ...allowed, userId });
    res.statusCode = 201;
    res.end(JSON.stringify(reading));
    return;
  }
}

async function handleReadingItem({ req, res, userId, path }: RouteParams) {
  const id = sanitizeString(path.split('/').pop());
  if (!id) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Invalid ID' }));
    return;
  }

  if (req.method === 'DELETE') {
    await Reading.deleteOne({ _id: { $eq: id } }).setOptions({ userId });
    res.end(JSON.stringify({ message: 'Deleted' }));
    return;
  }
  if (req.method === 'PATCH' || req.method === 'PUT') {
    const allowed = pick(req.body, ['value', 'date']);
    const updated = await Reading.findOneAndUpdate({ _id: { $eq: id } }, { $set: allowed }, { new: true }).setOptions({ userId });
    res.end(JSON.stringify(updated));
    return;
  }
}

async function handleContracts({ req, res, userId, url }: RouteParams) {
  if (req.method === 'GET') {
    const meterId = sanitizeString(url.searchParams.get('meterId'));
    const id = sanitizeString(url.searchParams.get('id'));
    const query = id ? { _id: { $eq: id } } : (meterId ? { meterId: { $eq: meterId } } : {});
    const contracts = await Contract.find(query).populate('meterId').setOptions({ userId }).sort({ startDate: -1 });
    res.end(JSON.stringify(contracts));
    return;
  }
  if (req.method === 'POST') {
    const allowed = pick(req.body, ['meterId', 'name', 'type', 'unitPrice', 'standingCharge', 'startDate', 'endDate', 'estimatedAnnualConsumption']);
    const contract = await Contract.create({ ...allowed, userId });
    res.statusCode = 201;
    res.end(JSON.stringify(contract));
    return;
  }
}

async function handleContractItem({ req, res, userId, path }: RouteParams) {
  const id = sanitizeString(path.split('/').pop());
  if (!id) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Invalid ID' }));
    return;
  }

  if (req.method === 'DELETE') {
    await Contract.deleteOne({ _id: { $eq: id } }).setOptions({ userId });
    res.end(JSON.stringify({ message: 'Deleted' }));
    return;
  }
  if (req.method === 'PATCH' || req.method === 'PUT') {
    const allowed = pick(req.body, ['name', 'type', 'unitPrice', 'standingCharge', 'startDate', 'endDate', 'estimatedAnnualConsumption']);
    const updated = await Contract.findOneAndUpdate({ _id: { $eq: id } }, { $set: allowed }, { new: true }).setOptions({ userId });
    res.end(JSON.stringify(updated));
    return;
  }
}

async function handleMetersRoutes(params: RouteParams) {
  if (params.path === '/api/meters') { return handleMeters(params); }
  if (params.path.startsWith('/api/meters/')) { return handleMeterItem(params); }
}

async function handleReadingsRoutes(params: RouteParams) {
  if (params.path === '/api/readings/bulk') { return handleBulkReadings(params); }
  if (params.path === '/api/readings') { return handleReadings(params); }
  if (params.path.startsWith('/api/readings/')) { return handleReadingItem(params); }
}

async function handleContractsRoutes(params: RouteParams) {
  if (params.path === '/api/contracts') { return handleContracts(params); }
  if (params.path.startsWith('/api/contracts/')) { return handleContractItem(params); }
}

async function handleAggregatedRoutes({ res, userId, path }: RouteParams) {
  const [meters, contracts, readings] = await Promise.all([
    Meter.find({}).setOptions({ userId }),
    Contract.find({}).setOptions({ userId }),
    Reading.find({}).setOptions({ userId }).sort({ date: -1 })
  ]);
  const data = path === '/api/dashboard' ? { meters, contracts, readings } : calculateAggregates(meters, readings, contracts);
  res.end(JSON.stringify(data));
}

async function handleAuthenticatedRoute(params: RouteParams) {
  const { req, res, userId, path } = params;

  const routes: Record<string, () => Promise<void>> = {
    '/api/session': async () => { if (req.method === 'GET') { await handleSession(res, userId); } },
    '/api/profile': async () => { if (req.method === 'POST') { await handleProfileUpdate(req, res, userId); } },
    '/api/ocr/scan': async () => { if (req.method === 'POST') { await handleOcrScan(params); } },
    '/api/dashboard': async () => handleAggregatedRoutes(params),
    '/api/aggregates': async () => handleAggregatedRoutes(params)
  };

  if (routes[path]) {
    return routes[path]();
  }

  if (path.includes('/api/meters')) { return handleMetersRoutes(params); }
  if (path.includes('/api/readings')) { return handleReadingsRoutes(params); }
  if (path.includes('/api/contracts')) { return handleContractsRoutes(params); }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'Not Found' }));
}

export async function apiHandler(req: ApiRequest, res: ApiResponse) {
  try {
    await connectDB();
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;
    const userId = getUserId(req);

    if (path === '/api/register' && req.method === 'POST') { return handleRegister(req, res); }
    if (path === '/api/login' && req.method === 'POST') { return handleLogin(req, res); }

    if (!userId) {
      res.statusCode = 401;
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    return handleAuthenticatedRoute({ req, res, userId, path, url });
  } catch (error: unknown) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }));
  }
}
