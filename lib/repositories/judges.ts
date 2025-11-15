import { query } from '@/lib/db';
import type { PollJudge } from '@/types/judge';

/**
 * Poll judge database record
 */
export interface JudgeRecord {
  poll_id: string;
  email: string;
  name: string | null;
  created_at: Date;
}

/**
 * Add a judge to a poll
 */
export async function addJudgeToPoll(
  pollId: string,
  email: string,
  name?: string
): Promise<JudgeRecord> {
  const result = await query<JudgeRecord>(
    `INSERT INTO poll_judges (poll_id, email, name)
     VALUES ($1, $2, $3)
     ON CONFLICT (poll_id, email) DO UPDATE SET name = EXCLUDED.name
     RETURNING *`,
    [pollId, email, name || null]
  );
  
  return result.rows[0];
}

/**
 * Remove a judge from a poll
 */
export async function removeJudgeFromPoll(pollId: string, email: string): Promise<void> {
  await query(
    'DELETE FROM poll_judges WHERE poll_id = $1 AND email = $2',
    [pollId, email]
  );
}

/**
 * Get all judges for a poll
 */
export async function getJudgesByPoll(pollId: string): Promise<JudgeRecord[]> {
  const result = await query<JudgeRecord>(
    'SELECT * FROM poll_judges WHERE poll_id = $1 ORDER BY created_at ASC',
    [pollId]
  );
  
  return result.rows;
}

/**
 * Check if an email is a judge for a poll
 */
export async function isJudgeForPoll(pollId: string, email: string): Promise<boolean> {
  const result = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM poll_judges WHERE poll_id = $1 AND email = $2',
    [pollId, email]
  );
  
  return parseInt(result.rows[0].count, 10) > 0;
}

