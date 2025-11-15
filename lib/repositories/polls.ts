import { query } from '@/lib/db';
import type { Poll } from '@/types/poll';

/**
 * Poll database record
 */
export interface PollRecord {
  poll_id: string;
  name: string;
  start_time: Date;
  end_time: Date;
  allow_self_vote: boolean;
  require_team_name_gate: boolean;
  is_public_results: boolean;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Create a new poll
 */
export async function createPoll(
  name: string,
  startTime: Date,
  endTime: Date,
  createdBy: string,
  allowSelfVote: boolean = false,
  requireTeamNameGate: boolean = true,
  isPublicResults: boolean = false
): Promise<PollRecord> {
  const result = await query<PollRecord>(
    `INSERT INTO polls (name, start_time, end_time, created_by, allow_self_vote, require_team_name_gate, is_public_results)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [name, startTime, endTime, createdBy, allowSelfVote, requireTeamNameGate, isPublicResults]
  );
  
  return result.rows[0];
}

/**
 * Get poll by ID
 */
export async function getPollById(pollId: string): Promise<PollRecord | null> {
  const result = await query<PollRecord>(
    'SELECT * FROM polls WHERE poll_id = $1',
    [pollId]
  );
  
  return result.rows[0] || null;
}

/**
 * Get all polls for an admin
 */
export async function getPollsByAdmin(adminId: string): Promise<PollRecord[]> {
  const result = await query<PollRecord>(
    'SELECT * FROM polls WHERE created_by = $1 ORDER BY created_at DESC',
    [adminId]
  );
  
  return result.rows;
}

/**
 * Get all polls (super admin only)
 */
export async function getAllPolls(): Promise<PollRecord[]> {
  const result = await query<PollRecord>(
    'SELECT * FROM polls ORDER BY created_at DESC'
  );
  
  return result.rows;
}

/**
 * Update poll
 */
export async function updatePoll(
  pollId: string,
  updates: {
    name?: string;
    startTime?: Date;
    endTime?: Date;
    allowSelfVote?: boolean;
    requireTeamNameGate?: boolean;
    isPublicResults?: boolean;
  }
): Promise<PollRecord> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;
  
  if (updates.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.startTime !== undefined) {
    fields.push(`start_time = $${paramIndex++}`);
    values.push(updates.startTime);
  }
  if (updates.endTime !== undefined) {
    fields.push(`end_time = $${paramIndex++}`);
    values.push(updates.endTime);
  }
  if (updates.allowSelfVote !== undefined) {
    fields.push(`allow_self_vote = $${paramIndex++}`);
    values.push(updates.allowSelfVote);
  }
  if (updates.requireTeamNameGate !== undefined) {
    fields.push(`require_team_name_gate = $${paramIndex++}`);
    values.push(updates.requireTeamNameGate);
  }
  if (updates.isPublicResults !== undefined) {
    fields.push(`is_public_results = $${paramIndex++}`);
    values.push(updates.isPublicResults);
  }
  
  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(pollId);
  
  const result = await query<PollRecord>(
    `UPDATE polls SET ${fields.join(', ')}
     WHERE poll_id = $${paramIndex}
     RETURNING *`,
    values
  );
  
  return result.rows[0];
}

/**
 * Delete poll
 */
export async function deletePoll(pollId: string): Promise<void> {
  await query('DELETE FROM polls WHERE poll_id = $1', [pollId]);
}

/**
 * Check if poll is active (within start/end time)
 */
export async function isPollActive(pollId: string): Promise<boolean> {
  const poll = await getPollById(pollId);
  if (!poll) {
    return false;
  }
  
  const now = new Date();
  return now >= poll.start_time && now <= poll.end_time;
}

