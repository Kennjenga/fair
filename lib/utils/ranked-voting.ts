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
 * Calculate points for a single rank position
 * Always uses linear calculation based on numberOfTeams to ensure points decrease as rank increases
 * Formula: points = numberOfTeams - rank + 1
 * 
 * Examples:
 * - 8 teams: Rank 1 = 8 pts, Rank 2 = 7 pts, Rank 3 = 6 pts, ..., Rank 8 = 1 pt
 * - 10 teams: Rank 1 = 10 pts, Rank 2 = 9 pts, Rank 3 = 8 pts, ..., Rank 10 = 1 pt
 * 
 * @param rank The rank position (1, 2, 3, etc.)
 * @param numberOfTeams The total number of teams (for dynamic point calculation)
 * @returns Points for this rank, guaranteed to decrease as rank increases and never negative
 */
function calculatePointsForRank(
  rank: number,
  numberOfTeams: number
): number {
  // Always use linear calculation: rank 1 gets N points, rank 2 gets N-1, etc.
  // Formula: points = numberOfTeams - rank + 1
  // This ensures points always decrease as rank increases
  const points = numberOfTeams - rank + 1;
  
  // Ensure points are never negative (safety check)
  return Math.max(0, points);
}

/**
 * Calculate total weighted points for a team from ranked votes
 * @param teamId The team ID
 * @param rankings Array of vote rankings (each vote can have multiple rankings)
 * @param numberOfTeams The total number of teams (for dynamic point calculation)
 * @param weight The weight multiplier (voter_weight or judge_weight)
 * @returns Total weighted points for the team
 * 
 * IMPORTANT: This function always recalculates points based on the current numberOfTeams,
 * ignoring any stored points in the database. This ensures accuracy even if:
 * - Teams were added/removed after votes were cast
 * - Stored points were calculated with a different number of teams
 * - There are any inconsistencies in stored data
 * 
 * CRITICAL: Points are calculated using linear formula (numberOfTeams - rank + 1),
 * ensuring points always decrease as rank increases.
 */
export function calculateTeamRankedPoints(
  teamId: string,
  rankings: VoteRanking[][],
  numberOfTeams: number,
  weight: number
): number {
  let totalPoints = 0;
  
  for (const voteRankings of rankings) {
    // Find the ranking for this team in this vote
    const teamRanking = voteRankings.find(r => r.teamId === teamId);
    if (teamRanking) {
      // Always recalculate points using linear formula: numberOfTeams - rank + 1
      // This ensures accuracy regardless of what's stored in the database
      // Stored points are kept for audit purposes but not used for calculation
      const points = calculatePointsForRank(
        teamRanking.rank,
        numberOfTeams
      );
      
      // Add weighted points to total
      totalPoints += points * weight;
    }
  }
  
  return totalPoints;
}

/**
 * Process rankings and calculate points for each team
 * Points are calculated using linear formula: numberOfTeams - rank + 1
 * This ensures points always decrease as rank increases
 * @param rankings Array of vote rankings
 * @param numberOfTeams The total number of teams in the poll
 * @returns Array of rankings with calculated points
 */
export function processRankings(
  rankings: Array<{ teamId: string; rank: number; reason?: string }>,
  numberOfTeams: number
): VoteRanking[] {
  return rankings.map(ranking => {
    // Calculate points using linear formula: numberOfTeams - rank + 1
    // This ensures consistency between vote submission and results calculation
    const points = calculatePointsForRank(
      ranking.rank,
      numberOfTeams
    );
    
    return {
      teamId: ranking.teamId,
      rank: ranking.rank,
      points: points, // calculatePointsForRank already ensures non-negative
      reason: ranking.reason,
    };
  });
}

