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
        // Get poll counts - include polls created by admin AND polls in hackathons they created
        query<{ count: string }>(
          `SELECT COUNT(DISTINCT p.poll_id) as count 
           FROM polls p
           LEFT JOIN hackathons h ON p.hackathon_id = h.hackathon_id
           WHERE p.created_by = $1 OR h.created_by = $1`,
          [admin.adminId]
        ),
        query<{ count: string }>(
          `SELECT COUNT(DISTINCT p.poll_id) as count 
           FROM polls p
           LEFT JOIN hackathons h ON p.hackathon_id = h.hackathon_id
           WHERE (p.created_by = $1 OR h.created_by = $1)
           AND p.start_time <= CURRENT_TIMESTAMP 
           AND p.end_time >= CURRENT_TIMESTAMP`,
          [admin.adminId]
        ),
        query<{ count: string }>(
          `SELECT COUNT(DISTINCT p.poll_id) as count 
           FROM polls p
           LEFT JOIN hackathons h ON p.hackathon_id = h.hackathon_id
           WHERE (p.created_by = $1 OR h.created_by = $1)
           AND p.end_time < CURRENT_TIMESTAMP`,
          [admin.adminId]
        ),
        query<{ count: string }>(
          `SELECT COUNT(DISTINCT p.poll_id) as count 
           FROM polls p
           LEFT JOIN hackathons h ON p.hackathon_id = h.hackathon_id
           WHERE (p.created_by = $1 OR h.created_by = $1)
           AND p.start_time > CURRENT_TIMESTAMP`,
          [admin.adminId]
        ),
        query<{ count: string }>(
          `SELECT COUNT(*) as count FROM votes v
           INNER JOIN polls p ON v.poll_id = p.poll_id
           LEFT JOIN hackathons h ON p.hackathon_id = h.hackathon_id
           WHERE p.created_by = $1 OR h.created_by = $1`,
          [admin.adminId]
        ),
        query<{ count: string }>(
          `SELECT COUNT(*) as count FROM tokens t
           INNER JOIN polls p ON t.poll_id = p.poll_id
           LEFT JOIN hackathons h ON p.hackathon_id = h.hackathon_id
           WHERE p.created_by = $1 OR h.created_by = $1`,
          [admin.adminId]
        ),
        query<{ count: string }>(
          `SELECT COUNT(*) as count FROM tokens t
           INNER JOIN polls p ON t.poll_id = p.poll_id
           LEFT JOIN hackathons h ON p.hackathon_id = h.hackathon_id
           WHERE (p.created_by = $1 OR h.created_by = $1) AND t.used = true`,
          [admin.adminId]
        ),
        query<{ count: string }>(
          `SELECT COUNT(*) as count FROM teams t
           INNER JOIN polls p ON t.poll_id = p.poll_id
           LEFT JOIN hackathons h ON p.hackathon_id = h.hackathon_id
           WHERE p.created_by = $1 OR h.created_by = $1`,
          [admin.adminId]
        ),
        query<{ count: string }>(
          `SELECT COUNT(*) as count FROM poll_judges j
           INNER JOIN polls p ON j.poll_id = p.poll_id
           LEFT JOIN hackathons h ON p.hackathon_id = h.hackathon_id
           WHERE p.created_by = $1 OR h.created_by = $1`,
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
      
      // Get admin's polls - include polls they created AND polls in hackathons they created
      const pollsCreatedByAdmin = await getPollsByAdmin(admin.adminId);
      
      // Get polls from hackathons created by this admin
      const hackathonsCreatedByAdmin = await getHackathonsByAdmin(admin.adminId);
      const hackathonIds = hackathonsCreatedByAdmin.map(h => h.hackathon_id);
      
      let pollsFromHackathons: any[] = [];
      if (hackathonIds.length > 0) {
        const { getPollsByHackathon } = await import('@/lib/repositories/polls');
        const allHackathonPolls = await Promise.all(
          hackathonIds.map(id => getPollsByHackathon(id))
        );
        pollsFromHackathons = allHackathonPolls.flat();
      }
      
      // Combine and deduplicate polls (a poll might be both created by admin and in their hackathon)
      const pollMap = new Map<string, any>();
      
      // Add polls created by admin
      pollsCreatedByAdmin.forEach(p => {
        pollMap.set(p.poll_id, p);
      });
      
      // Add polls from hackathons (won't overwrite if already exists)
      pollsFromHackathons.forEach(p => {
        if (!pollMap.has(p.poll_id)) {
          pollMap.set(p.poll_id, p);
        }
      });
      
      const allPollsArray = Array.from(pollMap.values());
      
      // Sort by created_at descending
      allPollsArray.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      const recentPolls = allPollsArray.slice(0, 10).map(p => ({
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
      
      const allPolls = allPollsArray.map(p => ({
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

