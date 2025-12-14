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

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { getDisplayDataService } from '@/services';
import { DisplayDataType } from '@/app/types';

export async function POST(req: NextRequest) {
  // Verify authentication
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { displayType, filters } = body as {
      displayType: DisplayDataType;
      filters?: Record<string, unknown>;
    };

    if (!displayType) {
      return NextResponse.json(
        { error: 'displayType is required' },
        { status: 400 }
      );
    }

    const service = getDisplayDataService();

    // Try to get cached display data
    const cachedData = await service.getDisplayData(session.user.id, displayType, filters);

    if (cachedData) {
      // Cache hit
      return NextResponse.json({
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

      return NextResponse.json({
        data: calculatedData.data,
        cacheHit: false,
        calculatedAt: calculatedData.calculatedAt,
        metadata: calculatedData.metadata,
      });
    }
  } catch (error) {
    console.error('Error fetching display data:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
