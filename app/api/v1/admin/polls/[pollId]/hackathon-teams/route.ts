import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import { getPollById } from '@/lib/repositories/polls';
import { query } from '@/lib/db';
import type { AuthenticatedRequest } from '@/lib/auth/middleware';

/**
 * GET /api/v1/admin/polls/{pollId}/hackathon-teams
 * Get teams from the hackathon that this poll belongs to
 * This allows admins to pull teams from hackathon team_formation submissions
 */
export async function GET(
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
      
      if (admin.role === 'admin' && poll.created_by !== admin.adminId) {
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
      
      // Extract query parameters for search
      const url = new URL(req.url);
      const search = url.searchParams.get('search') || undefined;
      
      // Build WHERE clause for search
      const whereClauses: string[] = ['s.hackathon_id = $1'];
      const paramsArray: unknown[] = [hackathonId];
      let paramIndex = paramsArray.length + 1;
      
      if (search) {
        whereClauses.push(
          `(s.submission_data->>'team_name' ILIKE $${paramIndex})`,
        );
        paramsArray.push(`%${search}%`);
        paramIndex += 1;
      }
      
      const whereSql = whereClauses.join(' AND ');
      
      // Query to extract unique teams from team_formation submissions
      const teamsQuery = `
        WITH team_submissions AS (
          SELECT DISTINCT ON (s.submission_data->>'team_name')
            s.submission_id,
            s.submission_data->>'team_name' as team_name,
            s.submission_data->'team_description' as team_description,
            s.submission_data->'team_members' as team_members,
            s.submitted_by,
            s.submitted_at,
            s.submission_data as full_submission_data
          FROM hackathon_submissions s
          WHERE ${whereSql}
            AND s.submission_data->>'team_name' IS NOT NULL
            AND s.submission_data->>'team_name' != ''
          ORDER BY s.submission_data->>'team_name', s.submitted_at DESC
        )
        SELECT 
          ts.*
        FROM team_submissions ts
        ORDER BY ts.team_name ASC
      `;
      
      const teamsResult = await query(teamsQuery, paramsArray);
      
      // Format teams response with team members
      const teams = teamsResult.rows.map((row: any) => {
        const teamMembers = row.team_members
          ? typeof row.team_members === 'string'
            ? JSON.parse(row.team_members)
            : row.team_members
          : [];
        
        return {
          teamName: row.team_name,
          teamDescription: row.team_description || null,
          teamMembers: Array.isArray(teamMembers) ? teamMembers : [],
          submittedBy: row.submitted_by,
          submittedAt: row.submitted_at,
        };
      });
      
      return NextResponse.json({ teams }, { status: 200 });
    } catch (error) {
      console.error('Get hackathon teams error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}
