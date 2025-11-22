import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import { getPollsByAdmin } from '@/lib/repositories/polls';
import { getHackathonsByAdmin } from '@/lib/repositories/hackathons';
import { query } from '@/lib/db';
import type { AuthenticatedRequest } from '@/lib/auth/middleware';

/**
 * @swagger
 * /api/v1/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard data
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
export async function GET(req: NextRequest) {
  return withAdmin(async (req: AuthenticatedRequest) => {
    try {
      const admin = req.admin!;
      
      // Get admin-specific statistics
      const [
        hackathonsResult,
        pollsResult,
        activePollsResult,
        endedPollsResult,
        upcomingPollsResult,
        votesResult,
        tokensResult,
        usedTokensResult,
        teamsResult,
        judgesResult,
      ] = await Promise.all([
        query<{ count: string }>(
          'SELECT COUNT(*) as count FROM hackathons WHERE created_by = $1',
          [admin.adminId]
        ),
        query<{ count: string }>(
          'SELECT COUNT(*) as count FROM polls WHERE created_by = $1',
          [admin.adminId]
        ),
        query<{ count: string }>(
          `SELECT COUNT(*) as count FROM polls 
           WHERE created_by = $1 
           AND start_time <= CURRENT_TIMESTAMP 
           AND end_time >= CURRENT_TIMESTAMP`,
          [admin.adminId]
        ),
        query<{ count: string }>(
          `SELECT COUNT(*) as count FROM polls 
           WHERE created_by = $1 
           AND end_time < CURRENT_TIMESTAMP`,
          [admin.adminId]
        ),
        query<{ count: string }>(
          `SELECT COUNT(*) as count FROM polls 
           WHERE created_by = $1 
           AND start_time > CURRENT_TIMESTAMP`,
          [admin.adminId]
        ),
        query<{ count: string }>(
          `SELECT COUNT(*) as count FROM votes v
           INNER JOIN polls p ON v.poll_id = p.poll_id
           WHERE p.created_by = $1`,
          [admin.adminId]
        ),
        query<{ count: string }>(
          `SELECT COUNT(*) as count FROM tokens t
           INNER JOIN polls p ON t.poll_id = p.poll_id
           WHERE p.created_by = $1`,
          [admin.adminId]
        ),
        query<{ count: string }>(
          `SELECT COUNT(*) as count FROM tokens t
           INNER JOIN polls p ON t.poll_id = p.poll_id
           WHERE p.created_by = $1 AND t.used = true`,
          [admin.adminId]
        ),
        query<{ count: string }>(
          `SELECT COUNT(*) as count FROM teams t
           INNER JOIN polls p ON t.poll_id = p.poll_id
           WHERE p.created_by = $1`,
          [admin.adminId]
        ),
        query<{ count: string }>(
          `SELECT COUNT(*) as count FROM poll_judges j
           INNER JOIN polls p ON j.poll_id = p.poll_id
           WHERE p.created_by = $1`,
          [admin.adminId]
        ),
      ]);
      
      const stats = {
        totalHackathons: parseInt(hackathonsResult.rows[0].count, 10),
        totalPolls: parseInt(pollsResult.rows[0].count, 10),
        activePolls: parseInt(activePollsResult.rows[0].count, 10),
        endedPolls: parseInt(endedPollsResult.rows[0].count, 10),
        upcomingPolls: parseInt(upcomingPollsResult.rows[0].count, 10),
        totalVotes: parseInt(votesResult.rows[0].count, 10),
        totalTokens: parseInt(tokensResult.rows[0].count, 10),
        usedTokens: parseInt(usedTokensResult.rows[0].count, 10),
        totalTeams: parseInt(teamsResult.rows[0].count, 10),
        totalJudges: parseInt(judgesResult.rows[0].count, 10),
      };
      
      // Get admin's hackathons
      const hackathons = await getHackathonsByAdmin(admin.adminId);
      const allHackathons = hackathons.map(h => ({
        hackathon_id: h.hackathon_id,
        name: h.name,
        description: h.description,
        start_date: h.start_date,
        end_date: h.end_date,
        created_by: h.created_by,
        created_at: h.created_at,
      }));
      
      // Get admin's polls
      const polls = await getPollsByAdmin(admin.adminId);
      const recentPolls = polls.slice(0, 10).map(p => ({
        poll_id: p.poll_id,
        hackathon_id: p.hackathon_id,
        name: p.name,
        start_time: p.start_time,
        end_time: p.end_time,
        voting_mode: p.voting_mode,
        voting_permissions: p.voting_permissions,
        created_by: p.created_by,
        created_at: p.created_at,
        is_tie_breaker: p.is_tie_breaker || false,
      }));
      
      const allPolls = polls.map(p => ({
        poll_id: p.poll_id,
        hackathon_id: p.hackathon_id,
        name: p.name,
        start_time: p.start_time,
        end_time: p.end_time,
        voting_mode: p.voting_mode,
        voting_permissions: p.voting_permissions,
        created_by: p.created_by,
        created_at: p.created_at,
        is_tie_breaker: p.is_tie_breaker || false,
      }));
      
      return NextResponse.json({
        stats,
        recentPolls,
        allPolls,
        allHackathons,
      });
    } catch (error) {
      console.error('Get admin dashboard error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}

