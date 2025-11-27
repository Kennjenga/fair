import { NextRequest, NextResponse } from 'next/server';
import { submitVoteSchema } from '@/lib/validation/schemas';
import { findTokenByPlainToken, markTokenAsUsed } from '@/lib/repositories/tokens';
import { getPollById } from '@/lib/repositories/polls';
import { getTeamById, getTeamsByPoll } from '@/lib/repositories/teams';
import { hashToken } from '@/lib/utils/token';
import { hasTokenVoted, hasJudgeVoted, createVote, getVoteByTokenHash, getVoteByJudgeEmail, updateVote } from '@/lib/repositories/votes';
import { isJudgeForPoll } from '@/lib/repositories/judges';
import { processRankings } from '@/lib/utils/ranked-voting';
import { createVoteHash, submitVoteToBlockchain, getExplorerUrl } from '@/lib/blockchain/avalanche';
import { logAudit, getClientIp } from '@/lib/utils/audit';
import crypto from 'crypto';

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
    
    let poll;
    let voteType: 'voter' | 'judge';
    let tokenHash: string | null = null;
    let judgeEmail: string | null = null;
    let voterTeamId: string | null = null;
    let existingVote: any = null; // Store existing voter vote for potential editing
    let judgeExistingVote: any = null; // Store existing judge vote for potential editing
    
    // Determine if this is a voter or judge vote
    if (validated.token) {
      // Voter vote
      voteType = 'voter';
      
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
      poll = await getPollById(tokenRecord.poll_id);
      if (!poll) {
        return NextResponse.json(
          { error: 'Poll not found' },
          { status: 404 }
        );
      }
      
      // Check voting permissions for voters
      if (poll.voting_permissions === 'judges_only') {
        return NextResponse.json(
          { error: 'This poll only allows judges to vote' },
          { status: 403 }
        );
      }
      // voters_only and voters_and_judges both allow voter votes
      
      tokenHash = hashToken(validated.token);
      voterTeamId = tokenRecord.team_id;
      
      // Check if token has already voted
      existingVote = await getVoteByTokenHash(tokenHash);
      if (existingVote) {
        // If vote editing is not allowed, return existing vote
        if (!poll.allow_vote_editing) {
          return NextResponse.json({
            voteId: existingVote.vote_id,
            txHash: existingVote.tx_hash || null,
            explorerUrl: existingVote.tx_hash ? getExplorerUrl(existingVote.tx_hash) : null,
            timestamp: existingVote.timestamp.toISOString(),
            message: 'You have already voted. Vote editing is not allowed for this poll.',
            alreadyVoted: true,
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
        // Vote editing is allowed - we'll update the vote later in the flow
      }
      
      // Verify team name if required
      if (poll.require_team_name_gate && validated.teamName) {
        const voterTeam = await getTeamById(tokenRecord.team_id);
        if (!voterTeam || voterTeam.team_name !== validated.teamName) {
          return NextResponse.json(
            { error: 'Team name does not match token assignment' },
            { status: 400 }
          );
        }
      }
    } else if (validated.judgeEmail && validated.pollId) {
      // Judge vote
      voteType = 'judge';
      judgeEmail = validated.judgeEmail;
      
      // Get poll
      poll = await getPollById(validated.pollId);
      if (!poll) {
        return NextResponse.json(
          { error: 'Poll not found' },
          { status: 404 }
        );
      }
      
      // Check voting permissions for judges
      if (poll.voting_permissions === 'voters_only') {
        return NextResponse.json(
          { error: 'This poll only allows voters to vote, not judges' },
          { status: 403 }
        );
      }
      
      if (poll.voting_permissions === 'voters_and_judges' || poll.voting_permissions === 'judges_only') {
        // Verify judge is authorized for this poll
        const isJudge = await isJudgeForPoll(validated.pollId, validated.judgeEmail);
        if (!isJudge) {
          return NextResponse.json(
            { error: 'You are not authorized as a judge for this poll' },
            { status: 403 }
          );
        }
        
        // Check if judge has already voted
        judgeExistingVote = await getVoteByJudgeEmail(validated.pollId, validated.judgeEmail);
        if (judgeExistingVote) {
          // If vote editing is not allowed, return error
          if (!poll.allow_vote_editing) {
            return NextResponse.json(
              { error: 'You have already voted for this poll. Vote editing is not allowed.' },
              { status: 400 }
            );
          }
          // Vote editing is allowed - we'll update the vote later in the flow
        }
      }
    } else {
      return NextResponse.json(
        { error: 'Either token (for voters) or judgeEmail (for judges) is required' },
        { status: 400 }
      );
    }
    
    // Check if poll is active
    // For voters_first sequence, allow judges to vote after end_time
    // (voter period is considered over, so judges can vote)
    const now = new Date();
    const isJudgeVoteAfterPeriod = voteType === 'judge' && poll.voting_sequence === 'voters_first' && now > poll.end_time;
    
    if (now < poll.start_time || (!isJudgeVoteAfterPeriod && now > poll.end_time)) {
      return NextResponse.json(
        { error: 'Poll is not currently active' },
        { status: 400 }
      );
    }
    
    // Get all teams for the poll
    const allTeams = await getTeamsByPoll(poll.poll_id);
    const teamIds = new Set(allTeams.map(t => t.team_id));
    
    // Validate and process vote based on voting mode
    let voteOptions: {
      teamIdTarget?: string | null;
      teams?: string[];
      rankings?: Array<{ teamId: string; rank: number; points: number; reason?: string }>;
    } = {};
    
    if (poll.voting_mode === 'single') {
      // Single vote mode
      if (!validated.teamIdTarget) {
        return NextResponse.json(
          { error: 'teamIdTarget is required for single vote mode' },
          { status: 400 }
        );
      }
      
      // Verify target team exists and belongs to poll
      if (!teamIds.has(validated.teamIdTarget)) {
        return NextResponse.json(
          { error: 'Invalid target team' },
          { status: 400 }
        );
      }
      
      // Check self-vote exclusion for voters
      if (voteType === 'voter' && !poll.allow_self_vote && voterTeamId === validated.teamIdTarget) {
        return NextResponse.json(
          { error: 'Self-voting is not allowed' },
          { status: 400 }
        );
      }
      
      voteOptions.teamIdTarget = validated.teamIdTarget;
    } else if (poll.voting_mode === 'multiple') {
      // Multiple vote mode
      if (!validated.teams || validated.teams.length === 0) {
        return NextResponse.json(
          { error: 'teams array is required for multiple vote mode' },
          { status: 400 }
        );
      }
      
      // Verify all teams exist and belong to poll
      for (const teamId of validated.teams) {
        if (!teamIds.has(teamId)) {
          return NextResponse.json(
            { error: `Invalid team ID: ${teamId}` },
            { status: 400 }
          );
        }
        
        // Check self-vote exclusion for voters
        if (voteType === 'voter' && !poll.allow_self_vote && voterTeamId === teamId) {
          return NextResponse.json(
            { error: 'Self-voting is not allowed' },
            { status: 400 }
          );
        }
      }
      
      voteOptions.teams = validated.teams;
    } else if (poll.voting_mode === 'ranked') {
      // Ranked vote mode
      if (!validated.rankings || validated.rankings.length === 0) {
        return NextResponse.json(
          { error: 'rankings array is required for ranked vote mode' },
          { status: 400 }
        );
      }
      
      // Verify all teams exist and belong to poll
      const rankedTeamIds = new Set<string>();
      for (const ranking of validated.rankings) {
        if (!teamIds.has(ranking.teamId)) {
          return NextResponse.json(
            { error: `Invalid team ID: ${ranking.teamId}` },
            { status: 400 }
          );
        }
        
        // Check for duplicate teams
        if (rankedTeamIds.has(ranking.teamId)) {
          return NextResponse.json(
            { error: `Duplicate team ID in rankings: ${ranking.teamId}` },
            { status: 400 }
          );
        }
        rankedTeamIds.add(ranking.teamId);
        
        // Check self-vote exclusion for voters
        if (voteType === 'voter' && !poll.allow_self_vote && voterTeamId === ranking.teamId) {
          return NextResponse.json(
            { error: 'Self-voting is not allowed' },
            { status: 400 }
          );
        }
      }
      
      // Process rankings and calculate points dynamically based on number of teams
      // Points: rank 1 gets N points, rank 2 gets N-1, etc.
      const numberOfTeams = allTeams.length;
      voteOptions.rankings = processRankings(
        validated.rankings.map(r => ({ teamId: r.teamId, rank: r.rank, reason: r.reason })),
        numberOfTeams
      );
    }
    
    // Create vote hash for blockchain
    const timestamp = Math.floor(Date.now() / 1000);
    let txHash: string | null = null;
    
    // Submit to blockchain for all vote types
    try {
      // Create vote hash based on voting mode
      let voteHash: string;
      if (poll.voting_mode === 'single' && voteOptions.teamIdTarget) {
        voteHash = createVoteHash(
          validated.token || judgeEmail || '',
          poll.poll_id,
          voteOptions.teamIdTarget,
          timestamp
        );
      } else if (poll.voting_mode === 'multiple' && voteOptions.teams) {
        // Hash all selected teams
        const teamsStr = voteOptions.teams.sort().join(',');
        voteHash = crypto.createHash('sha256')
          .update(`${validated.token || judgeEmail || ''}:${poll.poll_id}:${teamsStr}:${timestamp}`)
          .digest('hex');
      } else if (poll.voting_mode === 'ranked' && voteOptions.rankings) {
        // Hash rankings
        const rankingsStr = voteOptions.rankings
          .sort((a, b) => a.rank - b.rank)
          .map(r => `${r.teamId}:${r.rank}`)
          .join(',');
        voteHash = crypto.createHash('sha256')
          .update(`${validated.token || judgeEmail || ''}:${poll.poll_id}:${rankingsStr}:${timestamp}`)
          .digest('hex');
      } else {
        voteHash = crypto.createHash('sha256')
          .update(`${validated.token || judgeEmail || ''}:${poll.poll_id}:${timestamp}`)
          .digest('hex');
      }
      
      // Prepare vote data for blockchain
      const blockchainVoteData: any = {
        pollId: poll.poll_id,
        voteType,
        votingMode: poll.voting_mode,
        timestamp,
        voteHash,
      };
      
      if (voteOptions.teamIdTarget) {
        blockchainVoteData.teamIdTarget = voteOptions.teamIdTarget;
      }
      if (voteOptions.teams) {
        blockchainVoteData.teams = voteOptions.teams;
      }
      if (voteOptions.rankings) {
        blockchainVoteData.rankings = voteOptions.rankings;
      }
      if (judgeEmail) {
        blockchainVoteData.judgeEmail = judgeEmail;
      }
      if (tokenHash) {
        // Store hash of token, not the actual token for privacy
        blockchainVoteData.tokenHash = tokenHash;
      }
      
      txHash = await submitVoteToBlockchain(blockchainVoteData);
    } catch (error) {
      console.error('Blockchain submission failed:', error);
      // Continue even if blockchain fails - vote is still recorded in database
    }
    
    // Check if vote already exists (for vote editing)
    let vote;
    let isVoteUpdate = false;
    
    if (voteType === 'voter' && existingVote) {
      // Update existing voter vote
      vote = await updateVote(existingVote.vote_id, {
        teamIdTarget: voteOptions.teamIdTarget || null,
        teams: voteOptions.teams || null,
        rankings: voteOptions.rankings || null,
        txHash,
      });
      isVoteUpdate = true;
    } else if (voteType === 'judge' && judgeExistingVote) {
      // Update existing judge vote
      vote = await updateVote(judgeExistingVote.vote_id, {
        teamIdTarget: voteOptions.teamIdTarget || null,
        teams: voteOptions.teams || null,
        rankings: voteOptions.rankings || null,
        txHash,
      });
      isVoteUpdate = true;
    } else {
      // Create new vote record
      vote = await createVote(
        poll.poll_id,
        voteType,
        {
          tokenHash,
          judgeEmail,
          teamIdTarget: voteOptions.teamIdTarget || undefined,
          teams: voteOptions.teams || undefined,
          rankings: voteOptions.rankings || undefined,
          txHash,
        }
      );
    }
    
    // Mark token as used if it's a voter vote (only on first vote, not on update)
    if (validated.token && !isVoteUpdate) {
      const tokenRecord = await findTokenByPlainToken(validated.token);
      if (tokenRecord) {
        await markTokenAsUsed(tokenRecord.token_id);
      }
    }
    
    // Log audit
    await logAudit(
      isVoteUpdate ? 'vote_updated' : 'vote_submitted',
      null,
      poll.poll_id,
      null,
      {
        voteId: vote.vote_id,
        voteType,
        votingMode: poll.voting_mode,
        txHash,
        isUpdate: isVoteUpdate,
      },
      getClientIp(req.headers)
    );
    
    return NextResponse.json({
      voteId: vote.vote_id,
      txHash: txHash || null,
      explorerUrl: txHash ? getExplorerUrl(txHash) : null,
      timestamp: vote.timestamp.toISOString(),
      message: isVoteUpdate ? 'Vote updated successfully' : 'Vote submitted successfully',
      isUpdate: isVoteUpdate,
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
