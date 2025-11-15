import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import { updateTeamSchema } from '@/lib/validation/schemas';
import { getPollById } from '@/lib/repositories/polls';
import { getTeamById, updateTeam, deleteTeam } from '@/lib/repositories/teams';
import { getTokensByTeam, reassignTokenToTeam } from '@/lib/repositories/tokens';
import { logAudit, getClientIp } from '@/lib/utils/audit';
import type { AuthenticatedRequest } from '@/lib/auth/middleware';

/**
 * @swagger
 * /api/v1/admin/polls/{pollId}/teams/{teamId}:
 *   get:
 *     summary: Get team by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ pollId: string; teamId: string }> }
) {
  return withAdmin(async (req: AuthenticatedRequest) => {
    try {
      const admin = req.admin!;
      const { pollId, teamId } = await params;
      
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
      
      // Check team exists and belongs to poll's hackathon
      const team = await getTeamById(teamId);
      if (!team || team.hackathon_id !== poll.hackathon_id) {
        return NextResponse.json(
          { error: 'Team not found' },
          { status: 404 }
        );
      }
      
      // Get tokens (voters) for this team
      const tokens = await getTokensByTeam(teamId);
      
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
        voters: tokens.map(t => ({
          tokenId: t.token_id,
          email: t.email,
          used: t.used,
          issuedAt: t.issued_at,
        })),
      });
    } catch (error) {
      console.error('Get team error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * @swagger
 * /api/v1/admin/polls/{pollId}/teams/{teamId}:
 *   patch:
 *     summary: Update team
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ pollId: string; teamId: string }> }
) {
  return withAdmin(async (req: AuthenticatedRequest) => {
    try {
      const admin = req.admin!;
      const { pollId, teamId } = await params;
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
      
      // Check team exists and belongs to poll's hackathon
      const existingTeam = await getTeamById(teamId);
      if (!existingTeam || existingTeam.hackathon_id !== poll.hackathon_id) {
        return NextResponse.json(
          { error: 'Team not found' },
          { status: 404 }
        );
      }
      
      const validated = updateTeamSchema.parse(body);
      
      // Extract project info from metadata if provided
      const projectInfo = validated.metadata || {};
      
      const team = await updateTeam(teamId, {
        teamName: validated.teamName,
        metadata: validated.metadata,
        projectName: projectInfo.projectName,
        projectDescription: projectInfo.projectDescription,
        pitch: projectInfo.pitch,
        liveSiteUrl: projectInfo.liveSiteUrl,
        githubUrl: projectInfo.githubUrl,
      });
      
      await logAudit(
        'team_updated',
        admin.adminId,
        pollId,
        admin.role,
        { teamId, teamName: team.team_name, changes: validated },
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
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Validation failed', details: error },
          { status: 400 }
        );
      }
      
      console.error('Update team error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * @swagger
 * /api/v1/admin/polls/{pollId}/teams/{teamId}:
 *   delete:
 *     summary: Delete team
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ pollId: string; teamId: string }> }
) {
  return withAdmin(async (req: AuthenticatedRequest) => {
    try {
      const admin = req.admin!;
      const { pollId, teamId } = await params;
      
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
      
      // Check team exists and belongs to poll's hackathon
      const team = await getTeamById(teamId);
      if (!team || team.hackathon_id !== poll.hackathon_id) {
        return NextResponse.json(
          { error: 'Team not found' },
          { status: 404 }
        );
      }
      
      // Check if team has voters (tokens)
      const tokens = await getTokensByTeam(teamId);
      if (tokens.length > 0) {
        return NextResponse.json(
          { error: 'Cannot delete team with registered voters. Please reassign or remove voters first.' },
          { status: 400 }
        );
      }
      
      await deleteTeam(teamId);
      
      await logAudit(
        'team_deleted',
        admin.adminId,
        pollId,
        admin.role,
        { teamId, teamName: team.team_name },
        getClientIp(req.headers)
      );
      
      return NextResponse.json({ message: 'Team deleted successfully' });
    } catch (error) {
      console.error('Delete team error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}

