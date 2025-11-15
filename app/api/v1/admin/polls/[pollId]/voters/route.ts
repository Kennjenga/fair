import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import { registerVotersSchema } from '@/lib/validation/schemas';
import { getPollById } from '@/lib/repositories/polls';
import { bulkCreateTokens, getTokensByPoll } from '@/lib/repositories/tokens';
import { sendVotingTokenEmail } from '@/lib/email/brevo';
import { logAudit, getClientIp } from '@/lib/utils/audit';
import type { AuthenticatedRequest } from '@/lib/auth/middleware';

/**
 * @swagger
 * /api/v1/admin/polls/{pollId}/voters:
 *   get:
 *     summary: Get all tokens/voters for a poll
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
      
      const tokens = await getTokensByPoll(pollId);
      
      // Don't return actual token values, only metadata
      const tokensData = tokens.map(t => ({
        tokenId: t.token_id,
        email: t.email,
        teamId: t.team_id,
        used: t.used,
        deliveryStatus: t.delivery_status,
        issuedAt: t.issued_at,
        expiresAt: t.expires_at,
      }));
      
      return NextResponse.json({ tokens: tokensData });
    } catch (error) {
      console.error('Get voters error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * @swagger
 * /api/v1/admin/polls/{pollId}/voters:
 *   post:
 *     summary: Register voters and generate tokens
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
      
      // Voters can be registered at any time, even after poll has ended
      // This allows extending polls and registering new voters
      
      // Validate request
      const validated = registerVotersSchema.parse(body);
      
      // Resolve team IDs from team names
      // Teams belong to hackathons, so we need to get teams by hackathon
      const votersWithTeamIds = await Promise.all(
        validated.voters.map(async (voter) => {
          // getTeamByName now takes hackathonId, but we can use getTeamsByPoll which joins through hackathon
          const { getTeamsByPoll } = await import('@/lib/repositories/teams');
          const teams = await getTeamsByPoll(pollId);
          const team = teams.find(t => t.team_name === voter.teamName);
          if (!team) {
            throw new Error(`Team "${voter.teamName}" not found in poll`);
          }
          return {
            email: voter.email,
            teamId: team.team_id,
            teamName: voter.teamName,
          };
        })
      );
      
      // Create tokens
      const tokenResults = await bulkCreateTokens(
        pollId,
        votersWithTeamIds.map(v => ({ email: v.email, teamId: v.teamId }))
      );
      
      // Send emails (async, don't wait)
      Promise.all(
        tokenResults.map(async (result) => {
          try {
            await sendVotingTokenEmail(
              result.email,
              result.token,
              poll.name,
              votersWithTeamIds.find(v => v.email === result.email)!.teamName
            );
            
            // Update delivery status
            await require('@/lib/repositories/tokens').updateTokenDeliveryStatus(
              result.tokenId,
              'sent'
            );
          } catch (error) {
            console.error(`Failed to send email to ${result.email}:`, error);
            await require('@/lib/repositories/tokens').updateTokenDeliveryStatus(
              result.tokenId,
              'failed',
              error instanceof Error ? error.message : 'Unknown error'
            );
          }
        })
      ).catch(console.error);
      
      await logAudit(
        'voters_registered',
        admin.adminId,
        pollId,
        admin.role,
        { count: tokenResults.length },
        getClientIp(req.headers)
      );
      
      return NextResponse.json(
        {
          message: 'Voters registered successfully',
          count: tokenResults.length,
          tokens: tokenResults.map(t => ({
            email: t.email,
            tokenId: t.tokenId,
          })),
        },
        { status: 201 }
      );
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Validation failed', details: error },
          { status: 400 }
        );
      }
      
      console.error('Register voters error:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}

