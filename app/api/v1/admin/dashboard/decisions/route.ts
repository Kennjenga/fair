import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { getDecisionsCreated, getDecisionsParticipated } from '@/lib/repositories/participation';

/**
 * GET /api/v1/admin/dashboard/decisions
 * Get user's decision participation data with integrity metrics
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
    const email = payload.email;

    // Get decisions created and participated in
    // Created: Use adminId to get all decision types (hackathons, polls, etc.)
    // Participated: Use email to get all participations
    console.log('[Dashboard API] Fetching decisions for adminId:', adminId, 'email:', email);
    
    const [created, participated] = await Promise.all([
      getDecisionsCreated(adminId).catch((err) => {
        console.error('[Dashboard API] Error fetching decisions created:', err);
        console.error('[Dashboard API] Error stack:', err.stack);
        return [];
      }),
      getDecisionsParticipated(email).catch((err) => {
        console.error('[Dashboard API] Error fetching decisions participated:', err);
        console.error('[Dashboard API] Error stack:', err.stack);
        return [];
      }),
    ]);

    console.log('[Dashboard API] Found decisions created:', created.length);
    console.log('[Dashboard API] Found decisions participated:', participated.length);

    // Calculate integrity metrics
    const decisionsInitiated = created.length;
    const decisionsInitiatedVerifiable = created.filter(d => d.integrityStatus === 'verifiable').length;
    const decisionsParticipatedIn = participated.length;
    const decisionsParticipatedInVerifiable = participated.filter(d => d.integrityStatus === 'verifiable').length;
    
    // Count pending commitments (decisions with pending integrity state)
    const pendingCommitments = created.filter(d => d.integrityState === 'pending').length;

    return NextResponse.json(
      {
        decisionsCreated: created,
        decisionsParticipated: participated,
        integrityMetrics: {
          decisionsInitiated,
          decisionsInitiatedVerifiable,
          decisionsParticipatedIn,
          decisionsParticipatedInVerifiable,
          pendingCommitments,
        },
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