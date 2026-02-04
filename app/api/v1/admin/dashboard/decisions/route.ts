import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { getDecisionsCreated, getDecisionsParticipated } from '@/lib/repositories/participation';
import { getEffectiveAdminId } from '@/lib/repositories/admins';
import type { DecisionSummary } from '@/types/participation';
import { isAdminPayload } from '@/types/auth';

/**
 * GET /api/v1/admin/dashboard/decisions
 * Get user's decision participation data with integrity metrics.
 * Integrity status (verifiable/pending) is derived from integrity_commitments table.
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
    // Admin dashboard requires admin JWT (reject voter tokens)
    if (!isAdminPayload(payload)) {
      return NextResponse.json({ error: 'Admin token required' }, { status: 401 });
    }

    const email = payload.email;
    if (!email) {
      console.error('[Dashboard API] Missing email in token payload');
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 });
    }

    // Resolve effective admin_id for "created" so dashboard shows hackathons created by this user.
    // On DB timeout/failure, treat as no admin so we can still return 200 with empty data (graceful degradation).
    let adminId: string | null = null;
    try {
      adminId = await getEffectiveAdminId(payload);
      if (!adminId) {
        console.warn('[Dashboard API] No admin record for token; returning empty created list');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[Dashboard API] getEffectiveAdminId failed (e.g. connection timeout):', msg);
      // Continue with adminId = null so created list is empty; participated may still be fetched below
    }

    // Fetch decisions created (by resolved adminId) and participated (by email) in parallel
    console.log('[Dashboard API] Fetching decisions for adminId:', adminId ?? payload.adminId, 'email:', email);

    const [createdRaw, participatedRaw] = await Promise.all([
      getDecisionsCreated(adminId ?? payload.adminId).catch((err: unknown) => {
        console.error('[Dashboard API] Error fetching decisions created:', err);
        if (err instanceof Error) console.error('[Dashboard API] Stack:', err.stack);
        return [] as DecisionSummary[];
      }),
      getDecisionsParticipated(email).catch((err: unknown) => {
        console.error('[Dashboard API] Error fetching decisions participated:', err);
        if (err instanceof Error) console.error('[Dashboard API] Stack:', err.stack);
        return [] as DecisionSummary[];
      }),
    ]);

    // Return all decisions (no limit) so every hackathon the user created or participated in is visible
    const created: DecisionSummary[] = Array.isArray(createdRaw) ? createdRaw : [];
    const participated: DecisionSummary[] = Array.isArray(participatedRaw) ? participatedRaw : [];

    console.log('[Dashboard API] Decisions created:', created.length, 'participated:', participated.length);

    // Integrity metrics from full lists
    const decisionsInitiated = created.length;
    const decisionsInitiatedVerifiable = created.filter((d) => d.integrityStatus === 'verifiable').length;
    const decisionsParticipatedIn = participated.length;
    const decisionsParticipatedInVerifiable = participated.filter((d) => d.integrityStatus === 'verifiable').length;
    const pendingCommitments = created.filter((d) => d.integrityStatus === 'pending').length;

    // Consistency check: verifiable + pending (for initiated) should equal total initiated
    const initiatedSum = decisionsInitiatedVerifiable + pendingCommitments;
    if (initiatedSum !== decisionsInitiated) {
      console.warn(
        '[Dashboard API] Integrity count mismatch: initiated verifiable + pending =',
        initiatedSum,
        'expected',
        decisionsInitiated
      );
    }

    const integrityMetrics = {
      decisionsInitiated,
      decisionsInitiatedVerifiable,
      decisionsParticipatedIn,
      decisionsParticipatedInVerifiable,
      pendingCommitments,
    };
    console.log('[Dashboard API] Integrity metrics:', JSON.stringify(integrityMetrics));

    return NextResponse.json(
      {
        decisionsCreated: created,
        decisionsParticipated: participated,
        integrityMetrics,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : undefined;
    console.error('[Dashboard API] Unhandled error fetching dashboard decisions:', message, stack);

    return NextResponse.json(
      { error: 'Failed to fetch decisions', details: process.env.NODE_ENV === 'development' ? message : undefined },
      { status: 500 }
    );
  }
}