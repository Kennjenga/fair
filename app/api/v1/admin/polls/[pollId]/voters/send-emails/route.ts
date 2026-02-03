import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import { getPollById, hasPollAccessForAdmin } from '@/lib/repositories/polls';
import { getTokensByPoll } from '@/lib/repositories/tokens';
import { sendVotingTokenEmail } from '@/lib/email/brevo';
import { getTeamsByPoll } from '@/lib/repositories/teams';
import { findTeamByTeamLead } from '@/lib/repositories/submissions';
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
      
      // Check access: admins can access polls they created OR polls in hackathons they created
      const hasAccess = await hasPollAccessForAdmin(poll, admin);
      if (!hasAccess) {
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
      const hackathonId = poll.hackathon_id || undefined;

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
          const plainToken = getPlainTokenFromRecord(tokenRecord);

          if (!plainToken) {
            results.failed++;
            results.errors.push(`${tokenRecord.email}: Plain token not available (token created before migration)`);
            continue;
          }

          const teamNameForEmail = teamMap.get(tokenRecord.team_id) || 'Unknown Team';
          let isTeamLead = false;
          if (hackathonId) {
            const teamInfo = await findTeamByTeamLead(hackathonId, tokenRecord.email);
            isTeamLead = !!(teamInfo && teamInfo.teamName && teamNameForEmail && teamInfo.teamName.trim().toLowerCase() === teamNameForEmail.trim().toLowerCase());
          }

          await sendVotingTokenEmail(
            tokenRecord.email,
            plainToken,
            poll.name,
            teamNameForEmail,
            pollId,
            tokenRecord.team_id,
            { hackathonId, isTeamLead }
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

