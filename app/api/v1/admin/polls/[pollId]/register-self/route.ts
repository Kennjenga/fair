import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import { getPollById } from '@/lib/repositories/polls';
import { findAdminById } from '@/lib/repositories/admins';
import { getTeamByName } from '@/lib/repositories/teams';
import { createToken } from '@/lib/repositories/tokens';
import { sendVotingTokenEmail } from '@/lib/email/brevo';
import { logAudit, getClientIp } from '@/lib/utils/audit';
import type { AuthenticatedRequest } from '@/lib/auth/middleware';

/**
 * @swagger
 * /api/v1/admin/polls/{pollId}/register-self:
 *   post:
 *     summary: Register poll creator as a voter
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - teamName
 *             properties:
 *               teamName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Successfully registered as voter
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
      const { teamName } = body;

      if (!teamName) {
        return NextResponse.json(
          { error: 'Team name is required' },
          { status: 400 }
        );
      }

      // Check poll exists and access
      const poll = await getPollById(pollId);
      if (!poll) {
        return NextResponse.json(
          { error: 'Poll not found' },
          { status: 404 }
        );
      }

      // Only poll creator can register themselves
      if (admin.role === 'admin' && poll.created_by !== admin.adminId) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      // Get admin details for email
      const adminDetails = await findAdminById(admin.adminId);
      if (!adminDetails) {
        return NextResponse.json(
          { error: 'Admin not found' },
          { status: 404 }
        );
      }

      // Find team
      const team = await getTeamByName(pollId, teamName);
      if (!team) {
        return NextResponse.json(
          { error: `Team "${teamName}" not found in poll` },
          { status: 400 }
        );
      }

      // Check if admin already has a token for this poll
      const { getTokensByPoll } = await import('@/lib/repositories/tokens');
      const existingTokens = await getTokensByPoll(pollId);
      const existingToken = existingTokens.find(t => t.email === adminDetails.email);

      if (existingToken) {
        return NextResponse.json(
          { 
            error: 'You are already registered as a voter',
            tokenId: existingToken.token_id,
          },
          { status: 400 }
        );
      }

      // Create token for poll creator
      const { token, tokenRecord } = await createToken(
        pollId,
        team.team_id,
        adminDetails.email
      );

      // Send email
      try {
        await sendVotingTokenEmail(
          adminDetails.email,
          token,
          poll.name,
          teamName
        );
        await require('@/lib/repositories/tokens').updateTokenDeliveryStatus(
          tokenRecord.token_id,
          'sent'
        );
      } catch (error) {
        console.error(`Failed to send email to ${adminDetails.email}:`, error);
        await require('@/lib/repositories/tokens').updateTokenDeliveryStatus(
          tokenRecord.token_id,
          'failed',
          error instanceof Error ? error.message : 'Unknown error'
        );
      }

      await logAudit(
        'self_registered_as_voter',
        admin.adminId,
        pollId,
        admin.role,
        { teamName, email: adminDetails.email },
        getClientIp(req.headers)
      );

      return NextResponse.json(
        {
          message: 'Successfully registered as voter',
          tokenId: tokenRecord.token_id,
          email: adminDetails.email,
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('Register self error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}

