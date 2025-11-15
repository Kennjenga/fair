import { NextRequest, NextResponse } from 'next/server';
import { submitVoteSchema } from '@/lib/validation/schemas';
import { findTokenByPlainToken, markTokenAsUsed } from '@/lib/repositories/tokens';
import { getPollById } from '@/lib/repositories/polls';
import { getTeamById, getTeamByName } from '@/lib/repositories/teams';
import { hashToken } from '@/lib/utils/token';
import { hasTokenVoted, createVote } from '@/lib/repositories/votes';
import { createVoteHash, submitVoteToBlockchain, getExplorerUrl } from '@/lib/blockchain/avalanche';
import { logAudit, getClientIp } from '@/lib/utils/audit';

/**
 * @swagger
 * /api/v1/vote/submit:
 *   post:
 *     summary: Submit a vote
 *     tags: [Vote]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubmitVoteRequest'
 *     responses:
 *       200:
 *         description: Vote submitted successfully
 *       400:
 *         description: Invalid vote or validation failed
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request
    const validated = submitVoteSchema.parse(body);
    
    // Find and validate token
    const tokenRecord = await findTokenByPlainToken(validated.token);
    
    if (!tokenRecord) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      );
    }
    
    // Check if token is already used
    if (tokenRecord.used) {
      return NextResponse.json(
        { error: 'Token has already been used' },
        { status: 400 }
      );
    }
    
    // Get poll
    const poll = await getPollById(tokenRecord.poll_id);
    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }
    
    // Check if poll is active
    const now = new Date();
    if (now < poll.start_time || now > poll.end_time) {
      return NextResponse.json(
        { error: 'Poll is not currently active' },
        { status: 400 }
      );
    }
    
    // Verify team name if required
    if (poll.require_team_name_gate) {
      const voterTeam = await getTeamById(tokenRecord.team_id);
      if (!voterTeam || voterTeam.team_name !== validated.teamName) {
        return NextResponse.json(
          { error: 'Team name does not match token assignment' },
          { status: 400 }
        );
      }
    }
    
    // Check self-vote exclusion
    if (!poll.allow_self_vote && tokenRecord.team_id === validated.teamIdTarget) {
      return NextResponse.json(
        { error: 'Self-voting is not allowed' },
        { status: 400 }
      );
    }
    
    // Verify target team exists and belongs to poll
    const targetTeam = await getTeamById(validated.teamIdTarget);
    if (!targetTeam || targetTeam.poll_id !== tokenRecord.poll_id) {
      return NextResponse.json(
        { error: 'Invalid target team' },
        { status: 400 }
      );
    }
    
    // Check if token has already voted
    const tokenHash = hashToken(validated.token);
    const alreadyVoted = await hasTokenVoted(tokenHash);
    if (alreadyVoted) {
      return NextResponse.json(
        { error: 'Token has already been used to vote' },
        { status: 400 }
      );
    }
    
    // Create vote hash
    const timestamp = Math.floor(Date.now() / 1000);
    const voteHash = createVoteHash(
      validated.token,
      tokenRecord.poll_id,
      validated.teamIdTarget,
      timestamp
    );
    
    // Submit to blockchain
    let txHash: string | null = null;
    try {
      txHash = await submitVoteToBlockchain({
        pollId: tokenRecord.poll_id,
        teamIdTarget: validated.teamIdTarget,
        timestamp,
        voteHash,
      });
    } catch (error) {
      console.error('Blockchain submission failed:', error);
      // Continue even if blockchain fails - we'll store vote without TX hash
      // In production, you might want to retry or queue for later
    }
    
    // Create vote record
    const vote = await createVote(
      tokenRecord.poll_id,
      tokenHash,
      validated.teamIdTarget,
      txHash
    );
    
    // Mark token as used
    await markTokenAsUsed(tokenRecord.token_id);
    
    // Log audit
    await logAudit(
      'vote_submitted',
      null,
      tokenRecord.poll_id,
      null,
      {
        voteId: vote.vote_id,
        teamIdTarget: validated.teamIdTarget,
        txHash,
      },
      getClientIp(req.headers)
    );
    
    return NextResponse.json({
      voteId: vote.vote_id,
      txHash: txHash || null,
      explorerUrl: txHash ? getExplorerUrl(txHash) : null,
      timestamp: new Date().toISOString(),
      message: 'Vote submitted successfully',
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error },
        { status: 400 }
      );
    }
    
    console.error('Submit vote error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

