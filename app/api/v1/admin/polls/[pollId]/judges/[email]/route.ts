import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import { getPollById, hasPollAccess } from '@/lib/repositories/polls';
import { removeJudgeFromPoll } from '@/lib/repositories/judges';
import { logAudit, getClientIp } from '@/lib/utils/audit';
import type { AuthenticatedRequest } from '@/lib/auth/middleware';

/**
 * @swagger
 * /api/v1/admin/polls/{pollId}/judges/{email}:
 *   delete:
 *     summary: Remove a judge from a poll
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ pollId: string; email: string }> }
) {
  return withAdmin(async (req: AuthenticatedRequest) => {
    try {
      const admin = req.admin!;
      const { pollId, email } = await params;
      
      // Check poll exists and access
      const poll = await getPollById(pollId);
      if (!poll) {
        return NextResponse.json(
          { error: 'Poll not found' },
          { status: 404 }
        );
      }
      
      // Check access: admins can access polls they created OR polls in hackathons they created
      const hasAccess = await hasPollAccess(poll, admin.adminId, admin.role);
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
      
      // Remove judge
      await removeJudgeFromPoll(pollId, decodeURIComponent(email));
      
      // Log audit
      await logAudit(
        'judge_removed',
        admin.adminId,
        pollId,
        admin.role,
        { judgeEmail: decodeURIComponent(email) },
        getClientIp(req.headers)
      );
      
      return NextResponse.json({ message: 'Judge removed successfully' });
    } catch (error) {
      console.error('Remove judge error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}

