import { query } from '@/lib/db';
import { getEffectiveAdminId } from '@/lib/repositories/admins';
import type { Poll } from '@/types/poll';
import type { QueryRow } from '@/types/database';

/**
 * Poll database record
 */
export interface PollRecord extends QueryRow {
  poll_id: string;
  hackathon_id: string;
  name: string;
  start_time: Date;
  end_time: Date;
  voting_mode: 'single' | 'multiple' | 'ranked';
  voting_permissions: 'voters_only' | 'judges_only' | 'voters_and_judges';
  voter_weight: number;
  judge_weight: number;
  rank_points_config: Record<string, number>;
  allow_self_vote: boolean;
  require_team_name_gate: boolean;
  is_public_results: boolean;
  max_ranked_positions?: number | null; // Maximum number of positions to rank (null = unlimited)
  voting_sequence: 'simultaneous' | 'voters_first'; // Voting sequence control
  parent_poll_id?: string | null; // For tie-breaker polls
  is_tie_breaker: boolean; // Whether this is a tie-breaker poll
  allow_vote_editing: boolean; // Whether voters and judges can change their votes after submission
  min_voter_participation?: number | null; // Minimum number of voters required (null = no requirement)
  min_judge_participation?: number | null; // Minimum number of judges required (null = no requirement)
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Check if an admin has access to a poll.
 * Admins have access if:
 * 1. They created the poll, OR
 * 2. They created the hackathon that the poll belongs to, OR
 * 3. They are a super_admin
 * 
 * @param poll - The poll record
 * @param adminId - The admin ID to check
 * @param adminRole - The admin role ('admin' or 'super_admin')
 * @returns True if admin has access, false otherwise
 */
export async function hasPollAccess(
  poll: PollRecord,
  adminId: string,
  adminRole: string
): Promise<boolean> {
  // Super admins have access to all polls
  if (adminRole === 'super_admin') {
    return true;
  }
  
  // Admins have access if they created the poll
  if (poll.created_by === adminId) {
    return true;
  }
  
  // Admins have access if they created the hackathon that the poll belongs to
  if (poll.hackathon_id) {
    const { getHackathonById } = await import('@/lib/repositories/hackathons');
    const hackathon = await getHackathonById(poll.hackathon_id);
    if (hackathon && hackathon.created_by === adminId) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check poll access using the effective admin id (resolved by email when session adminId is stale).
 * Use this in API routes so admins can manage polls for hackathons they own.
 */
export async function hasPollAccessForAdmin(
  poll: PollRecord,
  admin: { adminId: string; email: string; role: string }
): Promise<boolean> {
  const effectiveId = (await getEffectiveAdminId(admin)) ?? admin.adminId;
  return hasPollAccess(poll, effectiveId, admin.role);
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
  votingPermissions: 'voters_only' | 'judges_only' | 'voters_and_judges' = 'voters_and_judges',
  voterWeight: number = 1.0,
  judgeWeight: number = 1.0,
  rankPointsConfig: Record<string, number> = { '1': 10, '2': 7, '3': 5, '4': 3, '5': 1 },
  allowSelfVote: boolean = false,
  requireTeamNameGate: boolean = true,
  isPublicResults: boolean = false,
  maxRankedPositions?: number | null,
  votingSequence: 'simultaneous' | 'voters_first' = 'simultaneous',
  parentPollId?: string | null,
  isTieBreaker: boolean = false,
  allowVoteEditing: boolean = false,
  minVoterParticipation?: number | null,
  minJudgeParticipation?: number | null
): Promise<PollRecord> {
  const result = await query<PollRecord>(
    `INSERT INTO polls (hackathon_id, name, start_time, end_time, created_by, voting_mode, voting_permissions, voter_weight, judge_weight, rank_points_config, allow_self_vote, require_team_name_gate, is_public_results, max_ranked_positions, voting_sequence, parent_poll_id, is_tie_breaker, allow_vote_editing, min_voter_participation, min_judge_participation)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
     RETURNING *`,
    [hackathonId, name, startTime, endTime, createdBy, votingMode, votingPermissions, voterWeight, judgeWeight, JSON.stringify(rankPointsConfig), allowSelfVote, requireTeamNameGate, isPublicResults, maxRankedPositions || null, votingSequence, parentPollId || null, isTieBreaker, allowVoteEditing, minVoterParticipation || null, minJudgeParticipation || null]
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
    votingPermissions?: 'voters_only' | 'judges_only' | 'voters_and_judges';
    voterWeight?: number;
    judgeWeight?: number;
    rankPointsConfig?: Record<string, number>;
    allowSelfVote?: boolean;
    requireTeamNameGate?: boolean;
    isPublicResults?: boolean;
    maxRankedPositions?: number | null;
    votingSequence?: 'simultaneous' | 'voters_first';
    allowVoteEditing?: boolean;
    minVoterParticipation?: number | null;
    minJudgeParticipation?: number | null;
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
  if (updates.maxRankedPositions !== undefined) {
    fields.push(`max_ranked_positions = $${paramIndex++}`);
    values.push(updates.maxRankedPositions);
  }
  if (updates.votingSequence !== undefined) {
    fields.push(`voting_sequence = $${paramIndex++}`);
    values.push(updates.votingSequence);
  }
  if (updates.allowVoteEditing !== undefined) {
    fields.push(`allow_vote_editing = $${paramIndex++}`);
    values.push(updates.allowVoteEditing);
  }
  if (updates.minVoterParticipation !== undefined) {
    fields.push(`min_voter_participation = $${paramIndex++}`);
    values.push(updates.minVoterParticipation);
  }
  if (updates.minJudgeParticipation !== undefined) {
    fields.push(`min_judge_participation = $${paramIndex++}`);
    values.push(updates.minJudgeParticipation);
  }

  if (fields.length === 0) {
    const poll = await getPollById(pollId);
    if (!poll) {
      throw new Error('Poll not found');
    }
    return poll;
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(pollId);

  const result = await query<PollRecord>(
    `UPDATE polls SET ${fields.join(', ')} WHERE poll_id = $${paramIndex} RETURNING *`,
    values
  );

  if (!result.rows[0]) {
    throw new Error('Poll not found');
  }

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
  const result = await query(
    'DELETE FROM polls WHERE poll_id = $1',
    [pollId]
  );

  if (result.rowCount === 0) {
    throw new Error('Poll not found');
  }
}
