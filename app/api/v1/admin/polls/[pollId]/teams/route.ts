import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import { createTeamSchema, bulkTeamImportSchema } from '@/lib/validation/schemas';
import { getPollById } from '@/lib/repositories/polls';
import { createTeam, getTeamsByPoll, bulkCreateTeams } from '@/lib/repositories/teams';
import { logAudit, getClientIp } from '@/lib/utils/audit';
import type { AuthenticatedRequest } from '@/lib/auth/middleware';

/**
 * @swagger
 * /api/v1/admin/polls/{pollId}/teams:
 *   get:
 *     summary: Get all teams for a poll
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
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
      
      const teams = await getTeamsByPoll(pollId);
      
      return NextResponse.json({
        teams: teams.map(team => ({
          team_id: team.team_id,
          team_name: team.team_name,
          hackathon_id: team.hackathon_id,
          metadata: team.metadata,
          project_name: team.project_name,
          project_description: team.project_description,
          pitch: team.pitch,
          live_site_url: team.live_site_url,
          github_url: team.github_url,
          created_at: team.created_at,
        })),
      });
    } catch (error) {
      console.error('Get teams error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * @swagger
 * /api/v1/admin/polls/{pollId}/teams:
 *   post:
 *     summary: Create team(s) for a poll
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
      
      // Teams can be added at any time, even after poll has ended
      // This allows extending polls and adding new teams
      
      // Check if bulk import or single team
      if (body.teams && Array.isArray(body.teams)) {
        // Bulk import
        const validated = bulkTeamImportSchema.parse(body);
        
        // Teams belong to hackathons, not polls
        const teams = await bulkCreateTeams(
          poll.hackathon_id,
          validated.teams.map(t => ({
            teamName: t.teamName,
            metadata: t.metadata,
          }))
        );
        
        await logAudit(
          'teams_bulk_created',
          admin.adminId,
          pollId,
          admin.role,
          { count: teams.length },
          getClientIp(req.headers)
        );
        
        return NextResponse.json({
          teams: teams.map(team => ({
            team_id: team.team_id,
            team_name: team.team_name,
            hackathon_id: team.hackathon_id,
            metadata: team.metadata,
            project_name: team.project_name,
            project_description: team.project_description,
            pitch: team.pitch,
            live_site_url: team.live_site_url,
            github_url: team.github_url,
            created_at: team.created_at,
          })),
        }, { status: 201 });
      } else {
        // Single team
        const validated = createTeamSchema.parse(body);
        
        // Extract project info from metadata if provided
        const projectInfo = validated.metadata || {};
        
        // Teams belong to hackathons, not polls
        const team = await createTeam(
          poll.hackathon_id,
          validated.teamName,
          validated.metadata,
          {
            projectName: projectInfo.projectName,
            projectDescription: projectInfo.projectDescription,
            pitch: projectInfo.pitch,
            liveSiteUrl: projectInfo.liveSiteUrl,
            githubUrl: projectInfo.githubUrl,
          }
        );
        
        await logAudit(
          'team_created',
          admin.adminId,
          pollId,
          admin.role,
          { teamName: team.team_name },
          getClientIp(req.headers)
        );
        
        return NextResponse.json({
          team: {
            team_id: team.team_id,
            team_name: team.team_name,
            hackathon_id: team.hackathon_id,
            metadata: team.metadata,
            project_name: team.project_name,
            project_description: team.project_description,
            pitch: team.pitch,
            live_site_url: team.live_site_url,
            github_url: team.github_url,
            created_at: team.created_at,
          },
        }, { status: 201 });
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Validation failed', details: error },
          { status: 400 }
        );
      }
      
      console.error('Create team error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}

