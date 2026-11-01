import { RouteParams } from './utils';
import { handleSession, handleProfileUpdate } from './controllers/auth.controller';
import { handleMeters, handleMeterItem } from './controllers/meter.controller';
import { handleReadings, handleBulkReadings, handleReadingItem, exportReadingsAsJson, exportFullBackup, exportUnifiedFormat, handleUnifiedImport } from './controllers/reading.controller';
import { handleContracts, handleContractItem } from './controllers/contract.controller';
import { handleOcrScan } from './controllers/ocr.controller';
import { handleAggregatedRoutes } from './controllers/dashboard.controller';
import {
  handleIntakeSync, handleIntakeVerify, handleConnect, handleCallback, handleIntakeItems,
  handleIntakeItemAction, handleIntakeBills, handleIntakeDocuments, handleProviders,
} from './controllers/intake.controller';

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
    '/api/google/connect': async () => {
      if (req.method === 'GET') { await handleConnect(params); } else { res.statusCode = 405; res.end(JSON.stringify({ error: 'Method not allowed' })); }
    },
    '/api/google/callback': async () => {
      if (req.method === 'GET') { await handleCallback(params); } else { res.statusCode = 405; res.end(JSON.stringify({ error: 'Method not allowed' })); }
    },
    '/api/intake/sync': async () => { if (req.method === 'POST') { await handleIntakeSync(params); } else { res.statusCode = 405; res.end(JSON.stringify({ error: 'Method not allowed' })); } },
    '/api/intake/verify': async () => { if (req.method === 'POST') { await handleIntakeVerify(params); } else { res.statusCode = 405; res.end(JSON.stringify({ error: 'Method not allowed' })); } },
    '/api/readings': async () => handleReadings(params),
    '/api/readings/bulk': async () => handleBulkReadings(params),
    '/api/import/unified': async () => handleUnifiedImport(params),
      '/api/export/readings': async () => {
        if (req.method === 'GET') {
          try {
            const { url: reqUrl } = params;
            const meterId = reqUrl.searchParams.get('meterId') || undefined;
            const data = await exportReadingsAsJson(userId, meterId);
            const filename = meterId ? `readings-${meterId}-export.json` : `all-readings-export.json`;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
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
       '/api/export': async () => {
         if (req.method === 'POST') {
           try {
             const options = req.body as { includeMeters: boolean; includeReadings: boolean; includeContracts: boolean };
             const data = await exportUnifiedFormat(userId, options);
             
             res.setHeader('Content-Type', 'application/json');
             res.statusCode = 200;
             res.end(JSON.stringify(data));
           } catch (error) {
             console.error('Export failed:', error);
             res.statusCode = 500;
             res.end(JSON.stringify({ error: 'Export failed' }));
           }
         } else {
           res.statusCode = 405;
           res.end(JSON.stringify({ error: 'Method not allowed' }));
         }
       },
      '/api/contracts': async () => handleContracts(params),
    '/api/intake/items': async () => {
      if (req.method === 'GET') { await handleIntakeItems(params); } else { res.statusCode = 405; res.end(JSON.stringify({ error: 'Method not allowed' })); }
    },
    '/api/intake/bills': async () => {
      if (req.method === 'GET') { await handleIntakeBills(params); } else { res.statusCode = 405; res.end(JSON.stringify({ error: 'Method not allowed' })); }
    },
    '/api/intake/documents': async () => {
      if (req.method === 'GET') { await handleIntakeDocuments(params); } else { res.statusCode = 405; res.end(JSON.stringify({ error: 'Method not allowed' })); }
    },
    '/api/providers': async () => handleProviders(params),
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
  if (path.startsWith('/api/intake/items/')) { return handleIntakeItemAction(params); }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'Not Found' }));
}
