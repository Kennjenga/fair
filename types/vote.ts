/**
 * Vote-related type definitions
 */

/**
 * Vote submission request
 */
export interface SubmitVoteRequest {
  token: string;
  teamName: string;
  teamIdTarget: string;
}

/**
 * Vote database record
 */
export interface Vote {
  voteId: string;
  pollId: string;
  tokenHash: string;
  teamIdTarget: string;
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

