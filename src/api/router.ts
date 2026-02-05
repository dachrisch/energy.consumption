import { RouteParams } from './utils';
import { handleSession, handleProfileUpdate } from './controllers/auth.controller';
import { handleMeters, handleMeterItem } from './controllers/meter.controller';
import { handleReadings, handleBulkReadings, handleReadingItem } from './controllers/reading.controller';
import { handleContracts, handleContractItem } from './controllers/contract.controller';
import { handleOcrScan } from './controllers/ocr.controller';
import { handleAggregatedRoutes } from './controllers/dashboard.controller';

export async function router(params: RouteParams) {
  const { req, res, userId, path } = params;

  // Exact matches
  const routes: Record<string, () => Promise<void>> = {
    '/api/session': async () => { if (req.method === 'GET') { await handleSession(res, userId); } },
    '/api/profile': async () => { if (req.method === 'POST') { await handleProfileUpdate(req, res, userId); } },
    '/api/ocr/scan': async () => { if (req.method === 'POST') { await handleOcrScan(params); } },
    '/api/dashboard': async () => handleAggregatedRoutes(params),
    '/api/aggregates': async () => handleAggregatedRoutes(params),
    '/api/meters': async () => handleMeters(params),
    '/api/readings': async () => handleReadings(params),
    '/api/readings/bulk': async () => handleBulkReadings(params),
    '/api/contracts': async () => handleContracts(params),
  };

  if (routes[path]) {
    await routes[path]();
    // Ensure response is ended if not already done by controller
    return;
  }

  // Parameterized routes (IDs)
  if (path.startsWith('/api/meters/')) { return handleMeterItem(params); }
  if (path.startsWith('/api/readings/')) { return handleReadingItem(params); }
  if (path.startsWith('/api/contracts/')) { return handleContractItem(params); }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'Not Found' }));
}
