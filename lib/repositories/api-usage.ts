import { query } from '@/lib/db';
import type { QueryRow } from '@/types/database';

/**
 * Single usage record (for rate limit and billing aggregation)
 */
export interface ApiKeyUsageRecord extends QueryRow {
  id: string;
  api_key_id: string;
  endpoint: string;
  created_at: Date;
}

/**
 * Record one API request for usage tracking and rate limiting.
 * Call this after rate limit check passes (so we don't double-count 429s if desired).
 */
export async function recordUsage(apiKeyId: string, endpoint: string): Promise<void> {
  await query(
    `INSERT INTO api_key_usage (api_key_id, endpoint) VALUES ($1, $2)`,
    [apiKeyId, endpoint]
  );
}

/**
 * Count requests in the last N minutes for the given API key (for rate limiting).
 */
export async function countUsageInLastMinutes(
  apiKeyId: string,
  minutes: number
): Promise<number> {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM api_key_usage
     WHERE api_key_id = $1 AND created_at > NOW() - (($2::text || ' minute')::INTERVAL)`,
    [apiKeyId, minutes]
  );
  const row = result.rows[0];
  return row ? parseInt(row.count, 10) : 0;
}
