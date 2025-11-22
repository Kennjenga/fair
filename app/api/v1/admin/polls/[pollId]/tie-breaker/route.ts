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
      
      // Get tied team IDs from request (support both 'tiedTeamIds' and 'teamIds' for compatibility)
      const { tiedTeamIds, teamIds, name, startTime, endTime } = body;
      const tiedTeamIdsArray = tiedTeamIds || teamIds;
      
      if (!tiedTeamIdsArray || !Array.isArray(tiedTeamIdsArray) || tiedTeamIdsArray.length < 2) {
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
      
      // Verify all tied teams exist in the poll
      const teams = await getTeamsByPoll(pollId);
      const validTeamIds = new Set(teams.map(t => t.team_id));
      
      for (const teamId of tiedTeamIdsArray) {
        if (!validTeamIds.has(teamId)) {
          return NextResponse.json(
            { error: `Team ${teamId} not found in original poll` },
            { status: 400 }
          );
        }
      }
      
      // Create tie-breaker poll with same settings as original poll
      const tieBreakerPoll = await createPoll(
        originalPoll.hackathon_id,
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
      
      // Migrate (duplicate) teams from original poll to tie-breaker poll
      // This creates duplicate teams and voters so they can vote again in the tie-breaker
      const { migrateTeams } = await import('@/lib/repositories/teams');
      const migratedTeams = await migrateTeams(pollId, tieBreakerPoll.poll_id, tiedTeamIdsArray);
      
      // Log audit
      await logAudit(
        'tie_breaker_poll_created',
        admin.adminId,
        tieBreakerPoll.poll_id,
        admin.role,
        { 
          parentPollId: pollId,
          tiedTeamIds: tiedTeamIdsArray,
          pollName: tieBreakerPoll.name,
          teamsDuplicated: migratedTeams.length
        },
        getClientIp(req.headers)
      );
      
      return NextResponse.json({ 
        poll: tieBreakerPoll,
        teams: migratedTeams,
        message: 'Tie-breaker poll created successfully with teams and voters duplicated'
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

