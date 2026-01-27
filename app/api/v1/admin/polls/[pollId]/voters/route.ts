import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import { registerVotersSchema } from '@/lib/validation/schemas';
import { getPollById, hasPollAccess } from '@/lib/repositories/polls';
import { bulkCreateTokens, getTokensByPoll, getTokenById } from '@/lib/repositories/tokens';
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
      
      // Check access: admins can access polls they created OR polls in hackathons they created
      const hasAccess = await hasPollAccess(poll, admin.adminId, admin.role);
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
      
      const tokens = await getTokensByPoll(pollId);
      
      // Import vote repository to check voting status
      const { hasTokenVoted } = await import('@/lib/repositories/votes');
      const { hashToken } = await import('@/lib/utils/token');
      const { getPlainTokenFromRecord } = await import('@/lib/repositories/tokens');
      
      // Don't return actual token values, only metadata
      // Include voting status (hasVoted) and email status
      const tokensData = await Promise.all(
        tokens.map(async (t) => {
          // Check if token has been used to vote
          // Token is used if it's marked as used OR if there's a vote with this token hash
          let hasVoted = t.used;
          if (!hasVoted) {
            const plainToken = getPlainTokenFromRecord(t);
            if (plainToken) {
              const tokenHash = hashToken(plainToken);
              hasVoted = await hasTokenVoted(tokenHash);
            }
          }
          
          return {
            tokenId: t.token_id,
            email: t.email,
            teamId: t.team_id,
            used: t.used,
            hasVoted,
            emailSent: t.delivery_status !== 'queued',
            emailStatus: t.delivery_status,
            issuedAt: t.issued_at,
            expiresAt: t.expires_at,
          };
        })
      );
      
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
      
      // Check access: admins can access polls they created OR polls in hackathons they created
      const hasAccess = await hasPollAccess(poll, admin.adminId, admin.role);
      if (!hasAccess) {
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
      
      // Create tokens (emails will be sent when admin clicks "Send Emails" button)
      const tokenResults = await bulkCreateTokens(
        pollId,
        votersWithTeamIds.map(v => ({ email: v.email, teamId: v.teamId }))
      );
      
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

