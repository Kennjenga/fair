/**
 * Poll-related type definitions
 */

/**
 * Voting mode types
 */
export type VotingMode = 'single' | 'multiple' | 'ranked';

/**
 * Voting permissions types
 */
export type VotingPermissions = 'voters_only' | 'judges_only' | 'voters_and_judges';

/**
 * Rank points configuration
 * Maps rank position (as string key) to points value
 */
export interface RankPointsConfig {
  [rank: string]: number;
}

/**
 * Poll creation request
 */
export interface CreatePollRequest {
  hackathonId: string;
  name: string;
  startTime: string; // ISO 8601 date string
  endTime: string; // ISO 8601 date string
  votingMode?: VotingMode;
  votingPermissions?: VotingPermissions;
  voterWeight?: number;
  judgeWeight?: number;
  rankPointsConfig?: RankPointsConfig;
  allowSelfVote?: boolean;
  requireTeamNameGate?: boolean;
  isPublicResults?: boolean;
}

/**
 * Poll update request
 */
export interface UpdatePollRequest {
  name?: string;
  startTime?: string;
  endTime?: string;
  votingMode?: VotingMode;
  votingPermissions?: VotingPermissions;
  voterWeight?: number;
  judgeWeight?: number;
  rankPointsConfig?: RankPointsConfig;
  allowSelfVote?: boolean;
  requireTeamNameGate?: boolean;
  isPublicResults?: boolean;
}

/**
 * Poll database record
 */
export interface Poll {
  pollId: string;
  hackathonId: string;
  name: string;
  startTime: Date;
  endTime: Date;
  votingMode: VotingMode;
  votingPermissions: VotingPermissions;
  voterWeight: number;
  judgeWeight: number;
  rankPointsConfig: RankPointsConfig;
  allowSelfVote: boolean;
  requireTeamNameGate: boolean;
  isPublicResults: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

