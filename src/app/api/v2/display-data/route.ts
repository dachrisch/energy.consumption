/**
 * /api/v2/display-data - Display Data Cache API Route
 *
 * This route provides access to pre-calculated display data using:
 * - DisplayDataCalculationService for calculations
 * - DisplayEnergyData collection for caching
 * - Automatic cache hit/miss tracking
 *
 * Benefits:
 * - 5-10x faster than calculating on-demand
 * - Reduced database load
 * - Automatic invalidation via event system
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getDisplayDataService } from '@/services';
import { EnergyOptions } from '@/app/types';

// Initialize server infrastructure
import '@/lib/serverInit';

export type DisplayDataType = 'monthly-chart' | 'histogram' | 'table';

/**
 * POST /api/v2/display-data
 * Fetch pre-calculated display data (with cache)
 *
 * Body:
 * {
 *   displayType: 'monthly-chart' | 'histogram' | 'table',
 *   filters: {
 *     type?: 'power' | 'gas',
 *     year?: number,
 *     bucketCount?: number
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse body
    const body = await request.json();
    const { displayType, filters = {} } = body;

    if (!displayType) {
      return NextResponse.json(
        { success: false, message: 'Missing required field: displayType' },
        { status: 400 }
      );
    }

    // Get service instance
    const service = getDisplayDataService();

    // Route to appropriate calculation method
    let data;
    let cacheHit = false;

    switch (displayType) {
      case 'monthly-chart': {
        const type = (filters.type as EnergyOptions) || 'power';
        const year = filters.year || new Date().getFullYear();

        // Calculate (uses cache if available)
        data = await service.calculateMonthlyChartData(session.user.id, type, year);

        // Cache hit if calculated less than 5 seconds ago
        if (data.calculatedAt) {
          const ageMs = Date.now() - new Date(data.calculatedAt).getTime();
          cacheHit = ageMs < 5000;
        }
        break;
      }

      case 'histogram': {
        const type = (filters.type as EnergyOptions) || 'power';
        const bucketCount = filters.bucketCount || 100;

        // Calculate (uses cache if available)
        data = await service.calculateHistogramData(session.user.id, type, bucketCount);

        // Cache hit if calculated less than 5 seconds ago
        if (data.calculatedAt) {
          const ageMs = Date.now() - new Date(data.calculatedAt).getTime();
          cacheHit = ageMs < 5000;
        }
        break;
      }

      case 'table': {
        // For table data, fetch from source readings (no pre-calculation yet)
        const { getEnergyCrudService } = await import('@/services');
        const crudService = getEnergyCrudService();

        const readings = await crudService.findAll(session.user.id, {
          type: filters.type as EnergyOptions | undefined,
          limit: filters.limit || 1000,
          offset: filters.offset || 0,
        });

        data = readings;
        cacheHit = false; // No cache for table data yet
        break;
      }

      default:
        return NextResponse.json(
          { success: false, message: `Unknown display type: ${displayType}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data,
      cacheHit,
      meta: {
        displayType,
        backend: 'new',
        calculatedAt: data.calculatedAt || new Date(),
      },
    });
  } catch (error) {
    console.error('[API v2/display-data POST] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch display data',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v2/display-data
 * Invalidate display data cache for user
 *
 * Query params:
 * - all: 'true' to invalidate all cached data for user
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get service instance
    const service = getDisplayDataService();

    // Invalidate all cached data for user
    const deletedCount = await service.invalidateAllForUser(session.user.id);

    return NextResponse.json({
      success: true,
      message: `Invalidated ${deletedCount} cached items`,
      meta: {
        deletedCount,
        backend: 'new',
      },
    });
  } catch (error) {
    console.error('[API v2/display-data DELETE] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to invalidate cache',
      },
      { status: 500 }
    );
  }
}
