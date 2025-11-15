import type { VoteRanking } from '@/types/vote';
import type { RankPointsConfig } from '@/types/poll';

/**
 * Calculate points for a ranking based on rank points configuration
 * @param rank The rank position (1, 2, 3, etc.)
 * @param rankPointsConfig The configuration mapping ranks to points
 * @returns The points for this rank, or 0 if not configured
 */
export function calculateRankPoints(
  rank: number,
  rankPointsConfig: RankPointsConfig
): number {
  const rankKey = rank.toString();
  return rankPointsConfig[rankKey] || 0;
}

/**
 * Calculate total weighted points for a team from ranked votes
 * @param teamId The team ID
 * @param rankings Array of vote rankings (each vote can have multiple rankings)
 * @param numberOfTeams The total number of teams (for dynamic point calculation)
 * @param weight The weight multiplier (voter_weight or judge_weight)
 * @param rankPointsConfig Optional configuration mapping ranks to points (for backward compatibility)
 * @returns Total weighted points for the team
 */
export function calculateTeamRankedPoints(
  teamId: string,
  rankings: VoteRanking[][],
  numberOfTeams: number,
  weight: number,
  rankPointsConfig?: RankPointsConfig
): number {
  let totalPoints = 0;
  
  for (const voteRankings of rankings) {
    // Find the ranking for this team in this vote
    const teamRanking = voteRankings.find(r => r.teamId === teamId);
    if (teamRanking) {
      // Points should already be calculated in the ranking when vote was submitted
      // But if not set (undefined), calculate dynamically
      let points = teamRanking.points;
      if (points === undefined || points === null) {
        if (rankPointsConfig && rankPointsConfig[teamRanking.rank.toString()] !== undefined) {
          points = rankPointsConfig[teamRanking.rank.toString()];
        } else {
          // Dynamic calculation: rank 1 gets N points, rank 2 gets N-1, etc.
          points = numberOfTeams - teamRanking.rank + 1;
        }
      }
      // Note: points === 0 is valid (for last place), so we don't recalculate in that case
      totalPoints += points * weight;
    }
  }
  
  return totalPoints;
}

/**
 * Process rankings and calculate points for each team
 * Points are calculated as: N - rank + 1, where N is the number of teams
 * So rank 1 gets N points, rank 2 gets N-1 points, etc.
 * @param rankings Array of vote rankings
 * @param numberOfTeams The total number of teams in the poll
 * @param rankPointsConfig Optional configuration mapping ranks to points (for backward compatibility)
 * @returns Array of rankings with calculated points
 */
export function processRankings(
  rankings: Array<{ teamId: string; rank: number; reason?: string }>,
  numberOfTeams: number,
  rankPointsConfig?: RankPointsConfig
): VoteRanking[] {
  return rankings.map(ranking => {
    // Calculate points: N - rank + 1
    // If rankPointsConfig is provided and has a value for this rank, use it (backward compatibility)
    // Otherwise, use the dynamic calculation
    let points: number;
    if (rankPointsConfig && rankPointsConfig[ranking.rank.toString()] !== undefined) {
      points = rankPointsConfig[ranking.rank.toString()];
    } else {
      // Dynamic calculation: rank 1 gets N points, rank 2 gets N-1, etc.
      points = numberOfTeams - ranking.rank + 1;
    }
    
    return {
      teamId: ranking.teamId,
      rank: ranking.rank,
      points: Math.max(0, points), // Ensure points are never negative
      reason: ranking.reason,
    };
  });
}

