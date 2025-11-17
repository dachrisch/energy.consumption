/**
 * API Route: /api/v2/energy
 *
 * Provides access to energy data via the new service layer.
 * Supports feature flag-based gradual migration from old backend.
 *
 * Methods:
 * - POST: Fetch energy readings with optional filters
 *
 * Authentication: Required (NextAuth session)
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { getEnergyCrudService } from '@/services';
import { EnergyFilters } from '@/app/types';

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
    const { filters } = req.body as { filters?: EnergyFilters };
    const service = getEnergyCrudService();
    const data = await service.findAll(session.user.id, filters);

    return res.status(200).json({ data });
  } catch (error) {
    console.error('Error fetching energy data:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
