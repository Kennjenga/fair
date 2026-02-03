import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import { getPollById, hasPollAccessForAdmin } from '@/lib/repositories/polls';
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
      
      // Check access: admins can access polls they created OR polls in hackathons they created
      const hasAccess = await hasPollAccessForAdmin(poll, admin);
      if (!hasAccess) {
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
      
      // Query to extract unique teams from submissions
      // Find all submissions with team_name (team_formation or other forms)
      // Handle both 'team_name' (snake_case) and 'teamName' (camelCase) field variations
      // Also fetch project_details submissions for each team
      // We look for any submission with team_name, prioritizing those with team_members
      // Normalize submission_data to JSONB first to handle both TEXT and JSONB columns
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
              NULLIF(s.submission_data_jsonb->>'team_name', ''),
              NULLIF(s.submission_data_jsonb->>'teamName', ''),
              -- Generate team name from first member if team_name is missing
              CASE 
                WHEN (s.submission_data_jsonb->'team_members' IS NOT NULL 
                      AND jsonb_array_length(s.submission_data_jsonb->'team_members') > 0)
                     OR (s.submission_data_jsonb->'teamMembers' IS NOT NULL 
                         AND jsonb_array_length(s.submission_data_jsonb->'teamMembers') > 0)
                THEN (
                  SELECT COALESCE(
                    NULLIF(member->>'firstName', '') || ' ' || NULLIF(member->>'lastName', ''),
                    member->>'email',
                    'Team Member'
                  )
                  FROM jsonb_array_elements(
                    COALESCE(
                      s.submission_data_jsonb->'team_members',
                      s.submission_data_jsonb->'teamMembers'
                    )
                  ) AS member
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
            COALESCE(
              s.submission_data_jsonb->'team_members',
              s.submission_data_jsonb->'teamMembers'
            ) as team_members,
            s.submitted_by,
            s.submitted_at,
            s.submission_data_jsonb as full_submission_data,
            CASE WHEN (s.submission_data_jsonb->'team_members' IS NOT NULL 
                       OR s.submission_data_jsonb->'teamMembers' IS NOT NULL) THEN 1 ELSE 0 END as has_members,
            CASE 
              WHEN s.submission_data_jsonb->>'team_name' IS NOT NULL AND s.submission_data_jsonb->>'team_name' != '' THEN 1
              WHEN s.submission_data_jsonb->>'teamName' IS NOT NULL AND s.submission_data_jsonb->>'teamName' != '' THEN 1
              ELSE 0 
            END as has_team_name
          FROM normalized_submissions s
          WHERE ${whereSql.replace(/s\.submission_data/g, 's.submission_data_jsonb')}
            AND (
              (s.submission_data_jsonb->>'team_name' IS NOT NULL AND s.submission_data_jsonb->>'team_name' != '')
              OR (s.submission_data_jsonb->>'teamName' IS NOT NULL AND s.submission_data_jsonb->>'teamName' != '')
              OR (s.submission_data_jsonb->'team_members' IS NOT NULL AND jsonb_array_length(s.submission_data_jsonb->'team_members') > 0)
              OR (s.submission_data_jsonb->'teamMembers' IS NOT NULL AND jsonb_array_length(s.submission_data_jsonb->'teamMembers') > 0)
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
        ),
        project_details_submissions AS (
          SELECT DISTINCT ON (ps_normalized.submission_data_jsonb->>'team_name')
            ps_normalized.submission_data_jsonb->>'team_name' as team_name,
            ps_normalized.submission_data_jsonb->>'project_name' as project_name,
            ps_normalized.submission_data_jsonb->>'problem_statement' as problem_statement,
            ps_normalized.submission_data_jsonb->>'project_description' as project_description,
            ps_normalized.submission_data_jsonb->>'solution' as solution,
            ps_normalized.submission_data_jsonb->>'pitch' as pitch,
            ps_normalized.submission_data_jsonb->>'live_link' as live_link,
            ps_normalized.submission_data_jsonb->>'live_site_url' as live_site_url,
            ps_normalized.submission_data_jsonb->>'github_link' as github_link,
            ps_normalized.submission_data_jsonb->>'github_url' as github_url
          FROM (
            SELECT 
              ps.*,
              (ps.submission_data::text)::jsonb as submission_data_jsonb
            FROM hackathon_submissions ps
            WHERE ps.hackathon_id = $1
          ) ps_normalized
          WHERE ps_normalized.submission_data_jsonb->>'team_name' IS NOT NULL
            AND ps_normalized.submission_data_jsonb->>'team_name' != ''
            AND ps_normalized.submission_data_jsonb->>'project_name' IS NOT NULL
          ORDER BY ps_normalized.submission_data_jsonb->>'team_name', ps_normalized.submitted_at DESC
        )
        SELECT 
          ts.*,
          pds.project_name,
          pds.problem_statement,
          pds.project_description,
          pds.solution,
          pds.pitch,
          pds.live_link,
          pds.live_site_url,
          pds.github_link,
          pds.github_url
        FROM team_submissions ts
        LEFT JOIN project_details_submissions pds ON ts.team_name = pds.team_name
        ORDER BY ts.team_name ASC
      `;
      
      const teamsResult = await query(teamsQuery, paramsArray);
      
      // Debug: Log team members data for first team to help diagnose issues
      if (teamsResult.rows.length > 0) {
        const firstTeam = teamsResult.rows[0];
        console.log('Debug: First team data:', {
          team_name: firstTeam.team_name,
          team_members_type: typeof firstTeam.team_members,
          team_members_value: firstTeam.team_members,
          has_full_submission_data: !!firstTeam.full_submission_data,
        });
      } else {
        // Check if there are any submissions at all for this hackathon
        const debugQuery = await query(
          `SELECT COUNT(*) as total, 
           COUNT(CASE WHEN (submission_data::text)::jsonb->>'team_name' IS NOT NULL THEN 1 END) as with_team_name,
           COUNT(CASE WHEN (submission_data::text)::jsonb->'team_members' IS NOT NULL THEN 1 END) as with_team_members
           FROM hackathon_submissions WHERE hackathon_id = $1`,
          [hackathonId]
        );
        console.log('Debug: Hackathon submissions count:', debugQuery.rows[0]);
      }
      
      // Format teams response with team members and project details
      const teams = teamsResult.rows.map((row: any) => {
        // Parse team_members - handle both JSONB and string formats
        let teamMembers: any[] = [];
        if (row.team_members) {
          try {
            if (typeof row.team_members === 'string') {
              teamMembers = JSON.parse(row.team_members);
            } else if (Array.isArray(row.team_members)) {
              teamMembers = row.team_members;
            } else if (typeof row.team_members === 'object' && row.team_members !== null) {
              // If it's a JSONB object, try to extract as array
              // Sometimes PostgreSQL returns JSONB as an object that needs to be converted
              if (Array.isArray(row.team_members)) {
                teamMembers = row.team_members;
              } else {
                // If it's a single object, wrap it in an array
                teamMembers = [row.team_members];
              }
            }
          } catch (e) {
            console.error('Error parsing team_members:', e, 'Raw value:', row.team_members);
            teamMembers = [];
          }
        }
        
            // Also try to extract from full_submission_data if team_members is empty
            // Handle both team_members (snake_case) and teamMembers (camelCase) field names
            if (teamMembers.length === 0 && row.full_submission_data) {
              try {
                let submissionData: any = null;
                if (typeof row.full_submission_data === 'string') {
                  submissionData = JSON.parse(row.full_submission_data);
                } else if (typeof row.full_submission_data === 'object') {
                  submissionData = row.full_submission_data;
                }
                
                // Try team_members first (snake_case)
                if (submissionData && submissionData.team_members) {
                  if (Array.isArray(submissionData.team_members)) {
                    teamMembers = submissionData.team_members;
                  } else if (typeof submissionData.team_members === 'string') {
                    teamMembers = JSON.parse(submissionData.team_members);
                  }
                }
                // Try teamMembers (camelCase) if team_members wasn't found
                else if (submissionData && submissionData.teamMembers) {
                  if (Array.isArray(submissionData.teamMembers)) {
                    teamMembers = submissionData.teamMembers;
                  } else if (typeof submissionData.teamMembers === 'string') {
                    teamMembers = JSON.parse(submissionData.teamMembers);
                  }
                }
              } catch (e) {
                console.error('Error extracting team_members from full_submission_data:', e);
              }
            }
        
        // Extract project details, preferring project_details form fields
        const projectName = row.project_name || null;
        const projectDescription = row.problem_statement || row.project_description || null;
        const pitch = row.solution || row.pitch || null;
        const liveSiteUrl = row.live_link || row.live_site_url || null;
        const githubUrl = row.github_link || row.github_url || null;
        
        return {
          teamName: row.team_name,
          teamDescription: row.team_description || null,
          teamMembers: Array.isArray(teamMembers) ? teamMembers : [],
          submittedBy: row.submitted_by,
          submittedAt: row.submitted_at,
          // Project details from project_details submissions
          projectName,
          projectDescription,
          pitch,
          liveSiteUrl,
          githubUrl,
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
