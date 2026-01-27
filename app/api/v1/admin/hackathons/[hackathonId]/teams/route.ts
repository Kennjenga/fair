import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { query } from '@/lib/db';

/**
 * GET /api/v1/admin/hackathons/:hackathonId/teams
 * Get teams extracted from team_formation submissions for a hackathon.
 * Supports pagination (default pageSize=10), search, and filtering.
 * 
 * Teams are extracted from submissions where the submission_data contains
 * team formation information (team_name, team_members, etc.).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hackathonId: string }> },
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Resolve dynamic route params
    const { hackathonId } = await params;

    // Extract query parameters for pagination and filtering
    const url = new URL(request.url);
    const pageParam = url.searchParams.get('page');
    const pageSizeParam = url.searchParams.get('pageSize');
    const search = url.searchParams.get('search') || undefined;

    const page = pageParam ? Number.parseInt(pageParam, 10) : 1;
    const pageSize = pageSizeParam ? Number.parseInt(pageSizeParam, 10) : 10;
    const offset = (page - 1) * pageSize;

    // Build WHERE clause for search
    const whereClauses: string[] = ['s.hackathon_id = $1'];
    const paramsArray: unknown[] = [hackathonId];
    let paramIndex = paramsArray.length + 1;

    if (search) {
      // Search in team_name within submission_data
      whereClauses.push(
        `(s.submission_data->>'team_name' ILIKE $${paramIndex})`,
      );
      paramsArray.push(`%${search}%`);
      paramIndex += 1;
    }

    const whereSql = whereClauses.join(' AND ');

    // Query to extract unique teams from submissions
    // We group by team_name to get unique teams, taking the most recent submission
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
        ts.*,
        -- Get associated project details from project_details submissions
        (
          SELECT ps.submission_data
          FROM hackathon_submissions ps
          WHERE ps.hackathon_id = $1
            AND ps.submission_data->>'team_name' = ts.team_name
            AND ps.submission_data->>'project_name' IS NOT NULL
          ORDER BY ps.submitted_at DESC
          LIMIT 1
        ) as project_data
      FROM team_submissions ts
      ORDER BY ts.team_name ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const teamsResult = await query(teamsQuery, [...paramsArray, pageSize, offset]);

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT s.submission_data->>'team_name') as count
      FROM hackathon_submissions s
      WHERE ${whereSql}
        AND s.submission_data->>'team_name' IS NOT NULL
        AND s.submission_data->>'team_name' != ''
    `;

    const countResult = await query<{ count: string }>(countQuery, paramsArray);
    const total = Number.parseInt(countResult.rows[0]?.count || '0', 10);

    // Format teams response
    const teams = teamsResult.rows.map((row: any) => {
      const teamMembers = row.team_members
        ? typeof row.team_members === 'string'
          ? JSON.parse(row.team_members)
          : row.team_members
        : [];

      const projectData = row.project_data
        ? typeof row.project_data === 'string'
          ? JSON.parse(row.project_data)
          : row.project_data
        : null;

      return {
        submissionId: row.submission_id,
        teamName: row.team_name,
        teamDescription:
          row.team_description && typeof row.team_description === 'string'
            ? row.team_description
            : row.team_description || null,
        teamMembers: Array.isArray(teamMembers) ? teamMembers : [],
        submittedBy: row.submitted_by,
        submittedAt: row.submitted_at,
        // Project details from project_details submissions
        projectName: projectData?.project_name || null,
        problemStatement: projectData?.problem_statement || null,
        solution: projectData?.solution || null,
        githubLink: projectData?.github_link || null,
        liveLink: projectData?.live_link || null,
        pollId: projectData?.poll_id || null,
      };
    });

    return NextResponse.json(
      {
        teams,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams', details: error.message },
      { status: 500 },
    );
  }
}
