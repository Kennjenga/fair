import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import { getPollById } from '@/lib/repositories/polls';
import { getTokensByPoll, getTokenById } from '@/lib/repositories/tokens';
import { sendVotingTokenEmail } from '@/lib/email/brevo';
import { getTeamsByPoll } from '@/lib/repositories/teams';
import { logAudit, getClientIp } from '@/lib/utils/audit';
import type { AuthenticatedRequest } from '@/lib/auth/middleware';

/**
 * Send voting token emails to all voters who haven't received emails yet
 * @swagger
 * /api/v1/admin/polls/{pollId}/voters/send-emails:
 *   post:
 *     summary: Send voting token emails to voters
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
      
      // Get all tokens for this poll
      const tokens = await getTokensByPoll(pollId);
      
      // Get teams for team name lookup
      const teams = await getTeamsByPoll(pollId);
      const teamMap = new Map(teams.map(t => [t.team_id, t.team_name]));
      
      // Filter tokens that haven't been sent yet (status is 'queued' or 'failed')
      const tokensToSend = tokens.filter(t => 
        (t.delivery_status === 'queued' || t.delivery_status === 'failed') && !t.used
      );
      
      if (tokensToSend.length === 0) {
        return NextResponse.json(
          { message: 'No pending emails to send', sent: 0, failed: 0 },
          { status: 200 }
        );
      }
      
      const { getPlainTokenFromRecord, updateTokenDeliveryStatus } = await import('@/lib/repositories/tokens');
      
      const results = {
        sent: 0,
        failed: 0,
        errors: [] as string[],
      };
      
      // Send emails to all tokens that need to be sent
      for (const tokenRecord of tokensToSend) {
        try {
          // Get plain token from encrypted storage
          const plainToken = getPlainTokenFromRecord(tokenRecord);
          
          if (!plainToken) {
            // Token doesn't have plain token stored (old token created before migration)
            results.failed++;
            results.errors.push(`${tokenRecord.email}: Plain token not available (token created before migration)`);
            continue;
          }
          
          // Send email with plain token
          await sendVotingTokenEmail(
            tokenRecord.email,
            plainToken,
            poll.name,
            teamMap.get(tokenRecord.team_id) || 'Unknown Team'
          );
          
          // Update delivery status
          await updateTokenDeliveryStatus(tokenRecord.token_id, 'sent');
          
          results.sent++;
        } catch (error) {
          console.error(`Failed to send email to ${tokenRecord.email}:`, error);
          await updateTokenDeliveryStatus(
            tokenRecord.token_id,
            'failed',
            error instanceof Error ? error.message : 'Unknown error'
          );
          results.failed++;
          results.errors.push(`${tokenRecord.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      await logAudit(
        'voter_emails_sent',
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
      console.error('Send voter emails error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}

