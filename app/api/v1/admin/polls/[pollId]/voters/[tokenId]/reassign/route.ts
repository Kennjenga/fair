import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import { z } from 'zod';
import { getPollById } from '@/lib/repositories/polls';
import { getTeamById } from '@/lib/repositories/teams';
import { getTokenById, reassignTokenToTeam } from '@/lib/repositories/tokens';
import { logAudit, getClientIp } from '@/lib/utils/audit';
import type { AuthenticatedRequest } from '@/lib/auth/middleware';

/**
 * Reassign voter schema
 */
const reassignVoterSchema = z.object({
  newTeamId: z.string().uuid('Invalid team ID'),
});

/**
 * @swagger
 * /api/v1/admin/polls/{pollId}/voters/{tokenId}/reassign:
 *   post:
 *     summary: Reassign voter to a different team
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ pollId: string; tokenId: string }> }
) {
  return withAdmin(async (req: AuthenticatedRequest) => {
    try {
      const admin = req.admin!;
      const { pollId, tokenId } = await params;
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
      
      // Check token exists and belongs to poll
      const token = await getTokenById(tokenId);
      if (!token || token.poll_id !== pollId) {
        return NextResponse.json(
          { error: 'Voter not found' },
          { status: 404 }
        );
      }
      
      const validated = reassignVoterSchema.parse(body);
      
      // Check new team exists and belongs to the same hackathon as the poll
      const newTeam = await getTeamById(validated.newTeamId);
      if (!newTeam || newTeam.hackathon_id !== poll.hackathon_id) {
        return NextResponse.json(
          { error: 'Team not found or does not belong to the same hackathon' },
          { status: 404 }
        );
      }
      
      // Reassign token to new team
      const updatedToken = await reassignTokenToTeam(tokenId, validated.newTeamId);
      
      await logAudit(
        'voter_reassigned',
        admin.adminId,
        pollId,
        admin.role,
        {
          tokenId,
          email: token.email,
          oldTeamId: token.team_id,
          newTeamId: validated.newTeamId,
        },
        getClientIp(req.headers)
      );
      
      return NextResponse.json({
        message: 'Voter reassigned successfully',
        token: {
          tokenId: updatedToken.token_id,
          email: updatedToken.email,
          teamId: updatedToken.team_id,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Validation failed', details: error },
          { status: 400 }
        );
      }
      
      console.error('Reassign voter error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}



