/**
 * Judge-related type definitions
 */

/**
 * Poll judge creation request
 */
export interface CreateJudgeRequest {
  email: string;
  name?: string;
}

/**
 * Poll judge database record
 */
export interface PollJudge {
  pollId: string;
  email: string;
  name: string | null;
  createdAt: Date;
}

