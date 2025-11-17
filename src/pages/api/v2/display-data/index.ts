/**
 * API Route: /api/v2/display-data
 *
 * Provides access to pre-calculated display data (cache).
 * Returns cached data if available, otherwise calculates on-demand.
 *
 * Methods:
 * - POST: Get display data (with cache check)
 *
 * Authentication: Required (NextAuth session)
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { getDisplayDataService } from '@/services';
import { DisplayDataType } from '@/app/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { displayType, filters } = req.body as {
      displayType: DisplayDataType;
      filters?: Record<string, unknown>;
    };

    if (!displayType) {
      return res.status(400).json({ error: 'displayType is required' });
    }

    const service = getDisplayDataService();

    // Try to get cached display data
    const cachedData = await service.getDisplayData(session.user.id, displayType, filters);

    if (cachedData) {
      // Cache hit
      return res.status(200).json({
        data: cachedData.data,
        cacheHit: true,
        calculatedAt: cachedData.calculatedAt,
        metadata: cachedData.metadata,
      });
    } else {
      // Cache miss - calculate on-demand
      const calculatedData = await service.calculateDisplayData(
        session.user.id,
        displayType,
        filters
      );

      return res.status(200).json({
        data: calculatedData.data,
        cacheHit: false,
        calculatedAt: calculatedData.calculatedAt,
        metadata: calculatedData.metadata,
      });
    }
  } catch (error) {
    console.error('Error fetching display data:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
