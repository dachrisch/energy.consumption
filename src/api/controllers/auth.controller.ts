import User from '../../models/User';
import { encrypt, decrypt } from '../../lib/encryption';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ApiRequest, ApiResponse, JWT_SECRET } from '../utils';
import { registerSchema, loginSchema, profileUpdateSchema, formatZodError } from '../validation';

export async function handleSession(res: ApiResponse, userId: string) {
  const user = await User.findById(userId).select('-password').lean();
  if (user && user.googleApiKey) {
    user.googleApiKey = decrypt(user.googleApiKey);
  }
  res.end(JSON.stringify(user));
}

export async function handleRegister(req: ApiRequest, res: ApiResponse) {
  const allowSignup = process.env.ALLOW_SIGNUP !== 'false';
  if (!allowSignup) {
    res.statusCode = 403;
    res.end(JSON.stringify({ error: 'Registration is currently disabled' }));
    return;
  }

  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: formatZodError(result.error) }));
    return;
  }

  const { name, email, password } = result.data;

  const existingUser = await User.findOne({ email: { $eq: email } });
  if (existingUser) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'User already exists' }));
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashedPassword });
  res.statusCode = 201;
  res.end(JSON.stringify({ message: 'User created', userId: user._id }));
}

export async function handleLogin(req: ApiRequest, res: ApiResponse) {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: formatZodError(result.error) }));
    return;
  }

  const { email, password } = result.data;

  const user = await User.findOne({ email: { $eq: email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Invalid credentials' }));
    return;
  }
  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
  res.setHeader('Set-Cookie', `token=${token}; Path=/; HttpOnly; Max-Age=604800; SameSite=Lax`);
  res.statusCode = 200;
  res.end(JSON.stringify({ message: 'Logged in', user: { name: user.name, email: user.email } }));
}

export async function handleProfileUpdate(req: ApiRequest, res: ApiResponse, userId: string) {
  const result = profileUpdateSchema.safeParse(req.body);
  if (!result.success) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: formatZodError(result.error) }));
    return;
  }

  const { name, email, password, googleApiKey } = result.data;
  const updateData: Record<string, unknown> = {};

  if (name) { updateData.name = name; }

  if (email) {
    const existing = await User.findOne({ email: { $eq: email }, _id: { $ne: userId } });
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

  if (googleApiKey !== undefined) {
    updateData.googleApiKey = encrypt(googleApiKey);
  }

  const updated = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true }).select('-password').lean();
  if (updated && updated.googleApiKey) {
    updated.googleApiKey = decrypt(updated.googleApiKey);
  }
  res.end(JSON.stringify(updated));
}
