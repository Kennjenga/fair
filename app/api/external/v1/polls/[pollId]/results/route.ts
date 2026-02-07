import { NextRequest, NextResponse } from 'next/server';
import { withExternalApiKey } from '@/lib/auth/external-api';
import type { ExternalApiRequest } from '@/lib/auth/external-api';
import { getPollById } from '@/lib/repositories/polls';
import { getHackathonById } from '@/lib/repositories/hackathons';
import { getVotesByPoll } from '@/lib/repositories/votes';
import { getTeamsByPoll } from '@/lib/repositories/teams';
import { calculatePollResults } from '@/lib/utils/results';
import { getExplorerUrl } from '@/lib/blockchain/avalanche';

/**
 * Check if the API key's admin has access to this poll (created poll or owns hackathon).
 */
async function canAccessPoll(adminId: string, pollId: string): Promise<boolean> {
  const poll = await getPollById(pollId);
  if (!poll) return false;
  if (poll.created_by === adminId) return true;
  if (poll.hackathon_id) {
    const hackathon = await getHackathonById(poll.hackathon_id);
    if (hackathon && hackathon.created_by === adminId) return true;
  }
  return false;
}

/**
 * GET /api/external/v1/polls/:pollId/results
 * Get poll results. Allowed if results are public or the poll is owned by the API key's admin.
 * Requires X-API-Key or Authorization: Bearer <key>.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ pollId: string }> }
) {
  return withExternalApiKey(async (request: ExternalApiRequest) => {
    try {
      const { adminId } = request.externalClient;
      const { pollId } = await context.params;

      const poll = await getPollById(pollId);
      if (!poll) {
        return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
      }

      const isPublic = poll.is_public_results;
      const hasAccess = isPublic || (await canAccessPoll(adminId, pollId));
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Results are not publicly available' },
          { status: 403 }
        );
      }

      const votes = await getVotesByPoll(pollId);
      const teams = await getTeamsByPoll(pollId);
      const teamNameMap = new Map(teams.map((t) => [t.team_id, t.team_name]));
      const teamResults = calculatePollResults(poll, votes, teams.length);
      const resultsWithNames = teamResults
        .map((result) => ({
          teamId: result.teamId,
          teamName: teamNameMap.get(result.teamId) || 'Unknown',
          totalScore: result.totalScore,
          voterScore: result.voterPoints,
          judgeScore: result.judgePoints,
          voteCount: result.voterVotes + result.judgeVotes,
          rankedPoints: result.totalScore,
          voterVotes: result.voterVotes,
          judgeVotes: result.judgeVotes,
          positionCounts: result.positionCounts,
        }))
        .sort((a, b) => b.totalScore - a.totalScore);

      const votesWithExplorer = votes
        .filter((v) => v.tx_hash)
        .map((v) => ({
          voteId: v.vote_id,
          voteType: v.vote_type,
          votingMode: poll.voting_mode,
          timestamp: v.timestamp,
          txHash: v.tx_hash,
          explorerUrl: v.tx_hash ? getExplorerUrl(v.tx_hash) : null,
          teamIdTarget: v.team_id_target,
          teams: v.teams,
          rankings: v.rankings,
        }));

      const voterVotes = votes.filter((v) => v.vote_type === 'voter').length;
      const judgeVotes = votes.filter((v) => v.vote_type === 'judge').length;
      const quorumStatus = {
        voterQuorumMet: true,
        judgeQuorumMet: true,
        voterQuorumRequired: poll.min_voter_participation ?? null,
        judgeQuorumRequired: poll.min_judge_participation ?? null,
        voterQuorumActual: voterVotes,
        judgeQuorumActual: judgeVotes,
        quorumMet: true,
      };
      if (poll.min_voter_participation != null) {
        quorumStatus.voterQuorumMet = voterVotes >= poll.min_voter_participation;
        if (!quorumStatus.voterQuorumMet) quorumStatus.quorumMet = false;
      }
      if (poll.min_judge_participation != null) {
        quorumStatus.judgeQuorumMet = judgeVotes >= poll.min_judge_participation;
        if (!quorumStatus.judgeQuorumMet) quorumStatus.quorumMet = false;
      }

      return NextResponse.json({
        poll: {
          pollId: poll.poll_id,
          name: poll.name,
          votingMode: poll.voting_mode,
          votingPermissions: poll.voting_permissions,
          voterWeight: poll.voter_weight,
          judgeWeight: poll.judge_weight,
          startTime: poll.start_time,
          endTime: poll.end_time,
          isPublicResults: poll.is_public_results,
        },
        results: {
          teams: resultsWithNames,
          totalVotes: votes.length,
          voterVotes,
          judgeVotes,
          votes: votesWithExplorer,
          quorumStatus,
        },
      });
    } catch (error) {
      console.error('External API get results error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}
