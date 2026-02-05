import connectDB from '../lib/mongodb';
import { handleRegister, handleLogin } from './controllers/auth.controller';
import { router } from './router';
import { ApiRequest, ApiResponse, JWT_SECRET } from './utils';
import jwt from 'jsonwebtoken';

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

export async function apiHandler(req: ApiRequest, res: ApiResponse) {
  try {
    await connectDB();
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;
    const userId = getUserId(req);

    // Public routes
    if (path === '/api/register' && req.method === 'POST') { return handleRegister(req, res); }
    if (path === '/api/login' && req.method === 'POST') { return handleLogin(req, res); }

    // Protected routes
    if (!userId) {
      res.statusCode = 401;
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    return router({ req, res, userId, path, url });
  } catch (error: unknown) {
    console.error('Unhandled API Error:', error);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }));
  }
}
