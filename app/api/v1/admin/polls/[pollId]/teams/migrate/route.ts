import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import { getPollById } from '@/lib/repositories/polls';
import { migrateTeams, getTeamsByPoll } from '@/lib/repositories/teams';
import { logAudit, getClientIp } from '@/lib/utils/audit';
import type { AuthenticatedRequest } from '@/lib/auth/middleware';
import { z } from 'zod';

/**
 * Schema for team migration request
 */
const migrateTeamsSchema = z.object({
  targetPollId: z.string().uuid('Invalid target poll ID'),
  teamIds: z.array(z.string().uuid('Invalid team ID')).optional(),
});

/**
 * Migrate teams from one poll to another within the same hackathon
 * @swagger
 * /api/v1/admin/polls/{pollId}/teams/migrate:
 *   post:
 *     summary: Migrate teams from one poll to another
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
      
      // Validate request
      const validated = migrateTeamsSchema.parse(body);
      
      // Check source poll exists and access
      const sourcePoll = await getPollById(pollId);
      if (!sourcePoll) {
        return NextResponse.json(
          { error: 'Source poll not found' },
          { status: 404 }
        );
      }
      
      if (admin.role === 'admin' && sourcePoll.created_by !== admin.adminId) {
        return NextResponse.json(
          { error: 'Access denied to source poll' },
          { status: 403 }
        );
      }
      
      // Check target poll exists and access
      const targetPoll = await getPollById(validated.targetPollId);
      if (!targetPoll) {
        return NextResponse.json(
          { error: 'Target poll not found' },
          { status: 404 }
        );
      }
      
      if (admin.role === 'admin' && targetPoll.created_by !== admin.adminId) {
        return NextResponse.json(
          { error: 'Access denied to target poll' },
          { status: 403 }
        );
      }
      
      // Verify both polls are in the same hackathon
      if (sourcePoll.hackathon_id !== targetPoll.hackathon_id) {
        return NextResponse.json(
          { error: 'Cannot migrate teams between polls in different hackathons' },
          { status: 400 }
        );
      }
      
      // If specific team IDs provided, verify they exist in source poll
      if (validated.teamIds && validated.teamIds.length > 0) {
        const sourceTeams = await getTeamsByPoll(pollId);
        const validTeamIds = new Set(sourceTeams.map(t => t.team_id));
        
        for (const teamId of validated.teamIds) {
          if (!validTeamIds.has(teamId)) {
            return NextResponse.json(
              { error: `Team ${teamId} not found in source poll` },
              { status: 400 }
            );
          }
        }
      }
      
      // Migrate (duplicate) teams and their voters
      const duplicatedTeams = await migrateTeams(
        pollId,
        validated.targetPollId,
        validated.teamIds
      );
      
      // Log audit
      await logAudit(
        'teams_migrated',
        admin.adminId,
        validated.targetPollId,
        admin.role,
        { 
          sourcePollId: pollId,
          targetPollId: validated.targetPollId,
          teamIds: validated.teamIds || 'all',
          teamsDuplicated: duplicatedTeams.length
        },
        getClientIp(req.headers)
      );
      
      return NextResponse.json({
        message: `Successfully duplicated ${duplicatedTeams.length} team(s) and their voters to the target poll`,
        teams: duplicatedTeams.map(team => ({
          team_id: team.team_id,
          team_name: team.team_name,
          poll_id: team.poll_id,
          metadata: team.metadata,
          project_name: team.project_name,
          project_description: team.project_description,
          pitch: team.pitch,
          live_site_url: team.live_site_url,
          github_url: team.github_url,
          created_at: team.created_at,
        })),
      }, { status: 200 });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Validation failed', details: error },
          { status: 400 }
        );
      }
      
      console.error('Migrate teams error:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}

