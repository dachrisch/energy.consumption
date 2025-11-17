/**
 * /api/v2/energy - New backend API route using Services Layer
 *
 * This route uses the new architecture:
 * - EnergyCrudService for CRUD operations
 * - Automatic event emission
 * - Automatic cache invalidation
 *
 * Replaces direct Mongoose calls with service layer abstraction.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getEnergyCrudService } from '@/services';
import { EnergyOptions } from '@/app/types';

// Initialize server infrastructure
import '@/lib/serverInit';

/**
 * GET /api/v2/energy
 * Fetch energy readings using new services layer
 *
 * Query params:
 * - type: 'power' | 'gas' (optional)
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 * - limit: number (optional, default 1000)
 * - offset: number (optional, default 0)
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as EnergyOptions | null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '1000');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get service instance
    const service = getEnergyCrudService();

    // Build filters
    const filters: any = {};
    if (type) filters.type = type;
    if (limit) filters.limit = limit;
    if (offset) filters.offset = offset;

    // Fetch data using service
    let readings;
    if (startDate && endDate) {
      readings = await service.findByDateRange(
        session.user.id,
        new Date(startDate),
        new Date(endDate),
        type || undefined
      );
    } else {
      readings = await service.findAll(session.user.id, filters);
    }

    return NextResponse.json({
      success: true,
      data: readings,
      meta: {
        count: readings.length,
        backend: 'new',
      },
    });
  } catch (error) {
    console.error('[API v2/energy GET] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch energy data',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v2/energy
 * Create new energy reading using services layer
 *
 * Body:
 * {
 *   type: 'power' | 'gas',
 *   date: ISO date string,
 *   amount: number
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
    const { type, date, amount } = body;

    // Validation
    if (!type || !date || amount === undefined) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: type, date, amount' },
        { status: 400 }
      );
    }

    // Get service instance
    const service = getEnergyCrudService();

    // Create reading (automatically emits CREATED event)
    const reading = await service.create({
      userId: session.user.id,
      type,
      date: new Date(date),
      amount,
    });

    return NextResponse.json({
      success: true,
      data: reading,
      meta: {
        backend: 'new',
        eventEmitted: true,
      },
    });
  } catch (error) {
    console.error('[API v2/energy POST] Error:', error);

    // Handle duplicate key error
    if (error instanceof Error && error.message.includes('duplicate')) {
      return NextResponse.json(
        { success: false, message: 'Reading already exists for this date and type' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create energy reading',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v2/energy/:id
 * Update energy reading using services layer
 *
 * Body:
 * {
 *   id: string,
 *   amount?: number,
 *   date?: ISO date string,
 *   type?: 'power' | 'gas'
 * }
 */
export async function PUT(request: NextRequest) {
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
    const { id, amount, date, type } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Missing required field: id' },
        { status: 400 }
      );
    }

    // Get service instance
    const service = getEnergyCrudService();

    // Build update object
    const updates: any = {};
    if (amount !== undefined) updates.amount = amount;
    if (date) updates.date = new Date(date);
    if (type) updates.type = type;

    // Update reading (automatically emits UPDATED event)
    const updated = await service.update(id, session.user.id, updates);

    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'Reading not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
      meta: {
        backend: 'new',
        eventEmitted: true,
      },
    });
  } catch (error) {
    console.error('[API v2/energy PUT] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update energy reading',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v2/energy/:id
 * Delete energy reading using services layer
 *
 * Query params:
 * - id: string (required)
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

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Missing required query param: id' },
        { status: 400 }
      );
    }

    // Get service instance
    const service = getEnergyCrudService();

    // Delete reading (automatically emits DELETED event)
    const deleted = await service.delete(id, session.user.id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'Reading not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Reading deleted successfully',
      meta: {
        backend: 'new',
        eventEmitted: true,
      },
    });
  } catch (error) {
    console.error('[API v2/energy DELETE] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete energy reading',
      },
      { status: 500 }
    );
  }
}
