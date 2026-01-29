import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import rateLimit from 'express-rate-limit';
import { apiHandler } from './handler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 80;

if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET environment variable is not set. Using a random secret.');
}

const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per window
	standardHeaders: true,
	legacyHeaders: false,
});

const authLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hour
	max: 10, // Limit each IP to 10 registration/login attempts per hour
	message: 'Too many requests from this IP, please try again after an hour',
    standardHeaders: true,
	legacyHeaders: false,
});

app.use('/api/', apiLimiter);
app.use('/api/register', authLimiter);
app.use('/api/login', authLimiter);

app.use(bodyParser.json({ limit: '10mb' }));

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, '../dist')));

// Handle all /api/* routes
app.all('/api/*', async (req, res) => {
  const apiReq = {
    url: req.originalUrl,
    method: req.method,
    headers: req.headers as Record<string, string | undefined>,
    body: req.body
  };

  const apiRes = {
    statusCode: 200,
    setHeader(name: string, value: string) {
      res.setHeader(name, value);
    },
    end(data: string) {
      res.status(this.statusCode).send(data);
    }
  };

  try {
    await apiHandler(apiReq, apiRes);
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// SPA fallback: Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Production server running on port ${PORT}`);
});
