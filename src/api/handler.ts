import connectDB from '../lib/mongodb';
import User from '../models/User';
import Meter from '../models/Meter';
import Reading from '../models/Reading';
import Contract from '../models/Contract';
import { calculateAggregates } from '../lib/aggregates';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-123';

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
  if (!cookie) {return null;}
  const token = cookie.split('; ').find((c: string) => c.trim().startsWith('token='))?.split('=')[1];
  if (!token) {return null;}
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch (e) {
    return null;
  }
}

async function handleSession(res: ApiResponse, userId: string) {
  const user = await User.findById(userId).select('-password');
  res.end(JSON.stringify(user));
}

async function handleRegister(req: ApiRequest, res: ApiResponse) {
  const { name, email, password } = req.body as { name?: string, email?: string, password?: string };
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'User already exists' }));
    return;
  }
  if (!password) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Password required' }));
    return;
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashedPassword });
  res.statusCode = 201;
  res.end(JSON.stringify({ message: 'User created', userId: user._id }));
}

async function handleLogin(req: ApiRequest, res: ApiResponse) {
  const { email, password } = req.body as { email?: string, password?: string };
  const user = await User.findOne({ email });
  if (!user || !password || !(await bcrypt.compare(password, user.password))) {
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
  const { name, email, password } = req.body as { name?: string, email?: string, password?: string };
  const updateData: Record<string, unknown> = {};
  
  if (name) {updateData.name = name;}
  if (email) {
    const existing = await User.findOne({ email, _id: { $ne: userId } });
    if (existing) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Email already in use' }));
      return;
    }
    updateData.email = email;
  }
  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }

  const updated = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');
  res.end(JSON.stringify(updated));
}

async function handleMeters({ req, res, userId, url }: RouteParams) {
  if (req.method === 'GET') {
    const id = url.searchParams.get('id');
    const query = id ? { _id: id } : {};
    const meters = await Meter.find(query).setOptions({ userId });
    res.end(JSON.stringify(meters));
    return;
  }
  if (req.method === 'POST') {
    const meter = await Meter.create({ ...req.body, userId });
    res.statusCode = 201;
    res.end(JSON.stringify(meter));
    return;
  }
}

async function handleMeterItem({ req, res, userId, path }: RouteParams) {
  const id = path.split('/').pop()!;
  if (req.method === 'DELETE') {
    await Promise.all([
      Reading.deleteMany({ meterId: id }).setOptions({ userId }),
      Contract.deleteMany({ meterId: id }).setOptions({ userId }),
      Meter.deleteOne({ _id: id }).setOptions({ userId })
    ]);
    res.end(JSON.stringify({ message: 'Meter and associated data deleted' }));
    return;
  }
  if (req.method === 'PATCH' || req.method === 'PUT') {
    const updated = await Meter.findOneAndUpdate({ _id: id }, { $set: req.body }, { new: true }).setOptions({ userId });
    res.end(JSON.stringify(updated));
    return;
  }
}

async function handleReadings({ req, res, userId, url }: RouteParams) {
  if (req.method === 'GET') {
    const meterId = url.searchParams.get('meterId');
    const query = meterId ? { meterId } : {};
    const readings = await Reading.find(query).setOptions({ userId }).sort({ date: -1 });
    res.end(JSON.stringify(readings));
    return;
  }
  if (req.method === 'POST') {
    const reading = await Reading.create({ ...req.body, userId });
    res.statusCode = 201;
    res.end(JSON.stringify(reading));
    return;
  }
}

async function handleReadingItem({ req, res, userId, path }: RouteParams) {
  const id = path.split('/').pop()!;
  if (req.method === 'DELETE') {
    await Reading.deleteOne({ _id: id }).setOptions({ userId });
    res.end(JSON.stringify({ message: 'Deleted' }));
    return;
  }
  if (req.method === 'PATCH' || req.method === 'PUT') {
    const updated = await Reading.findOneAndUpdate({ _id: id }, { $set: req.body }, { new: true }).setOptions({ userId });
    res.end(JSON.stringify(updated));
    return;
  }
}

async function handleContracts({ req, res, userId, url }: RouteParams) {
  if (req.method === 'GET') {
    const meterId = url.searchParams.get('meterId');
    const id = url.searchParams.get('id');
    const query = id ? { _id: id } : (meterId ? { meterId } : {});
    const contracts = await Contract.find(query).populate('meterId').setOptions({ userId }).sort({ startDate: -1 });
    res.end(JSON.stringify(contracts));
    return;
  }
  if (req.method === 'POST') {
    const contract = await Contract.create({ ...req.body, userId });
    res.statusCode = 201;
    res.end(JSON.stringify(contract));
    return;
  }
}

async function handleContractItem({ req, res, userId, path }: RouteParams) {
  const id = path.split('/').pop()!;
  if (req.method === 'DELETE') {
    await Contract.deleteOne({ _id: id }).setOptions({ userId });
    res.end(JSON.stringify({ message: 'Deleted' }));
    return;
  }
  if (req.method === 'PATCH' || req.method === 'PUT') {
    const updated = await Contract.findOneAndUpdate({ _id: id }, { $set: req.body }, { new: true }).setOptions({ userId });
    res.end(JSON.stringify(updated));
    return;
  }
}

async function handleMetersRoutes(params: RouteParams) {
  if (params.path === '/api/meters') {return handleMeters(params);}
  if (params.path.startsWith('/api/meters/')) {return handleMeterItem(params);}
}

async function handleReadingsRoutes(params: RouteParams) {
  if (params.path === '/api/readings') {return handleReadings(params);}
  if (params.path.startsWith('/api/readings/')) {return handleReadingItem(params);}
}

async function handleContractsRoutes(params: RouteParams) {
  if (params.path === '/api/contracts') {return handleContracts(params);}
  if (params.path.startsWith('/api/contracts/')) {return handleContractItem(params);}
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
  if (path === '/api/session' && req.method === 'GET') {return handleSession(res, userId);}
  if (path === '/api/profile' && req.method === 'POST') {return handleProfileUpdate(req, res, userId);}
  
  if (path === '/api/dashboard' || path === '/api/aggregates') {
    return handleAggregatedRoutes(params);
  }

  if (path.includes('/api/meters')) {return handleMetersRoutes(params);}
  if (path.includes('/api/readings')) {return handleReadingsRoutes(params);}
  if (path.includes('/api/contracts')) {return handleContractsRoutes(params);}

  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'Not Found' }));
}

export async function apiHandler(req: ApiRequest, res: ApiResponse) {
  try {
    await connectDB();
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;
    const userId = getUserId(req);
    
    if (path === '/api/register' && req.method === 'POST') {return handleRegister(req, res);}
    if (path === '/api/login' && req.method === 'POST') {return handleLogin(req, res);}

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
