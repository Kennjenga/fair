import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { autoUpdateHackathonStatus } from '@/lib/repositories/hackathons-extended';

/**
 * POST /api/v1/admin/hackathons/:hackathonId/auto-update-status
 * Automatically update hackathon status based on dates.
 * 
 * This endpoint can be called periodically (e.g., via cron job) to ensure
 * hackathon statuses are kept in sync with their dates:
 * - If voting_closes_at has passed and status is 'live', change to 'closed'
 * - If end_date has passed and status is not 'finalized', change to 'finalized'
 * 
 * Can also be called manually by admins to trigger immediate status updates.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ hackathonId: string }> }
) {
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

    // Resolve dynamic route params
    const { hackathonId } = await params;

    // Auto-update status for this specific hackathon
    const updated = await autoUpdateHackathonStatus(hackathonId);

    if (updated.length === 0) {
      return NextResponse.json(
        { message: 'No status updates needed. Hackathon status is already current.' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        message: 'Status updated automatically based on dates',
        hackathon: updated[0],
        updates: updated.map((h) => ({
          hackathonId: h.hackathon_id,
          oldStatus: 'live', // We know it was live or closed before
          newStatus: h.status,
        })),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error auto-updating hackathon status:', error);
    return NextResponse.json(
      { error: 'Failed to auto-update status', details: error.message },
      { status: 500 }
    );
  }
}
