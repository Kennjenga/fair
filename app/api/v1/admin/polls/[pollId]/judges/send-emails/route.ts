import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import { getPollById } from '@/lib/repositories/polls';
import { getJudgesByPoll } from '@/lib/repositories/judges';
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
      
      if (admin.role === 'admin' && poll.created_by !== admin.adminId) {
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
      
      const results = {
        sent: 0,
        failed: 0,
        errors: [] as string[],
      };
      
      // Send emails to all judges
      for (const judge of judges) {
        try {
          await sendJudgeInvitationEmail(
            judge.email,
            poll.name,
            pollId,
            judge.name || undefined
          );
          
          results.sent++;
        } catch (error) {
          console.error(`Failed to send email to ${judge.email}:`, error);
          results.failed++;
          results.errors.push(`${judge.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

