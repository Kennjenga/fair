import { NextRequest, NextResponse } from 'next/server';
import { withSuperAdmin } from '@/lib/auth/middleware';
import { getAllPolls } from '@/lib/repositories/polls';
import { getAllHackathons } from '@/lib/repositories/hackathons';
import { getAllAdmins } from '@/lib/repositories/admins';
import { query } from '@/lib/db';
import type { AuthenticatedRequest } from '@/lib/auth/middleware';

/**
 * @swagger
 * /api/v1/super-admin/dashboard:
 *   get:
 *     summary: Get platform-wide dashboard data
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 */
export async function GET(req: NextRequest) {
  return withSuperAdmin(async (req: AuthenticatedRequest) => {
    try {
      // Get platform statistics
      const [
        pollsResult,
        hackathonsResult,
        adminsResult,
        votesResult,
        tokensResult,
        activePollsResult,
        endedPollsResult,
        upcomingPollsResult,
        usedTokensResult,
        teamsResult,
        judgesResult,
      ] = await Promise.all([
        query<{ count: string }>('SELECT COUNT(*) as count FROM polls'),
        query<{ count: string }>('SELECT COUNT(*) as count FROM hackathons'),
        query<{ count: string }>('SELECT COUNT(*) as count FROM admins'),
        query<{ count: string }>('SELECT COUNT(*) as count FROM votes'),
        query<{ count: string }>('SELECT COUNT(*) as count FROM tokens'),
        query<{ count: string }>(
          `SELECT COUNT(*) as count FROM polls 
           WHERE start_time <= CURRENT_TIMESTAMP 
           AND end_time >= CURRENT_TIMESTAMP`
        ),
        query<{ count: string }>(
          `SELECT COUNT(*) as count FROM polls 
           WHERE end_time < CURRENT_TIMESTAMP`
        ),
        query<{ count: string }>(
          `SELECT COUNT(*) as count FROM polls 
           WHERE start_time > CURRENT_TIMESTAMP`
        ),
        query<{ count: string }>('SELECT COUNT(*) as count FROM tokens WHERE used = true'),
        query<{ count: string }>('SELECT COUNT(*) as count FROM teams'),
        query<{ count: string }>('SELECT COUNT(*) as count FROM poll_judges'),
      ]);
      
      const stats = {
        totalPolls: parseInt(pollsResult.rows[0].count, 10),
        totalHackathons: parseInt(hackathonsResult.rows[0].count, 10),
        totalAdmins: parseInt(adminsResult.rows[0].count, 10),
        totalVotes: parseInt(votesResult.rows[0].count, 10),
        totalTokens: parseInt(tokensResult.rows[0].count, 10),
        activePolls: parseInt(activePollsResult.rows[0].count, 10),
        endedPolls: parseInt(endedPollsResult.rows[0].count, 10),
        upcomingPolls: parseInt(upcomingPollsResult.rows[0].count, 10),
        usedTokens: parseInt(usedTokensResult.rows[0].count, 10),
        totalTeams: parseInt(teamsResult.rows[0].count, 10),
        totalJudges: parseInt(judgesResult.rows[0].count, 10),
      };
      
      // Get recent polls with hackathon info
      const polls = await getAllPolls();
      const recentPolls = polls.slice(0, 10).map(p => ({
        pollId: p.poll_id,
        hackathonId: p.hackathon_id,
        name: p.name,
        startTime: p.start_time,
        endTime: p.end_time,
        votingMode: p.voting_mode,
        votingPermissions: p.voting_permissions,
        createdBy: p.created_by,
        createdAt: p.created_at,
      }));
      
      // Get all hackathons
      const hackathons = await getAllHackathons();
      const recentHackathons = hackathons.slice(0, 5).map(h => ({
        hackathonId: h.hackathon_id,
        name: h.name,
        description: h.description,
        startDate: h.start_date,
        endDate: h.end_date,
        createdBy: h.created_by,
        createdAt: h.created_at,
      }));
      
      // Get all admins
      const admins = await getAllAdmins();
      
      // Get recent activity from audit logs
      const auditLogs = await query<{
        log_id: string;
        action: string;
        user_id: string | null;
        poll_id: string | null;
        role: string | null;
        timestamp: Date;
      }>(
        `SELECT log_id, action, user_id, poll_id, role, timestamp 
         FROM audit_logs 
         ORDER BY timestamp DESC 
         LIMIT 50`
      );
      
      // Get all polls for filtering
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
        parent_poll_id: p.parent_poll_id,
      }));
      
      // Get all hackathons for filtering
      const allHackathons = hackathons.map(h => ({
        hackathon_id: h.hackathon_id,
        name: h.name,
        description: h.description,
        start_date: h.start_date,
        end_date: h.end_date,
        created_by: h.created_by,
        created_at: h.created_at,
      }));
      
      return NextResponse.json({
        stats,
        recentPolls,
        recentHackathons,
        allPolls,
        allHackathons,
        admins: admins.map(a => ({
          adminId: a.admin_id,
          email: a.email,
          role: a.role,
          createdAt: a.created_at,
        })),
        recentActivity: auditLogs.rows.map(log => ({
          logId: log.log_id,
          action: log.action,
          userId: log.user_id,
          pollId: log.poll_id,
          role: log.role,
          timestamp: log.timestamp,
        })),
      });
    } catch (error) {
      console.error('Get dashboard error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}

