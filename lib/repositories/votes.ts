import { query } from '@/lib/db';
import type { Vote, VoteRanking } from '@/types/vote';
import type { QueryRow } from '@/types/database';

/**
 * Vote database record
 */
export interface VoteRecord extends QueryRow {
  vote_id: string;
  poll_id: string;
  token_hash: string | null;
  vote_type: 'voter' | 'judge';
  judge_email: string | null;
  team_id_target: string | null;
  teams: string[] | null;
  rankings: VoteRanking[] | null;
  timestamp: Date;
  tx_hash: string | null;
  created_at: Date;
}

/**
 * Create a vote
 * Supports single, multiple, and ranked voting modes
 */
export async function createVote(
  pollId: string,
  voteType: 'voter' | 'judge',
  options: {
    tokenHash?: string | null;
    judgeEmail?: string | null;
    teamIdTarget?: string | null;
    teams?: string[];
    rankings?: VoteRanking[];
    txHash?: string | null;
  }
): Promise<VoteRecord> {
  const result = await query<VoteRecord>(
    `INSERT INTO votes (poll_id, token_hash, vote_type, judge_email, team_id_target, teams, rankings, tx_hash)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      pollId,
      options.tokenHash || null,
      voteType,
      options.judgeEmail || null,
      options.teamIdTarget || null,
      options.teams ? JSON.stringify(options.teams) : null,
      options.rankings ? JSON.stringify(options.rankings) : null,
      options.txHash || null,
    ]
  );
  
  // Parse JSONB fields
  const vote = result.rows[0];
  if (vote.teams && typeof vote.teams === 'string') {
    vote.teams = JSON.parse(vote.teams);
  }
  if (vote.rankings && typeof vote.rankings === 'string') {
    vote.rankings = JSON.parse(vote.rankings);
  }
  
  return vote;
}

/**
 * Get vote by ID
 */
export async function getVoteById(voteId: string): Promise<VoteRecord | null> {
  const result = await query<VoteRecord>(
    'SELECT * FROM votes WHERE vote_id = $1',
    [voteId]
  );
  
  if (!result.rows[0]) {
    return null;
  }
  
  // Parse JSONB fields
  const vote = result.rows[0];
  if (vote.teams && typeof vote.teams === 'string') {
    vote.teams = JSON.parse(vote.teams);
  }
  if (vote.rankings && typeof vote.rankings === 'string') {
    vote.rankings = JSON.parse(vote.rankings);
  }
  
  return vote;
}

/**
 * Get votes for a poll
 * @param pollId The poll ID
 * @param voteType Optional filter by vote type ('voter' or 'judge')
 */
export async function getVotesByPoll(
  pollId: string,
  voteType?: 'voter' | 'judge'
): Promise<VoteRecord[]> {
  let queryStr = 'SELECT * FROM votes WHERE poll_id = $1';
  const params: unknown[] = [pollId];
  
  if (voteType) {
    queryStr += ' AND vote_type = $2';
    params.push(voteType);
  }
  
  queryStr += ' ORDER BY timestamp DESC';
  
  const result = await query<VoteRecord>(queryStr, params);
  
  // Parse JSONB fields
  return result.rows.map(vote => {
    if (vote.teams && typeof vote.teams === 'string') {
      vote.teams = JSON.parse(vote.teams);
    }
    if (vote.rankings && typeof vote.rankings === 'string') {
      vote.rankings = JSON.parse(vote.rankings);
    }
    return vote;
  });
}

/**
 * Check if a token hash has already been used to vote
 */
export async function hasTokenVoted(tokenHash: string): Promise<boolean> {
  const result = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM votes WHERE token_hash = $1',
    [tokenHash]
  );
  
  return parseInt(result.rows[0].count, 10) > 0;
}

/**
 * Get vote by token hash
 */
export async function getVoteByTokenHash(tokenHash: string): Promise<VoteRecord | null> {
  const result = await query<VoteRecord>(
    'SELECT * FROM votes WHERE token_hash = $1 ORDER BY timestamp DESC LIMIT 1',
    [tokenHash]
  );
  
  if (!result.rows[0]) {
    return null;
  }
  
  // Parse JSONB fields
  const vote = result.rows[0];
  if (vote.teams && typeof vote.teams === 'string') {
    vote.teams = JSON.parse(vote.teams);
  }
  if (vote.rankings && typeof vote.rankings === 'string') {
    vote.rankings = JSON.parse(vote.rankings);
  }
  
  return vote;
}

/**
 * Check if a judge email has already voted for a poll
 */
export async function hasJudgeVoted(pollId: string, judgeEmail: string): Promise<boolean> {
  const result = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM votes WHERE poll_id = $1 AND judge_email = $2',
    [pollId, judgeEmail]
  );
  
  return parseInt(result.rows[0].count, 10) > 0;
}

/**
 * Get vote by judge email
 */
export async function getVoteByJudgeEmail(pollId: string, judgeEmail: string): Promise<VoteRecord | null> {
  const result = await query<VoteRecord>(
    'SELECT * FROM votes WHERE poll_id = $1 AND judge_email = $2 ORDER BY timestamp DESC LIMIT 1',
    [pollId, judgeEmail]
  );
  
  if (!result.rows[0]) {
    return null;
  }
  
  // Parse JSONB fields
  const vote = result.rows[0];
  if (vote.teams && typeof vote.teams === 'string') {
    vote.teams = JSON.parse(vote.teams);
  }
  if (vote.rankings && typeof vote.rankings === 'string') {
    vote.rankings = JSON.parse(vote.rankings);
  }
  
  return vote;
}

/**
 * Update vote with transaction hash
 */
export async function updateVoteTxHash(
  voteId: string,
  txHash: string
): Promise<VoteRecord> {
  const result = await query<VoteRecord>(
    `UPDATE votes SET tx_hash = $1 WHERE vote_id = $2 RETURNING *`,
    [txHash, voteId]
  );
  
  return result.rows[0];
}

