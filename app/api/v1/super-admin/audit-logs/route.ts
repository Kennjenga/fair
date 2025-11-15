import { NextRequest, NextResponse } from 'next/server';
import { withSuperAdmin } from '@/lib/auth/middleware';
import { query } from '@/lib/db';
import type { AuthenticatedRequest } from '@/lib/auth/middleware';

/**
 * @swagger
 * /api/v1/super-admin/audit-logs:
 *   get:
 *     summary: Get audit logs
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: pollId
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 */
export async function GET(req: NextRequest) {
  return withSuperAdmin(async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const userId = searchParams.get('userId');
      const pollId = searchParams.get('pollId');
      const action = searchParams.get('action');
      const limit = parseInt(searchParams.get('limit') || '100', 10);
      
      let queryText = `
        SELECT log_id, action, user_id, poll_id, role, details, ip_address, timestamp
        FROM audit_logs
        WHERE 1=1
      `;
      const params: unknown[] = [];
      let paramIndex = 1;
      
      if (userId) {
        queryText += ` AND user_id = $${paramIndex++}`;
        params.push(userId);
      }
      
      if (pollId) {
        queryText += ` AND poll_id = $${paramIndex++}`;
        params.push(pollId);
      }
      
      if (action) {
        queryText += ` AND action = $${paramIndex++}`;
        params.push(action);
      }
      
      queryText += ` ORDER BY timestamp DESC LIMIT $${paramIndex}`;
      params.push(limit);
      
      const result = await query<{
        log_id: string;
        action: string;
        user_id: string | null;
        poll_id: string | null;
        role: string | null;
        details: Record<string, unknown> | null;
        ip_address: string | null;
        timestamp: Date;
      }>(queryText, params);
      
      return NextResponse.json({
        logs: result.rows.map(log => ({
          logId: log.log_id,
          action: log.action,
          userId: log.user_id,
          pollId: log.poll_id,
          role: log.role,
          details: log.details,
          ipAddress: log.ip_address,
          timestamp: log.timestamp,
        })),
        count: result.rows.length,
      });
    } catch (error) {
      console.error('Get audit logs error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}

