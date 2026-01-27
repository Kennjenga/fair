import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import { getPollById, hasPollAccess } from '@/lib/repositories/polls';
import { getJudgesByPoll, updateJudgeEmailStatus } from '@/lib/repositories/judges';
import { sendJudgeInvitationEmail } from '@/lib/email/brevo';
import { logAudit, getClientIp } from '@/lib/utils/audit';
import type { AuthenticatedRequest } from '@/lib/auth/middleware';

/**
 * Send judge invitation emails to all judges
 * @swagger
 * /api/v1/admin/polls/{pollId}/judges/send-emails:
 *   post:
 *     summary: Send judge invitation emails
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  return withAdmin(async (req: AuthenticatedRequest) => {
    try {
      const admin = req.admin!;
      const { pollId } = await params;

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

      // Get all judges for this poll
      const judges = await getJudgesByPoll(pollId);

      if (judges.length === 0) {
        return NextResponse.json(
          { message: 'No judges to send emails to', sent: 0, failed: 0 },
          { status: 200 }
        );
      }

      // Filter judges that need emails sent (queued or failed status)
      const judgesToSend = judges.filter(j => 
        j.email_status === 'queued' || j.email_status === 'failed'
      );

      if (judgesToSend.length === 0) {
        return NextResponse.json(
          { message: 'No pending emails to send', sent: 0, failed: 0 },
          { status: 200 }
        );
      }

      const results = {
        sent: 0,
        failed: 0,
        errors: [] as string[],
      };

      // Send emails to judges that need them
      for (const judge of judgesToSend) {
        try {
          await sendJudgeInvitationEmail(
            judge.email,
            poll.name,
            pollId,
            judge.name || undefined
          );

          // Update email status to sent
          await updateJudgeEmailStatus(pollId, judge.email, 'sent');
          results.sent++;
        } catch (error) {
          console.error(`Failed to send email to ${judge.email}:`, error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          await updateJudgeEmailStatus(pollId, judge.email, 'failed', errorMessage);
          results.failed++;
          results.errors.push(`${judge.email}: ${errorMessage}`);
        }
      }

      await logAudit(
        'judge_emails_sent',
        admin.adminId,
        pollId,
        admin.role,
        { sent: results.sent, failed: results.failed },
        getClientIp(req.headers)
      );

      return NextResponse.json({
        message: `Emails sent: ${results.sent}, Failed: ${results.failed}`,
        sent: results.sent,
        failed: results.failed,
        errors: results.errors.length > 0 ? results.errors : undefined,
      });
    } catch (error) {
      console.error('Send judge emails error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}

