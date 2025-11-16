import type { VoteRecord } from '@/lib/repositories/votes';
import type { PollRecord } from '@/lib/repositories/polls';
import type { VoteRanking } from '@/types/vote';
import { calculateTeamRankedPoints } from './ranked-voting';

/**
 * Result entry for a team
 */
export interface TeamResult {
  teamId: string;
  teamName: string;
  totalScore: number;
  voterVotes: number;
  judgeVotes: number;
  voterPoints: number;
  judgePoints: number;
  positionCounts?: Record<number, number>; // For ranked voting: position -> count
}

/**
 * Calculate results for a poll based on voting mode and weights
 * @param poll The poll record
 * @param votes All vote records for the poll
 * @param numberOfTeams Optional number of teams (for ranked voting point calculation)
 */
export function calculatePollResults(
  poll: PollRecord,
  votes: VoteRecord[],
  numberOfTeams?: number
): TeamResult[] {
  // Get all teams for this poll (through hackathon)
  // This will be called with teams already fetched
  const teamResults = new Map<string, TeamResult>();

  // Separate voter and judge votes
  const voterVotes = votes.filter(v => v.vote_type === 'voter');
  const judgeVotes = votes.filter(v => v.vote_type === 'judge');

  // Process votes based on voting mode
  if (poll.voting_mode === 'single') {
    // Single vote mode: count votes per team
    for (const vote of voterVotes) {
      if (vote.team_id_target) {
        const teamId = vote.team_id_target;
        if (!teamResults.has(teamId)) {
          teamResults.set(teamId, {
            teamId,
            teamName: '', // Will be filled from teams data
            totalScore: 0,
            voterVotes: 0,
            judgeVotes: 0,
            voterPoints: 0,
            judgePoints: 0,
          });
        }
        const result = teamResults.get(teamId)!;
        result.voterVotes += 1;
        result.voterPoints += poll.voter_weight;
      }
    }

    for (const vote of judgeVotes) {
      if (vote.team_id_target) {
        const teamId = vote.team_id_target;
        if (!teamResults.has(teamId)) {
          teamResults.set(teamId, {
            teamId,
            teamName: '',
            totalScore: 0,
            voterVotes: 0,
            judgeVotes: 0,
            voterPoints: 0,
            judgePoints: 0,
          });
        }
        const result = teamResults.get(teamId)!;
        result.judgeVotes += 1;
        result.judgePoints += poll.judge_weight;
      }
    }
  } else if (poll.voting_mode === 'multiple') {
    // Multiple vote mode: count each team in the teams array
    for (const vote of voterVotes) {
      if (vote.teams && Array.isArray(vote.teams)) {
        for (const teamId of vote.teams) {
          if (!teamResults.has(teamId)) {
            teamResults.set(teamId, {
              teamId,
              teamName: '',
              totalScore: 0,
              voterVotes: 0,
              judgeVotes: 0,
              voterPoints: 0,
              judgePoints: 0,
            });
          }
          const result = teamResults.get(teamId)!;
          result.voterVotes += 1;
          result.voterPoints += poll.voter_weight;
        }
      }
    }

    for (const vote of judgeVotes) {
      if (vote.teams && Array.isArray(vote.teams)) {
        for (const teamId of vote.teams) {
          if (!teamResults.has(teamId)) {
            teamResults.set(teamId, {
              teamId,
              teamName: '',
              totalScore: 0,
              voterVotes: 0,
              judgeVotes: 0,
              voterPoints: 0,
              judgePoints: 0,
            });
          }
          const result = teamResults.get(teamId)!;
          result.judgeVotes += 1;
          result.judgePoints += poll.judge_weight;
        }
      }
    }
  } else if (poll.voting_mode === 'ranked') {
    // Ranked vote mode: sum weighted points from rankings
    const voterRankings: VoteRanking[][] = voterVotes
      .filter(v => v.rankings && Array.isArray(v.rankings))
      .map(v => v.rankings!);

    const judgeRankings: VoteRanking[][] = judgeVotes
      .filter(v => v.rankings && Array.isArray(v.rankings))
      .map(v => v.rankings!);

    // Get all unique team IDs from rankings
    const allTeamIds = new Set<string>();
    voterRankings.forEach(rankings => {
      rankings.forEach(r => allTeamIds.add(r.teamId));
    });
    judgeRankings.forEach(rankings => {
      rankings.forEach(r => allTeamIds.add(r.teamId));
    });

    // Calculate points for each team
    // Always use numberOfTeams if provided (actual team count), never estimate from allTeamIds
    // This ensures accurate point calculation: rank 1 gets numberOfTeams points, rank 2 gets numberOfTeams-1, etc.
    if (!numberOfTeams || numberOfTeams <= 0) {
      throw new Error('numberOfTeams must be provided for ranked voting point calculation');
    }
    const teamsCount = numberOfTeams;
    
    // Calculate position counts for each team (how many times ranked at each position)
    const allRankings = [...voterRankings, ...judgeRankings];
    
    for (const teamId of allTeamIds) {
      const voterPoints = calculateTeamRankedPoints(
        teamId,
        voterRankings,
        teamsCount,
        poll.voter_weight,
        poll.rank_points_config
      );
      const judgePoints = calculateTeamRankedPoints(
        teamId,
        judgeRankings,
        teamsCount,
        poll.judge_weight,
        poll.rank_points_config
      );

      // Calculate position counts for this team
      const positionCounts: Record<number, number> = {};
      for (const rankings of allRankings) {
        const teamRanking = rankings.find(r => r.teamId === teamId);
        if (teamRanking) {
          positionCounts[teamRanking.rank] = (positionCounts[teamRanking.rank] || 0) + 1;
        }
      }

      teamResults.set(teamId, {
        teamId,
        teamName: '',
        totalScore: voterPoints + judgePoints,
        voterVotes: voterRankings.length,
        judgeVotes: judgeRankings.length,
        voterPoints,
        judgePoints,
        positionCounts: Object.keys(positionCounts).length > 0 ? positionCounts : undefined,
      });
    }
  }

  // Calculate total scores
  for (const result of teamResults.values()) {
    if (poll.voting_mode !== 'ranked') {
      result.totalScore = result.voterPoints + result.judgePoints;
    }
  }

  return Array.from(teamResults.values());
}

