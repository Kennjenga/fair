import { query } from '@/lib/db';
import type { Poll } from '@/types/poll';

/**
 * Poll database record
 */
export interface PollRecord {
  poll_id: string;
  hackathon_id: string;
  name: string;
  start_time: Date;
  end_time: Date;
  voting_mode: 'single' | 'multiple' | 'ranked';
  voting_permissions: 'judges_only' | 'voters_and_judges';
  voter_weight: number;
  judge_weight: number;
  rank_points_config: Record<string, number>;
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
  hackathonId: string,
  name: string,
  startTime: Date,
  endTime: Date,
  createdBy: string,
  votingMode: 'single' | 'multiple' | 'ranked' = 'single',
  votingPermissions: 'judges_only' | 'voters_and_judges' = 'voters_and_judges',
  voterWeight: number = 1.0,
  judgeWeight: number = 1.0,
  rankPointsConfig: Record<string, number> = { '1': 10, '2': 7, '3': 5, '4': 3, '5': 1 },
  allowSelfVote: boolean = false,
  requireTeamNameGate: boolean = true,
  isPublicResults: boolean = false
): Promise<PollRecord> {
  const result = await query<PollRecord>(
    `INSERT INTO polls (hackathon_id, name, start_time, end_time, created_by, voting_mode, voting_permissions, voter_weight, judge_weight, rank_points_config, allow_self_vote, require_team_name_gate, is_public_results)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING *`,
    [hackathonId, name, startTime, endTime, createdBy, votingMode, votingPermissions, voterWeight, judgeWeight, JSON.stringify(rankPointsConfig), allowSelfVote, requireTeamNameGate, isPublicResults]
  );
  
  // Parse JSONB fields
  const poll = result.rows[0];
  if (poll.rank_points_config && typeof poll.rank_points_config === 'string') {
    poll.rank_points_config = JSON.parse(poll.rank_points_config);
  }
  
  return poll;
}

/**
 * Get poll by ID
 */
export async function getPollById(pollId: string): Promise<PollRecord | null> {
  const result = await query<PollRecord>(
    'SELECT * FROM polls WHERE poll_id = $1',
    [pollId]
  );
  
  if (!result.rows[0]) {
    return null;
  }
  
  // Parse JSONB fields
  const poll = result.rows[0];
  if (poll.rank_points_config && typeof poll.rank_points_config === 'string') {
    poll.rank_points_config = JSON.parse(poll.rank_points_config);
  }
  
  return poll;
}

/**
 * Get all polls for an admin
 */
export async function getPollsByAdmin(adminId: string): Promise<PollRecord[]> {
  const result = await query<PollRecord>(
    'SELECT * FROM polls WHERE created_by = $1 ORDER BY created_at DESC',
    [adminId]
  );
  
  // Parse JSONB fields
  return result.rows.map(poll => {
    if (poll.rank_points_config && typeof poll.rank_points_config === 'string') {
      poll.rank_points_config = JSON.parse(poll.rank_points_config);
    }
    return poll;
  });
}

/**
 * Get polls by hackathon ID
 */
export async function getPollsByHackathon(hackathonId: string): Promise<PollRecord[]> {
  const result = await query<PollRecord>(
    'SELECT * FROM polls WHERE hackathon_id = $1 ORDER BY created_at DESC',
    [hackathonId]
  );
  
  // Parse JSONB fields
  return result.rows.map(poll => {
    if (poll.rank_points_config && typeof poll.rank_points_config === 'string') {
      poll.rank_points_config = JSON.parse(poll.rank_points_config);
    }
    return poll;
  });
}

/**
 * Get all polls (super admin only)
 */
export async function getAllPolls(): Promise<PollRecord[]> {
  const result = await query<PollRecord>(
    'SELECT * FROM polls ORDER BY created_at DESC'
  );
  
  // Parse JSONB fields
  return result.rows.map(poll => {
    if (poll.rank_points_config && typeof poll.rank_points_config === 'string') {
      poll.rank_points_config = JSON.parse(poll.rank_points_config);
    }
    return poll;
  });
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
    votingMode?: 'single' | 'multiple' | 'ranked';
    votingPermissions?: 'judges_only' | 'voters_and_judges';
    voterWeight?: number;
    judgeWeight?: number;
    rankPointsConfig?: Record<string, number>;
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
  if (updates.votingMode !== undefined) {
    fields.push(`voting_mode = $${paramIndex++}`);
    values.push(updates.votingMode);
  }
  if (updates.votingPermissions !== undefined) {
    fields.push(`voting_permissions = $${paramIndex++}`);
    values.push(updates.votingPermissions);
  }
  if (updates.voterWeight !== undefined) {
    fields.push(`voter_weight = $${paramIndex++}`);
    values.push(updates.voterWeight);
  }
  if (updates.judgeWeight !== undefined) {
    fields.push(`judge_weight = $${paramIndex++}`);
    values.push(updates.judgeWeight);
  }
  if (updates.rankPointsConfig !== undefined) {
    fields.push(`rank_points_config = $${paramIndex++}`);
    values.push(JSON.stringify(updates.rankPointsConfig));
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
  
  // Parse JSONB fields
  const poll = result.rows[0];
  if (poll.rank_points_config && typeof poll.rank_points_config === 'string') {
    poll.rank_points_config = JSON.parse(poll.rank_points_config);
  }
  
  return poll;
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

