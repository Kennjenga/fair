import { query } from '@/lib/db';
import type { PollJudge } from '@/types/judge';
import type { QueryRow } from '@/types/database';

/**
 * Poll judge database record
 */
export interface JudgeRecord extends QueryRow {
  poll_id: string;
  email: string;
  name: string | null;
  email_sent: boolean;
  email_status: 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed';
  email_sent_at: Date | null;
  email_error_message: string | null;
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
    `INSERT INTO poll_judges (poll_id, email, name, email_sent, email_status)
     VALUES ($1, $2, $3, false, 'queued')
     ON CONFLICT (poll_id, email) DO UPDATE SET name = EXCLUDED.name
     RETURNING *`,
    [pollId, email, name || null]
  );

  return result.rows[0];
}

/**
 * Update judge email delivery status
 */
export async function updateJudgeEmailStatus(
  pollId: string,
  email: string,
  status: 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed',
  errorMessage?: string
): Promise<void> {
  await query(
    `UPDATE poll_judges 
     SET email_status = $1,
         email_sent = $1 IN ('sent', 'delivered'),
         email_sent_at = CASE WHEN $1 IN ('sent', 'delivered') THEN CURRENT_TIMESTAMP ELSE email_sent_at END,
         email_error_message = $2
     WHERE poll_id = $3 AND email = $4`,
    [status, errorMessage || null, pollId, email]
  );
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

