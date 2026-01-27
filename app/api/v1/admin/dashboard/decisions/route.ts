import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { getDecisionsCreated, getDecisionsParticipated } from '@/lib/repositories/participation';

/**
 * GET /api/v1/admin/dashboard/decisions
 * Get user's decision participation data
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const adminId = payload.adminId;

    // Get decisions created and participated in
    const [created, participated] = await Promise.all([
      getDecisionsCreated(adminId),
      getDecisionsParticipated(adminId),
    ]);

    return NextResponse.json(
      {
        decisionsCreated: created,
        decisionsParticipated: participated,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching dashboard decisions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch decisions', details: error.message },
      { status: 500 }
    );
  }
}
