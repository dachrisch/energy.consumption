import connectDB from '../lib/mongodb';
import User from '../models/User';
import Meter from '../models/Meter';
import Reading from '../models/Reading';
import Contract from '../models/Contract';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-123';

function getUserId(req: any) {
  const cookie = req.headers.cookie;
  if (!cookie) return null;
  const token = cookie.split('; ').find((c: string) => c.trim().startsWith('token='))?.split('=')[1];
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded.userId;
  } catch (e) {
    return null;
  }
}

export async function apiHandler(req: any, res: any) {
  try {
    await connectDB();

    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;
    const userId = getUserId(req);
    
    console.log(`[API] ${req.method} ${path} - User: ${userId || 'Guest'}`);

    // --- SESSION INFO ---
    if (path === '/api/session' && req.method === 'GET') {
      if (!userId) {
        res.statusCode = 401;
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }
      const user = await User.findById(userId).select('-password');
      res.end(JSON.stringify(user));
      return;
    }

    // --- REGISTER ---
    if (path === '/api/register' && req.method === 'POST') {
      const { name, email, password } = req.body;
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'User already exists' }));
        return;
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({ name, email, password: hashedPassword });
      res.statusCode = 201;
      res.end(JSON.stringify({ message: 'User created', userId: user._id }));
      return;
    }

    // --- LOGIN ---
    if (path === '/api/login' && req.method === 'POST') {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        res.statusCode = 401;
        res.end(JSON.stringify({ error: 'Invalid credentials' }));
        return;
      }
      const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
      res.setHeader('Set-Cookie', `token=${token}; Path=/; HttpOnly; Max-Age=604800; SameSite=Lax`);
      res.statusCode = 200;
      res.end(JSON.stringify({ message: 'Logged in', user: { name: user.name, email: user.email } }));
      return;
    }

    // --- AUTHENTICATED ROUTES ---
    if (!userId) {
      res.statusCode = 401;
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    // --- PROFILE UPDATE ---
    if (path === '/api/profile' && req.method === 'POST') {
      const { name, email, password } = req.body;
      const updateData: any = {};
      
      if (name) updateData.name = name;
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
      return;
    }

    // --- METERS ---
    if (path === '/api/meters' && req.method === 'GET') {
      const id = url.searchParams.get('id');
      const query = id ? { _id: id } : {};
      const meters = await Meter.find(query).setOptions({ userId });
      res.end(JSON.stringify(meters));
      return;
    }

    if (path === '/api/meters' && req.method === 'POST') {
      const meter = await Meter.create({ ...req.body, userId });
      res.statusCode = 201;
      res.end(JSON.stringify(meter));
      return;
    }

    // --- READINGS ---
    if (path === '/api/readings' && req.method === 'GET') {
      const meterId = url.searchParams.get('meterId');
      const readings = await Reading.find({ meterId }).setOptions({ userId }).sort({ date: -1 });
      res.end(JSON.stringify(readings));
      return;
    }

    if (path === '/api/readings' && req.method === 'POST') {
      const reading = await Reading.create({ ...req.body, userId });
      res.statusCode = 201;
      res.end(JSON.stringify(reading));
      return;
    }

    // --- CONTRACTS ---
    if (path === '/api/contracts' && req.method === 'GET') {
      const meterId = url.searchParams.get('meterId');
      const query = meterId ? { meterId } : {};
      const contracts = await Contract.find(query).setOptions({ userId }).sort({ startDate: -1 });
      res.end(JSON.stringify(contracts));
      return;
    }

    if (path === '/api/contracts' && req.method === 'POST') {
      const { meterId, startDate, endDate } = req.body;
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : null;

      const overlapQuery: any = {
        meterId,
        startDate: { $lte: end || new Date('2099-12-31') }
      };
      
      if (end) {
        overlapQuery.$or = [
          { endDate: { $gte: start } },
          { endDate: null }
        ];
      } else {
        overlapQuery.$or = [
          { endDate: { $gte: start } },
          { endDate: null }
        ];
      }

      const overlapping = await Contract.findOne(overlapQuery).setOptions({ userId });
      
      if (overlapping) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Contract period overlaps with an existing contract for this meter' }));
        return;
      }

      const contract = await Contract.create({ ...req.body, userId });
      res.statusCode = 201;
      res.end(JSON.stringify(contract));
      return;
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not Found' }));

  } catch (error: any) {
    console.error('API Error:', error);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: error.message }));
  }
}
