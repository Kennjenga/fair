import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import { getPollById, hasPollAccess } from '@/lib/repositories/polls';
import { getTeamsByPoll, createTeam } from '@/lib/repositories/teams';
import { bulkCreateTokens } from '@/lib/repositories/tokens';
import { query } from '@/lib/db';
import { logAudit, getClientIp } from '@/lib/utils/audit';
import type { AuthenticatedRequest } from '@/lib/auth/middleware';

/**
 * POST /api/v1/admin/polls/{pollId}/auto-populate-voters
 * Automatically populate voters from team members in hackathon teams
 * This will:
 * 1. Get teams from hackathon team_formation submissions
 * 2. Create teams in the poll if they don't exist
 * 3. Create voter tokens for all team members with correct team association
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
      
      // Get hackathon ID from poll
      const hackathonId = poll.hackathon_id;
      if (!hackathonId) {
        return NextResponse.json(
          { error: 'Poll does not belong to a hackathon' },
          { status: 400 }
        );
      }
      
      // Get existing teams in the poll
      const existingPollTeams = await getTeamsByPoll(pollId);
      const existingTeamNames = new Set(existingPollTeams.map(t => t.team_name));
      
      // Get teams from hackathon team_formation submissions
      const teamsQuery = `
        WITH team_submissions AS (
          SELECT DISTINCT ON (s.submission_data->>'team_name')
            s.submission_data->>'team_name' as team_name,
            s.submission_data->'team_members' as team_members,
            s.submission_data->'team_description' as team_description
          FROM hackathon_submissions s
          WHERE s.hackathon_id = $1
            AND s.submission_data->>'team_name' IS NOT NULL
            AND s.submission_data->>'team_name' != ''
          ORDER BY s.submission_data->>'team_name', s.submitted_at DESC
        )
        SELECT 
          ts.team_name,
          ts.team_members,
          ts.team_description
        FROM team_submissions ts
        ORDER BY ts.team_name ASC
      `;
      
      const teamsResult = await query(teamsQuery, [hackathonId]);
      
      // Process teams and create missing ones in the poll
      const teamsCreated: string[] = [];
      const votersToCreate: Array<{ email: string; teamId: string }> = [];
      const teamNameToIdMap = new Map<string, string>();
      
      // First, map existing teams
      for (const team of existingPollTeams) {
        teamNameToIdMap.set(team.team_name, team.team_id);
      }
      
      // Process each hackathon team
      for (const row of teamsResult.rows) {
        // Type assertion: team_name from query is always a string
        const teamName = row.team_name as string;
        const teamMembers = row.team_members
          ? typeof row.team_members === 'string'
            ? JSON.parse(row.team_members)
            : row.team_members
          : [];
        
        // Create team in poll if it doesn't exist
        let teamId = teamNameToIdMap.get(teamName);
        if (!teamId) {
          try {
            const newTeam = await createTeam(pollId, teamName, {
              teamDescription: row.team_description || null,
            });
            teamId = newTeam.team_id;
            teamNameToIdMap.set(teamName, teamId);
            teamsCreated.push(teamName);
          } catch (error: any) {
            // Team might already exist (race condition), try to get it
            const pollTeams = await getTeamsByPoll(pollId);
            const foundTeam = pollTeams.find(t => t.team_name === teamName);
            if (foundTeam) {
              teamId = foundTeam.team_id;
              teamNameToIdMap.set(teamName, teamId);
            } else {
              console.error(`Failed to create team "${teamName}":`, error);
              continue;
            }
          }
        }
        
        // Add all team members as voters
        for (const member of teamMembers) {
          if (member.email && member.email.trim()) {
            votersToCreate.push({
              email: member.email.trim(),
              teamId: teamId!,
            });
          }
        }
      }
      
      // Create tokens for all voters
      const tokenResults = await bulkCreateTokens(
        pollId,
        votersToCreate
      );
      
      await logAudit(
        'voters_auto_populated',
        admin.adminId,
        pollId,
        admin.role,
        { 
          teamsCreated: teamsCreated.length,
          votersCreated: tokenResults.length,
        },
        getClientIp(req.headers)
      );
      
      return NextResponse.json(
        {
          message: 'Voters auto-populated successfully',
          teamsCreated: teamsCreated.length,
          votersCreated: tokenResults.length,
          teams: teamsCreated,
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('Auto-populate voters error:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}
