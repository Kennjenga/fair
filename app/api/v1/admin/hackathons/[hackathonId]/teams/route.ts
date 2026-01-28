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
      // Search in team_name (both snake_case and camelCase) or team member names within submission_data
      // Note: This will be replaced in the query to use the normalized CTE
      whereClauses.push(
        `(
          s.submission_data_jsonb->>'team_name' ILIKE $${paramIndex}
          OR s.submission_data_jsonb->>'teamName' ILIKE $${paramIndex}
          OR EXISTS (
            SELECT 1
            FROM jsonb_array_elements(s.submission_data_jsonb->'team_members') AS member
            WHERE (member->>'firstName' || ' ' || member->>'lastName') ILIKE $${paramIndex}
               OR member->>'email' ILIKE $${paramIndex}
          )
        )`,
      );
      paramsArray.push(`%${search}%`);
      paramIndex += 1;
    }

    const whereSql = whereClauses.join(' AND ');

    // Remove debug query - it's causing issues and not needed
    // The main query below handles everything correctly

    // Query to extract unique teams from submissions
    // Find all submissions with team_name OR team_members (from forms or CSV imports)
    // Handle both 'team_name' and 'teamName' field name variations
    // Some submissions might have team_members but no team_name, so we handle both cases
    // Normalize submission_data to JSONB first using a CTE to handle TEXT columns
    const teamsQuery = `
      WITH normalized_submissions AS (
        SELECT 
          s.*,
          -- Cast to text first, then to jsonb - works for both TEXT and JSONB columns
          (s.submission_data::text)::jsonb as submission_data_jsonb
        FROM hackathon_submissions s
      ),
      all_team_submissions AS (
        SELECT 
          s.submission_id,
          COALESCE(
            -- Try team_name first (snake_case - most common)
            NULLIF(s.submission_data_jsonb->>'team_name', ''),
            -- Try teamName (camelCase - some forms might use this)
            NULLIF(s.submission_data_jsonb->>'teamName', ''),
            -- Generate team name from first member if team_name is missing
            CASE 
              WHEN s.submission_data_jsonb->'team_members' IS NOT NULL 
                AND jsonb_array_length(s.submission_data_jsonb->'team_members') > 0
              THEN (
                SELECT COALESCE(
                  NULLIF(member->>'firstName', '') || ' ' || NULLIF(member->>'lastName', ''),
                  member->>'email',
                  'Team Member'
                )
                FROM jsonb_array_elements(s.submission_data_jsonb->'team_members') AS member
                WHERE (member->>'isLead')::boolean = true
                LIMIT 1
              ) || '''s Team'
              ELSE 'Unnamed Team'
            END
          ) as team_name,
          COALESCE(
            NULLIF(s.submission_data_jsonb->>'team_description', ''),
            NULLIF(s.submission_data_jsonb->>'teamDescription', '')
          ) as team_description,
          s.submission_data_jsonb->'team_members' as team_members,
          s.submitted_by,
          s.submitted_at,
          s.submission_data_jsonb as full_submission_data,
          CASE WHEN s.submission_data_jsonb->'team_members' IS NOT NULL THEN 1 ELSE 0 END as has_members,
          CASE 
            WHEN s.submission_data_jsonb->>'team_name' IS NOT NULL AND s.submission_data_jsonb->>'team_name' != '' THEN 1
            WHEN s.submission_data_jsonb->>'teamName' IS NOT NULL AND s.submission_data_jsonb->>'teamName' != '' THEN 1
            ELSE 0 
          END as has_team_name
        FROM normalized_submissions s
        WHERE ${whereSql.replace(/CAST\(s\.submission_data AS jsonb\)/g, 's.submission_data_jsonb').replace(/\(CAST\(s\.submission_data AS jsonb\)\)/g, 's.submission_data_jsonb')}
          AND (
            -- Has team_name (snake_case or camelCase)
            (s.submission_data_jsonb->>'team_name' IS NOT NULL AND s.submission_data_jsonb->>'team_name' != '')
            OR (s.submission_data_jsonb->>'teamName' IS NOT NULL AND s.submission_data_jsonb->>'teamName' != '')
            -- OR has team_members array
            OR (s.submission_data_jsonb->'team_members' IS NOT NULL AND jsonb_array_length(s.submission_data_jsonb->'team_members') > 0)
          )
      ),
      team_submissions AS (
        SELECT DISTINCT ON (team_name)
          submission_id,
          team_name,
          team_description,
          team_members,
          submitted_by,
          submitted_at,
          full_submission_data
        FROM all_team_submissions
        ORDER BY team_name, has_team_name DESC, has_members DESC, submitted_at DESC
      )
      SELECT 
        ts.*,
        -- Get associated project details from project_details submissions or same submission
        (
          SELECT ps_normalized.submission_data_jsonb
          FROM (
            SELECT 
              ps.*,
              (ps.submission_data::text)::jsonb as submission_data_jsonb
            FROM hackathon_submissions ps
            WHERE ps.hackathon_id = $1
          ) ps_normalized
          WHERE ps_normalized.submission_data_jsonb->>'team_name' = ts.team_name
            AND ps_normalized.submission_data_jsonb->>'project_name' IS NOT NULL
          ORDER BY ps_normalized.submitted_at DESC
          LIMIT 1
        ) as project_data
      FROM team_submissions ts
      ORDER BY ts.team_name ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    // Add pageSize and offset to params array
    paramsArray.push(pageSize, offset);
    const teamsResult = await query(teamsQuery, paramsArray);

    // Debug: Log detailed information to help diagnose issues (only if needed)
    // Removed to avoid type casting issues - the main query handles everything
    
    // Always log the query result for debugging
    console.log(`Teams query returned ${teamsResult.rows.length} teams for hackathon ${hackathonId}`);

    // Get total count - count submissions with team_name OR team_members
    // Handle both 'team_name' and 'teamName' field name variations
    // Use double cast (text then jsonb) to handle both JSONB and TEXT column types
    // Use only the parameters needed for WHERE clause (not pagination params)
    const countParams: unknown[] = [hackathonId];
    if (search) {
      countParams.push(`%${search}%`);
    }
    
    const countQuery = `
      WITH normalized_submissions AS (
        SELECT 
          s.*,
          (s.submission_data::text)::jsonb as submission_data_jsonb
        FROM hackathon_submissions s
      )
      SELECT COUNT(DISTINCT 
        COALESCE(
          NULLIF(s.submission_data_jsonb->>'team_name', ''),
          NULLIF(s.submission_data_jsonb->>'teamName', ''),
          CASE 
            WHEN s.submission_data_jsonb->'team_members' IS NOT NULL 
              AND jsonb_array_length(s.submission_data_jsonb->'team_members') > 0
            THEN (
              SELECT COALESCE(
                NULLIF(member->>'firstName', '') || ' ' || NULLIF(member->>'lastName', ''),
                member->>'email',
                'Team Member'
              )
              FROM jsonb_array_elements(s.submission_data_jsonb->'team_members') AS member
              WHERE (member->>'isLead')::boolean = true
              LIMIT 1
            ) || '''s Team'
            ELSE 'Unnamed Team'
          END
        )
      ) as count
      FROM normalized_submissions s
      WHERE ${whereSql.replace(/s\.submission_data_jsonb/g, 's.submission_data_jsonb')}
        AND (
          (s.submission_data_jsonb->>'team_name' IS NOT NULL AND s.submission_data_jsonb->>'team_name' != '')
          OR (s.submission_data_jsonb->>'teamName' IS NOT NULL AND s.submission_data_jsonb->>'teamName' != '')
          OR (s.submission_data_jsonb->'team_members' IS NOT NULL AND jsonb_array_length(s.submission_data_jsonb->'team_members') > 0)
        )
    `;

    const countResult = await query<{ count: string }>(countQuery, countParams);
    const total = Number.parseInt(countResult.rows[0]?.count || '0', 10);

    // Format teams response
    const teams = teamsResult.rows.map((row: any) => {
      // Parse team_members - handle both JSONB and string formats
      let teamMembers: any[] = [];
      if (row.team_members) {
        try {
          if (typeof row.team_members === 'string') {
            teamMembers = JSON.parse(row.team_members);
          } else if (Array.isArray(row.team_members)) {
            teamMembers = row.team_members;
          } else if (typeof row.team_members === 'object') {
            // If it's a JSONB object, it might already be parsed
            teamMembers = Array.isArray(row.team_members) ? row.team_members : [];
          }
        } catch (e) {
          console.error('Error parsing team_members:', e, 'Raw value:', row.team_members);
          teamMembers = [];
        }
      }

      // Parse project_data from separate project_details submissions
      let projectData: any = null;
      if (row.project_data) {
        try {
          if (typeof row.project_data === 'string') {
            projectData = JSON.parse(row.project_data);
          } else if (typeof row.project_data === 'object') {
            projectData = row.project_data;
          }
        } catch (e) {
          console.error('Error parsing project_data:', e);
          projectData = null;
        }
      }

      // Also check full_submission_data for project fields (since we now include them in team_formation)
      let submissionData: any = null;
      if (row.full_submission_data) {
        try {
          if (typeof row.full_submission_data === 'string') {
            submissionData = JSON.parse(row.full_submission_data);
          } else if (typeof row.full_submission_data === 'object') {
            submissionData = row.full_submission_data;
          }
        } catch (e) {
          console.error('Error parsing full_submission_data:', e);
          submissionData = null;
        }
      }

      // Handle team_description which might be stored as JSONB or string
      let teamDescription = null;
      if (row.team_description) {
        if (typeof row.team_description === 'string') {
          teamDescription = row.team_description;
        } else if (typeof row.team_description === 'object') {
          // If it's an object, try to extract a string value or skip it
          teamDescription = null;
        }
      }
      
      // Extract project details from submission data (prefer from same submission, fallback to separate project_data)
      const projectName = submissionData?.project_name || projectData?.project_name || null;
      const projectDetails = submissionData?.project_details || submissionData?.projectDescription || null;
      const problemStatement = submissionData?.problem_statement || projectData?.problem_statement || null;
      const solution = submissionData?.solution || projectData?.solution || null;
      const githubLink = submissionData?.github_link || submissionData?.githubLink || projectData?.github_link || null;
      const liveLink = submissionData?.live_link || submissionData?.liveLink || projectData?.live_link || null;
      const pollId = submissionData?.poll_id || projectData?.poll_id || null;
      
      return {
        submissionId: row.submission_id,
        teamName: row.team_name || '',
        teamDescription,
        teamMembers: Array.isArray(teamMembers) ? teamMembers : [],
        submittedBy: row.submitted_by,
        submittedAt: row.submitted_at ? new Date(row.submitted_at).toISOString() : new Date().toISOString(),
        // Project details from same submission or separate project_details submissions
        projectName,
        projectDetails,
        problemStatement,
        solution,
        githubLink,
        liveLink,
        pollId,
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
