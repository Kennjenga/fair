import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import { getPollById, createPoll } from '@/lib/repositories/polls';
import { getVotesByPoll } from '@/lib/repositories/votes';
import { getTeamsByPoll, getTeamById } from '@/lib/repositories/teams';
import { calculatePollResults } from '@/lib/utils/results';
import { logAudit, getClientIp } from '@/lib/utils/audit';
import type { AuthenticatedRequest } from '@/lib/auth/middleware';

/**
 * Create a tie-breaker poll for tied teams
 * @swagger
 * /api/v1/admin/polls/{pollId}/tie-breaker:
 *   post:
 *     summary: Create tie-breaker poll for tied teams
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
      const body = await req.json();
      
      // Get tied team IDs from request
      const { tiedTeamIds, name, startTime, endTime } = body;
      
      if (!tiedTeamIds || !Array.isArray(tiedTeamIds) || tiedTeamIds.length < 2) {
        return NextResponse.json(
          { error: 'At least 2 tied team IDs are required' },
          { status: 400 }
        );
      }
      
      if (!name || !startTime || !endTime) {
        return NextResponse.json(
          { error: 'Poll name, start time, and end time are required' },
          { status: 400 }
        );
      }
      
      // Check original poll exists and access
      const originalPoll = await getPollById(pollId);
      if (!originalPoll) {
        return NextResponse.json(
          { error: 'Original poll not found' },
          { status: 404 }
        );
      }
      
      if (admin.role === 'admin' && originalPoll.created_by !== admin.adminId) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
      
      // Verify all tied teams exist and belong to the same hackathon
      const teams = await getTeamsByPoll(pollId);
      const validTeamIds = new Set(teams.map(t => t.team_id));
      
      for (const teamId of tiedTeamIds) {
        if (!validTeamIds.has(teamId)) {
          return NextResponse.json(
            { error: `Team ${teamId} not found in original poll` },
            { status: 400 }
          );
        }
      }
      
      // Get the first team to find hackathon_id
      const firstTeam = teams.find(t => t.team_id === tiedTeamIds[0]);
      if (!firstTeam) {
        return NextResponse.json(
          { error: 'Failed to find hackathon for teams' },
          { status: 500 }
        );
      }
      
      // Create tie-breaker poll with same settings as original poll
      const tieBreakerPoll = await createPoll(
        firstTeam.hackathon_id,
        name,
        new Date(startTime),
        new Date(endTime),
        admin.adminId,
        originalPoll.voting_mode,
        originalPoll.voting_permissions,
        originalPoll.voter_weight,
        originalPoll.judge_weight,
        originalPoll.rank_points_config,
        originalPoll.allow_self_vote,
        originalPoll.require_team_name_gate,
        originalPoll.is_public_results,
        originalPoll.max_ranked_positions,
        originalPoll.voting_sequence,
        pollId, // Set parent_poll_id
        true // Mark as tie-breaker
      );
      
      // Create teams for tied teams in the tie-breaker poll
      const { createTeam } = await import('@/lib/repositories/teams');
      const createdTeams = [];
      
      for (const teamId of tiedTeamIds) {
        const team = teams.find(t => t.team_id === teamId);
        if (team) {
          try {
            const newTeam = await createTeam(
              firstTeam.hackathon_id,
              team.team_name,
              team.metadata || undefined, // Convert null to undefined
              {
                projectName: team.project_name || undefined,
                projectDescription: team.project_description || undefined,
                pitch: team.pitch || undefined,
                liveSiteUrl: team.live_site_url || undefined,
                githubUrl: team.github_url || undefined,
              }
            );
            createdTeams.push(newTeam);
          } catch (error) {
            console.error(`Failed to create team ${team.team_name} in tie-breaker poll:`, error);
            // Continue with other teams
          }
        }
      }
      
      // Log audit
      await logAudit(
        'tie_breaker_poll_created',
        admin.adminId,
        tieBreakerPoll.poll_id,
        admin.role,
        { 
          parentPollId: pollId,
          tiedTeamIds,
          pollName: tieBreakerPoll.name,
          teamsCreated: createdTeams.length
        },
        getClientIp(req.headers)
      );
      
      return NextResponse.json({ 
        poll: tieBreakerPoll,
        teams: createdTeams,
        message: 'Tie-breaker poll created successfully'
      }, { status: 201 });
    } catch (error) {
      console.error('Create tie-breaker poll error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}

