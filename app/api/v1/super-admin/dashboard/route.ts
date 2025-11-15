import { NextRequest, NextResponse } from 'next/server';
import { withSuperAdmin } from '@/lib/auth/middleware';
import { getAllPolls } from '@/lib/repositories/polls';
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
        adminsResult,
        votesResult,
        tokensResult,
        activePollsResult,
      ] = await Promise.all([
        query<{ count: string }>('SELECT COUNT(*) as count FROM polls'),
        query<{ count: string }>('SELECT COUNT(*) as count FROM admins'),
        query<{ count: string }>('SELECT COUNT(*) as count FROM votes'),
        query<{ count: string }>('SELECT COUNT(*) as count FROM tokens'),
        query<{ count: string }>(
          `SELECT COUNT(*) as count FROM polls 
           WHERE start_time <= CURRENT_TIMESTAMP 
           AND end_time >= CURRENT_TIMESTAMP`
        ),
      ]);
      
      const stats = {
        totalPolls: parseInt(pollsResult.rows[0].count, 10),
        totalAdmins: parseInt(adminsResult.rows[0].count, 10),
        totalVotes: parseInt(votesResult.rows[0].count, 10),
        totalTokens: parseInt(tokensResult.rows[0].count, 10),
        activePolls: parseInt(activePollsResult.rows[0].count, 10),
      };
      
      // Get recent polls
      const polls = await getAllPolls();
      const recentPolls = polls.slice(0, 10);
      
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
      
      return NextResponse.json({
        stats,
        recentPolls: recentPolls.map(p => ({
          pollId: p.poll_id,
          name: p.name,
          startTime: p.start_time,
          endTime: p.end_time,
          createdBy: p.created_by,
          createdAt: p.created_at,
        })),
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

