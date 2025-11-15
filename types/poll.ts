/**
 * Poll-related type definitions
 */

/**
 * Poll creation request
 */
export interface CreatePollRequest {
  name: string;
  startTime: string; // ISO 8601 date string
  endTime: string; // ISO 8601 date string
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
  allowSelfVote?: boolean;
  requireTeamNameGate?: boolean;
  isPublicResults?: boolean;
}

/**
 * Poll database record
 */
export interface Poll {
  pollId: string;
  name: string;
  startTime: Date;
  endTime: Date;
  allowSelfVote: boolean;
  requireTeamNameGate: boolean;
  isPublicResults: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

