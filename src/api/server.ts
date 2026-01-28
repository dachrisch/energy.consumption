import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import { apiHandler } from './handler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 80;

app.use(bodyParser.json());

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, '../../dist')));

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
  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Production server running on port ${PORT}`);
});
