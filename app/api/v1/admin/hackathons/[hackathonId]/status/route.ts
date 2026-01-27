import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { updateHackathonStatus } from '@/lib/repositories/hackathons-extended';
import { lockSubmissions } from '@/lib/repositories/submissions';

/**
 * PATCH /api/v1/admin/hackathons/:id/status
 * Update hackathon status.
 *
 * In the app router, `params` is provided as a Promise, so we explicitly
 * await it before accessing `hackathonId` to avoid runtime errors.
 */
export async function PATCH(
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

    // Parse request body
    const body = await request.json();

    if (!body.status) {
      return NextResponse.json(
        { error: 'Missing required field: status' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['draft', 'live', 'closed', 'finalized'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Update status (this function validates dates and throws error if change is not allowed)
    try {
      const hackathon = await updateHackathonStatus(hackathonId, body.status);

      // If moving to 'closed', lock all submissions
      if (body.status === 'closed') {
        const lockedCount = await lockSubmissions(hackathonId);
        console.log(`Locked ${lockedCount} submissions for hackathon ${hackathonId}`);
      }

      return NextResponse.json({ hackathon }, { status: 200 });
    } catch (statusError: any) {
      // If the error is a validation error (status change not allowed), return 400
      if (statusError.message && (
        statusError.message.includes('Cannot change') ||
        statusError.message.includes('Status change not allowed') ||
        statusError.message.includes('voting closed') ||
        statusError.message.includes('hackathon ended')
      )) {
        return NextResponse.json(
          { error: statusError.message },
          { status: 400 }
        );
      }
      // Re-throw other errors to be handled by outer catch
      throw statusError;
    }
  } catch (error: any) {
    console.error('Error updating hackathon status:', error);
    return NextResponse.json(
      { error: 'Failed to update status', details: error.message },
      { status: 500 }
    );
  }
}
