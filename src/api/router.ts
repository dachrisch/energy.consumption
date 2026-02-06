import { RouteParams } from './utils';
import { handleSession, handleProfileUpdate } from './controllers/auth.controller';
import { handleMeters, handleMeterItem } from './controllers/meter.controller';
import { handleReadings, handleBulkReadings, handleReadingItem, exportReadingsAsJson, exportFullBackup } from './controllers/reading.controller';
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
     '/api/export/readings': async () => {
       if (req.method === 'GET') {
         try {
           const data = await exportReadingsAsJson(userId);
           res.setHeader('Content-Type', 'application/json');
           res.setHeader('Content-Disposition', 'attachment; filename="readings-export.json"');
           res.statusCode = 200;
           res.end(JSON.stringify(data));
         } catch (error) {
           console.error('Export failed:', error);
           res.statusCode = 500;
           res.end(JSON.stringify({ error: 'Export failed' }));
         }
       }
     },
     '/api/export/all': async () => {
       if (req.method === 'GET') {
         try {
           const data = await exportFullBackup(userId);
           const filename = `backup-${new Date().toISOString().split('T')[0]}.json`;
           res.setHeader('Content-Type', 'application/json');
           res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
           res.statusCode = 200;
           res.end(JSON.stringify(data));
         } catch (error) {
           console.error('Backup export failed:', error);
           res.statusCode = 500;
           res.end(JSON.stringify({ error: 'Backup export failed' }));
         }
       }
     },
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
