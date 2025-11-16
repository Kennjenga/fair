import { NextRequest, NextResponse } from 'next/server';
import { getPollById } from '@/lib/repositories/polls';
import { isJudgeForPoll, getJudgesByPoll } from '@/lib/repositories/judges';
import { hasJudgeVoted, getVoteByJudgeEmail } from '@/lib/repositories/votes';
import { getTeamsByPoll } from '@/lib/repositories/teams';
import { getExplorerUrl } from '@/lib/blockchain/avalanche';

/**
 * Validate judge access and get poll/teams for voting
 * @swagger
 * /api/v1/vote/validate-judge:
 *   post:
 *     summary: Validate judge access and get poll/teams
 *     tags: [Vote]
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pollId, judgeEmail } = body;
    
    if (!pollId || !judgeEmail) {
      return NextResponse.json(
        { error: 'pollId and judgeEmail are required' },
        { status: 400 }
      );
    }
    
    // Get poll
    const poll = await getPollById(pollId);
    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }
    
    // Verify judge is authorized
    const isJudge = await isJudgeForPoll(pollId, judgeEmail);
    if (!isJudge) {
      return NextResponse.json(
        { error: 'You are not authorized as a judge for this poll' },
        { status: 403 }
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
    
    // Get all teams for the poll
    const teams = await getTeamsByPoll(pollId);
    
    // Check voting sequence - if voters_first, ensure voters have finished
    if (poll.voting_sequence === 'voters_first') {
      // Get all voter tokens and votes
      const { getTokensByPoll } = await import('@/lib/repositories/tokens');
      const { getVotesByPoll } = await import('@/lib/repositories/votes');
      
      const tokens = await getTokensByPoll(pollId);
      const voterVotes = await getVotesByPoll(pollId, 'voter');
      
      // If there are voters registered but not all have voted, block judges
      if (tokens.length > 0 && voterVotes.length < tokens.length) {
        return NextResponse.json(
          { 
            error: 'Judges cannot vote yet. Waiting for all voters to complete their votes.',
            waitingFor: `${voterVotes.length}/${tokens.length} voters have voted`
          },
          { status: 403 }
        );
      }
    }
    
    // Check if judge has already voted
    const existingVote = await getVoteByJudgeEmail(pollId, judgeEmail);
    
    if (existingVote) {
      // Judge has already voted - return existing vote information
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
          maxRankedPositions: poll.max_ranked_positions,
          votingSequence: poll.voting_sequence,
        },
        availableTeams: teams.map(t => ({
          teamId: t.team_id,
          teamName: t.team_name,
          projectName: t.project_name,
          projectDescription: t.project_description,
          pitch: t.pitch,
          liveSiteUrl: t.live_site_url,
          githubUrl: t.github_url,
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
    
    // Judge has not voted yet - return poll and teams for voting
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
        maxRankedPositions: poll.max_ranked_positions,
        votingSequence: poll.voting_sequence,
      },
      availableTeams: teams.map(t => ({
        teamId: t.team_id,
        teamName: t.team_name,
        projectName: t.project_name,
        projectDescription: t.project_description,
        pitch: t.pitch,
        liveSiteUrl: t.live_site_url,
        githubUrl: t.github_url,
      })),
    });
  } catch (error) {
    console.error('Validate judge error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

