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

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { getEnergyCrudService } from '@/services';
import { EnergyFilters } from '@/app/types';

export async function POST(req: NextRequest) {
  // Verify authentication
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { filters } = body as { filters?: EnergyFilters };
    const service = getEnergyCrudService();
    const data = await service.findAll(session.user.id, filters);

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching energy data:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
