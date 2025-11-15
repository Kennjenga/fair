import { NextRequest, NextResponse } from 'next/server';
import { findTokenByPlainToken } from '@/lib/repositories/tokens';
import { getPollById } from '@/lib/repositories/polls';
import { getTeamById } from '@/lib/repositories/teams';
import { hashToken } from '@/lib/utils/token';
import { hasTokenVoted, getVoteByTokenHash } from '@/lib/repositories/votes';
import { getExplorerUrl } from '@/lib/blockchain/avalanche';

/**
 * @swagger
 * /api/v1/vote/validate:
 *   post:
 *     summary: Validate voting token and get available teams
 *     tags: [Vote]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token is valid
 *       400:
 *         description: Invalid token or already used
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;
    
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }
    
    // Find token
    const tokenRecord = await findTokenByPlainToken(token);
    
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
    
    // Check if token is expired
    if (tokenRecord.expires_at && new Date() > new Date(tokenRecord.expires_at)) {
      return NextResponse.json(
        { error: 'Token has expired' },
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
    
    // Get all teams for the poll (needed for both new and existing votes)
    const { getTeamsByPoll } = await import('@/lib/repositories/teams');
    const teams = await getTeamsByPoll(tokenRecord.poll_id);
    
    // Get voter's team
    const voterTeam = await getTeamById(tokenRecord.team_id);
    
    // Filter out voter's own team if self-vote is not allowed
    const availableTeams = poll.allow_self_vote
      ? teams
      : teams.filter(t => t.team_id !== tokenRecord.team_id);
    
    // Check if token has already voted
    const tokenHash = hashToken(token);
    const existingVote = await getVoteByTokenHash(tokenHash);
    
    if (existingVote) {
      // Token has already voted - return existing vote information
      return NextResponse.json({
        valid: true,
        alreadyVoted: true,
        poll: {
          pollId: poll.poll_id,
          name: poll.name,
          votingMode: poll.voting_mode,
          votingPermissions: poll.voting_permissions,
          requireTeamNameGate: poll.require_team_name_gate,
          allowSelfVote: poll.allow_self_vote,
          rankPointsConfig: poll.rank_points_config,
        },
        voterTeam: voterTeam ? {
          teamId: voterTeam.team_id,
          teamName: voterTeam.team_name,
        } : null,
        availableTeams: teams.map(t => ({
          teamId: t.team_id,
          teamName: t.team_name,
        })),
        existingVote: {
          voteId: existingVote.vote_id,
          voteType: existingVote.vote_type,
          votingMode: poll.voting_mode,
          teamIdTarget: existingVote.team_id_target,
          teams: existingVote.teams,
          rankings: existingVote.rankings,
          timestamp: existingVote.timestamp,
          txHash: existingVote.tx_hash,
          explorerUrl: existingVote.tx_hash ? getExplorerUrl(existingVote.tx_hash) : null,
        },
      });
    }
    
    // Token has not voted yet - return poll and teams for voting
    return NextResponse.json({
      valid: true,
      alreadyVoted: false,
      poll: {
        pollId: poll.poll_id,
        name: poll.name,
        votingMode: poll.voting_mode,
        votingPermissions: poll.voting_permissions,
        requireTeamNameGate: poll.require_team_name_gate,
        allowSelfVote: poll.allow_self_vote,
        rankPointsConfig: poll.rank_points_config,
      },
      voterTeam: voterTeam ? {
        teamId: voterTeam.team_id,
        teamName: voterTeam.team_name,
      } : null,
      availableTeams: availableTeams.map(t => ({
        teamId: t.team_id,
        teamName: t.team_name,
      })),
    });
  } catch (error) {
    console.error('Validate token error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

