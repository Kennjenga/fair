/**
 * Vote-related type definitions
 */

/**
 * Vote type
 */
export type VoteType = 'voter' | 'judge';

/**
 * Vote ranking entry for ranked voting
 */
export interface VoteRanking {
  teamId: string;
  rank: number;
  points: number;
  reason?: string;
}

/**
 * Vote submission request
 * Supports three voting modes:
 * - single: teamIdTarget (string)
 * - multiple: teams (string[])
 * - ranked: rankings (VoteRanking[])
 */
export interface SubmitVoteRequest {
  token?: string; // Required for voter votes
  judgeEmail?: string; // Required for judge votes
  teamName?: string; // Required if requireTeamNameGate is true
  // Single vote mode
  teamIdTarget?: string;
  // Multiple vote mode
  teams?: string[];
  // Ranked vote mode
  rankings?: VoteRanking[];
}

/**
 * Vote database record
 */
export interface Vote {
  voteId: string;
  pollId: string;
  tokenHash: string | null; // Nullable for judge votes
  voteType: VoteType;
  judgeEmail: string | null; // Nullable for voter votes
  teamIdTarget: string | null; // For single vote mode (backward compatibility)
  teams: string[] | null; // For multiple vote mode
  rankings: VoteRanking[] | null; // For ranked vote mode
  timestamp: Date;
  txHash: string | null;
  createdAt: Date;
}

/**
 * Vote confirmation response
 */
export interface VoteConfirmation {
  voteId: string;
  txHash: string;
  explorerUrl: string;
  timestamp: Date;
}

