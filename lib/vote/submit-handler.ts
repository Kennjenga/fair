import { NextRequest, NextResponse } from 'next/server';
import { submitVoteSchema } from '@/lib/validation/schemas';
import { findTokenByPlainToken, markTokenAsUsed } from '@/lib/repositories/tokens';
import { getPollById } from '@/lib/repositories/polls';
import { getTeamById, getTeamsByPoll } from '@/lib/repositories/teams';
import { hashToken } from '@/lib/utils/token';
import { createVote, getVoteByTokenHash, getVoteByJudgeEmail, updateVote } from '@/lib/repositories/votes';
import { isJudgeForPoll } from '@/lib/repositories/judges';
import { processRankings } from '@/lib/utils/ranked-voting';
import { createVoteHash, submitVoteToBlockchain, getExplorerUrl, type VoteData } from '@/lib/blockchain/avalanche';
import { logAudit, getClientIp } from '@/lib/utils/audit';
import { getHackathonByIdExtended } from '@/lib/repositories/hackathons-extended';
import crypto from 'crypto';

/**
 * Shared handler for submitting a vote.
 * Used by both /api/v1/vote/submit and /api/external/v1/vote/submit.
 */
export async function handleSubmitVote(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const validated = submitVoteSchema.parse(body);

    let poll: Awaited<ReturnType<typeof getPollById>>;
    let voteType: 'voter' | 'judge';
    let tokenHash: string | null = null;
    let judgeEmail: string | null = null;
    let voterTeamId: string | null = null;
    let existingVote: Awaited<ReturnType<typeof getVoteByTokenHash>> = null;
    let judgeExistingVote: Awaited<ReturnType<typeof getVoteByJudgeEmail>> = null;

    if (validated.token) {
      voteType = 'voter';
      const tokenRecord = await findTokenByPlainToken(validated.token);
      if (!tokenRecord) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
      }
      if (tokenRecord.used) {
        return NextResponse.json({ error: 'Token has already been used' }, { status: 400 });
      }
      poll = await getPollById(tokenRecord.poll_id);
      if (!poll) {
        return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
      }
      if (poll.hackathon_id) {
        const hackathon = await getHackathonByIdExtended(poll.hackathon_id);
        if (hackathon) {
          if (hackathon.status === 'closed' || hackathon.status === 'finalized') {
            return NextResponse.json(
              { error: `Voting is closed. The hackathon status is '${hackathon.status}'.`, hackathonStatus: hackathon.status },
              { status: 403 }
            );
          }
          if (hackathon.voting_closes_at) {
            const votingClosesAt = new Date(hackathon.voting_closes_at);
            if (new Date() >= votingClosesAt) {
              return NextResponse.json(
                { error: `Voting closed at ${votingClosesAt.toLocaleString()}. No new votes can be submitted.`, votingClosesAt: votingClosesAt.toISOString() },
                { status: 403 }
              );
            }
          }
        }
      }
      if (poll.voting_permissions === 'judges_only') {
        return NextResponse.json({ error: 'This poll only allows judges to vote' }, { status: 403 });
      }
      tokenHash = hashToken(validated.token);
      voterTeamId = tokenRecord.team_id;
      existingVote = await getVoteByTokenHash(tokenHash);
      if (existingVote && !poll.allow_vote_editing) {
        return NextResponse.json({
          voteId: existingVote.vote_id,
          txHash: existingVote.tx_hash ?? null,
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
    } else if (validated.judgeEmail && validated.pollId) {
      voteType = 'judge';
      judgeEmail = validated.judgeEmail;
      poll = await getPollById(validated.pollId);
      if (!poll) {
        return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
      }
      if (poll.voting_permissions === 'voters_only') {
        return NextResponse.json({ error: 'This poll only allows voters to vote, not judges' }, { status: 403 });
      }
      const isJudge = await isJudgeForPoll(validated.pollId, validated.judgeEmail);
      if (!isJudge) {
        return NextResponse.json({ error: 'You are not authorized as a judge for this poll' }, { status: 403 });
      }
      judgeExistingVote = await getVoteByJudgeEmail(validated.pollId, validated.judgeEmail);
      if (judgeExistingVote && !poll.allow_vote_editing) {
        return NextResponse.json(
          { error: 'You have already voted for this poll. Vote editing is not allowed.' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Either token (for voters) or judgeEmail (for judges) is required' },
        { status: 400 }
      );
    }

    const now = new Date();
    const isJudgeVoteAfterPeriod = voteType === 'judge' && poll.voting_sequence === 'voters_first' && now > poll.end_time;
    if (now < poll.start_time || (!isJudgeVoteAfterPeriod && now > poll.end_time)) {
      return NextResponse.json({ error: 'Poll is not currently active' }, { status: 400 });
    }

    const allTeams = await getTeamsByPoll(poll.poll_id);
    const teamIds = new Set(allTeams.map((t) => t.team_id));
    let voteOptions: {
      teamIdTarget?: string | null;
      teams?: string[];
      rankings?: Array<{ teamId: string; rank: number; points: number; reason?: string }>;
    } = {};

    if (poll.voting_mode === 'single') {
      if (!validated.teamIdTarget) {
        return NextResponse.json({ error: 'teamIdTarget is required for single vote mode' }, { status: 400 });
      }
      if (voteType === 'judge') {
        const reason = validated.reason?.trim();
        if (!reason) {
          return NextResponse.json({ error: 'Judges must provide a reason for their vote' }, { status: 400 });
        }
        voteOptions.rankings = processRankings([{ teamId: validated.teamIdTarget, rank: 1, reason }], allTeams.length);
      }
      if (!teamIds.has(validated.teamIdTarget)) {
        return NextResponse.json({ error: 'Invalid target team' }, { status: 400 });
      }
      if (voteType === 'voter' && !poll.allow_self_vote && voterTeamId === validated.teamIdTarget) {
        return NextResponse.json({ error: 'Self-voting is not allowed' }, { status: 400 });
      }
      voteOptions.teamIdTarget = validated.teamIdTarget;
    } else if (poll.voting_mode === 'multiple') {
      if (!validated.teams || validated.teams.length === 0) {
        return NextResponse.json({ error: 'teams array is required for multiple vote mode' }, { status: 400 });
      }
      if (voteType === 'judge') {
        const reason = validated.reason?.trim();
        if (!reason) {
          return NextResponse.json({ error: 'Judges must provide a reason for their vote' }, { status: 400 });
        }
        voteOptions.rankings = processRankings(
          validated.teams.map((teamId, i) => ({ teamId, rank: i + 1, reason })),
          allTeams.length
        );
      }
      for (const teamId of validated.teams) {
        if (!teamIds.has(teamId)) {
          return NextResponse.json({ error: `Invalid team ID: ${teamId}` }, { status: 400 });
        }
        if (voteType === 'voter' && !poll.allow_self_vote && voterTeamId === teamId) {
          return NextResponse.json({ error: 'Self-voting is not allowed' }, { status: 400 });
        }
      }
      voteOptions.teams = validated.teams;
    } else if (poll.voting_mode === 'ranked') {
      if (!validated.rankings || validated.rankings.length === 0) {
        return NextResponse.json({ error: 'rankings array is required for ranked vote mode' }, { status: 400 });
      }
      const rankedTeamIds = new Set<string>();
      for (const ranking of validated.rankings) {
        if (!teamIds.has(ranking.teamId)) {
          return NextResponse.json({ error: `Invalid team ID: ${ranking.teamId}` }, { status: 400 });
        }
        if (rankedTeamIds.has(ranking.teamId)) {
          return NextResponse.json({ error: `Duplicate team ID in rankings: ${ranking.teamId}` }, { status: 400 });
        }
        rankedTeamIds.add(ranking.teamId);
        if (voteType === 'voter' && !poll.allow_self_vote && voterTeamId === ranking.teamId) {
          return NextResponse.json({ error: 'Self-voting is not allowed' }, { status: 400 });
        }
      }
      voteOptions.rankings = processRankings(
        validated.rankings.map((r) => ({ teamId: r.teamId, rank: r.rank, reason: r.reason })),
        allTeams.length
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    let txHash: string | null = null;
    try {
      let voteHash: string;
      if (poll.voting_mode === 'single' && voteOptions.teamIdTarget) {
        voteHash = createVoteHash(validated.token ?? judgeEmail ?? '', poll.poll_id, voteOptions.teamIdTarget, timestamp);
      } else if (poll.voting_mode === 'multiple' && voteOptions.teams) {
        const teamsStr = voteOptions.teams.sort().join(',');
        voteHash = crypto.createHash('sha256').update(`${validated.token ?? judgeEmail ?? ''}:${poll.poll_id}:${teamsStr}:${timestamp}`).digest('hex');
      } else if (poll.voting_mode === 'ranked' && voteOptions.rankings) {
        const rankingsStr = voteOptions.rankings.sort((a, b) => a.rank - b.rank).map((r) => `${r.teamId}:${r.rank}`).join(',');
        voteHash = crypto.createHash('sha256').update(`${validated.token ?? judgeEmail ?? ''}:${poll.poll_id}:${rankingsStr}:${timestamp}`).digest('hex');
      } else {
        voteHash = crypto.createHash('sha256').update(`${validated.token ?? judgeEmail ?? ''}:${poll.poll_id}:${timestamp}`).digest('hex');
      }
      const blockchainVoteData: VoteData = {
        pollId: poll.poll_id,
        voteType,
        votingMode: poll.voting_mode,
        timestamp,
        voteHash,
        ...(voteOptions.teamIdTarget && { teamIdTarget: voteOptions.teamIdTarget }),
        ...(voteOptions.teams && { teams: voteOptions.teams }),
        ...(voteOptions.rankings && { rankings: voteOptions.rankings }),
        ...(judgeEmail && { judgeEmail }),
        ...(tokenHash && { tokenHash }),
      };
      txHash = await submitVoteToBlockchain(blockchainVoteData);
    } catch (error) {
      console.error('Blockchain submission failed:', error);
    }

    let vote;
    let isVoteUpdate = false;
    if (voteType === 'voter' && existingVote) {
      vote = await updateVote(existingVote.vote_id, {
        teamIdTarget: voteOptions.teamIdTarget ?? null,
        teams: voteOptions.teams ?? null,
        rankings: voteOptions.rankings ?? null,
        txHash,
      });
      isVoteUpdate = true;
    } else if (voteType === 'judge' && judgeExistingVote) {
      vote = await updateVote(judgeExistingVote.vote_id, {
        teamIdTarget: voteOptions.teamIdTarget ?? null,
        teams: voteOptions.teams ?? null,
        rankings: voteOptions.rankings ?? null,
        txHash,
      });
      isVoteUpdate = true;
    } else {
      vote = await createVote(poll.poll_id, voteType, {
        tokenHash: tokenHash ?? undefined,
        judgeEmail: judgeEmail ?? undefined,
        teamIdTarget: voteOptions.teamIdTarget ?? undefined,
        teams: voteOptions.teams ?? undefined,
        rankings: voteOptions.rankings ?? undefined,
        txHash: txHash ?? undefined,
      });
    }

    if (validated.token && !isVoteUpdate) {
      const tokenRecord = await findTokenByPlainToken(validated.token);
      if (tokenRecord) await markTokenAsUsed(tokenRecord.token_id);
    }

    await logAudit(
      isVoteUpdate ? 'vote_updated' : 'vote_submitted',
      null,
      poll.poll_id,
      null,
      { voteId: vote.vote_id, voteType, votingMode: poll.voting_mode, txHash, isUpdate: isVoteUpdate },
      getClientIp(req.headers)
    );

    return NextResponse.json({
      voteId: vote.vote_id,
      txHash: txHash ?? null,
      explorerUrl: txHash ? getExplorerUrl(txHash) : null,
      timestamp: vote.timestamp.toISOString(),
      message: isVoteUpdate ? 'Vote updated successfully' : 'Vote submitted successfully',
      isUpdate: isVoteUpdate,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error }, { status: 400 });
    }
    console.error('Submit vote error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
