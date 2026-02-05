import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import { getPollById, hasPollAccessForAdmin } from '@/lib/repositories/polls';
import { getTeamsByPoll } from '@/lib/repositories/teams';
import { findTeamByTeamLead } from '@/lib/repositories/submissions';
import { sendTeamLeadUpdateEmail } from '@/lib/email/brevo';
import { logAudit, getClientIp } from '@/lib/utils/audit';
import type { AuthenticatedRequest } from '@/lib/auth/middleware';

/**
 * POST /api/v1/admin/polls/{pollId}/teams/send-update-emails
 * Send emails to team leads requesting them to update team details
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

      // Get hackathon ID from poll
      const hackathonId = poll.hackathon_id;
      if (!hackathonId) {
        return NextResponse.json(
          { error: 'Poll does not belong to a hackathon' },
          { status: 400 }
        );
      }
      
      // Get all teams for this poll
      const teams = await getTeamsByPoll(pollId);
      
      if (teams.length === 0) {
        return NextResponse.json(
          { message: 'No teams found in this poll', sent: 0, failed: 0 },
          { status: 200 }
        );
      }
      
      const results = {
        sent: 0,
        failed: 0,
        errors: [] as string[],
      };
      
      // For each team, find the team lead from hackathon submissions and send email
      const { query } = await import('@/lib/db');
      
      for (const team of teams) {
        try {
          // Query hackathon submissions to find team_formation submission for this team
          const submissionResult = await query<{
            submission_id: string;
            submission_data: any;
          }>(
            `SELECT submission_id, submission_data 
             FROM hackathon_submissions 
             WHERE hackathon_id = $1 
               AND submission_data->>'team_name' = $2
               AND submission_data->>'team_name' IS NOT NULL
             ORDER BY submitted_at DESC
             LIMIT 1`,
            [hackathonId, team.team_name]
          );
          
          if (submissionResult.rows.length === 0) {
            results.failed++;
            results.errors.push(`${team.team_name}: Team formation submission not found`);
            continue;
          }
          
          const submissionData = submissionResult.rows[0].submission_data;
          const teamMembers = submissionData.team_members || [];
          
          // Find team lead from team members
          let teamLead: any = null;
          if (Array.isArray(teamMembers)) {
            teamLead = teamMembers.find((m: any) => {
              // Check both boolean and string representations
              return m.isLead === true || m.isLead === 'true' || m.isLead === true;
            });
          }
          
          if (!teamLead || !teamLead.email) {
            results.failed++;
            results.errors.push(`${team.team_name}: Team lead email not found in submission`);
            continue;
          }
          
          // Send email to team lead
          await sendTeamLeadUpdateEmail(
            teamLead.email,
            poll.name,
            team.team_name,
            hackathonId,
            pollId,
            teamLead.firstName && teamLead.lastName 
              ? `${teamLead.firstName} ${teamLead.lastName}` 
              : undefined
          );
          
          results.sent++;
        } catch (error) {
          console.error(`Failed to send email for team "${team.team_name}":`, error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          results.failed++;
          results.errors.push(`${team.team_name}: ${errorMessage}`);
        }
      }
      
      await logAudit(
        'team_lead_update_emails_sent',
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
      console.error('Send team lead update emails error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}
