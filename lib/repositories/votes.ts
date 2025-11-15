import { query } from '@/lib/db';
import type { Vote } from '@/types/vote';

/**
 * Vote database record
 */
export interface VoteRecord {
  vote_id: string;
  poll_id: string;
  token_hash: string;
  team_id_target: string;
  timestamp: Date;
  tx_hash: string | null;
  created_at: Date;
}

/**
 * Create a vote
 */
export async function createVote(
  pollId: string,
  tokenHash: string,
  teamIdTarget: string,
  txHash: string | null = null
): Promise<VoteRecord> {
  const result = await query<VoteRecord>(
    `INSERT INTO votes (poll_id, token_hash, team_id_target, tx_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [pollId, tokenHash, teamIdTarget, txHash]
  );
  
  return result.rows[0];
}

/**
 * Get vote by ID
 */
export async function getVoteById(voteId: string): Promise<VoteRecord | null> {
  const result = await query<VoteRecord>(
    'SELECT * FROM votes WHERE vote_id = $1',
    [voteId]
  );
  
  return result.rows[0] || null;
}

/**
 * Get votes for a poll
 */
export async function getVotesByPoll(pollId: string): Promise<VoteRecord[]> {
  const result = await query<VoteRecord>(
    'SELECT * FROM votes WHERE poll_id = $1 ORDER BY timestamp DESC',
    [pollId]
  );
  
  return result.rows;
}

/**
 * Get vote counts per team for a poll
 */
export async function getVoteCountsByPoll(pollId: string): Promise<Array<{
  team_id: string;
  team_name: string;
  vote_count: number;
}>> {
  const result = await query<{
    team_id: string;
    team_name: string;
    vote_count: string;
  }>(
    `SELECT 
       t.team_id,
       t.team_name,
       COUNT(v.vote_id)::int as vote_count
     FROM teams t
     LEFT JOIN votes v ON t.team_id = v.team_id_target AND v.poll_id = $1
     WHERE t.poll_id = $1
     GROUP BY t.team_id, t.team_name
     ORDER BY vote_count DESC, t.team_name ASC`,
    [pollId]
  );
  
  return result.rows.map(row => ({
    team_id: row.team_id,
    team_name: row.team_name,
    vote_count: parseInt(row.vote_count, 10),
  }));
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

