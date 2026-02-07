import crypto from 'crypto';
import { query } from '@/lib/db';
import type { QueryRow } from '@/types/database';

/** Length of the key prefix stored for display and lookup (e.g. "fair_a1b2c3d4") */
const KEY_PREFIX_LENGTH = 12;

/** Default rate limit per minute when not specified */
export const DEFAULT_RATE_LIMIT_PER_MINUTE = 60;

/**
 * API key database record (key_hash is the only secret; raw key never stored)
 */
export interface ApiKeyRecord extends QueryRow {
  api_key_id: string;
  admin_id: string;
  name: string;
  key_hash: string;
  key_prefix: string;
  rate_limit_per_minute: number;
  created_at: Date;
  last_used_at: Date | null;
  revoked_at: Date | null;
}

/** API key as returned in list (no key_hash exposed) */
export type ApiKeyListRecord = Omit<ApiKeyRecord, 'key_hash'>;

/**
 * Result of creating an API key: record plus the raw secret (shown only once)
 */
export interface CreateApiKeyResult {
  /** Stored record (no raw key) */
  record: ApiKeyRecord;
  /** Raw API key - only returned at creation time; never stored or shown again */
  rawKey: string;
}

/**
 * Hash an API key for storage and comparison (SHA-256)
 */
export function hashApiKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey, 'utf8').digest('hex');
}

/**
 * Timing-safe comparison of two strings (prevents timing attacks)
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Generate a new API key: "fair_" + 48 hex chars (e.g. fair_a1b2c3d4e5f6...)
 * Prefix for DB is first KEY_PREFIX_LENGTH chars.
 */
export function generateRawApiKey(): string {
  const suffix = crypto.randomBytes(24).toString('hex');
  return `fair_${suffix}`;
}

/**
 * Create a new API key for an admin. Returns the record and the raw key (show once in UI).
 */
export async function createApiKey(
  adminId: string,
  name: string,
  rateLimitPerMinute: number = DEFAULT_RATE_LIMIT_PER_MINUTE
): Promise<CreateApiKeyResult> {
  const rawKey = generateRawApiKey();
  const keyHash = hashApiKey(rawKey);
  const keyPrefix = rawKey.slice(0, KEY_PREFIX_LENGTH);

  const result = await query<ApiKeyRecord>(
    `INSERT INTO api_keys (admin_id, name, key_hash, key_prefix, rate_limit_per_minute)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [adminId, name, keyHash, keyPrefix, rateLimitPerMinute]
  );

  const record = result.rows[0];
  if (!record) throw new Error('Failed to create API key');
  return { record, rawKey };
}

/**
 * Find an API key by the raw key from the request. Returns the record if valid and not revoked.
 * Uses prefix lookup then timing-safe hash comparison (never compare raw keys in DB).
 */
export async function findApiKeyByRawKey(rawKey: string): Promise<ApiKeyRecord | null> {
  const prefix = rawKey.slice(0, KEY_PREFIX_LENGTH);
  if (prefix.length < KEY_PREFIX_LENGTH) return null;

  const result = await query<ApiKeyRecord>(
    `SELECT * FROM api_keys WHERE key_prefix = $1 AND revoked_at IS NULL`,
    [prefix]
  );

  const keyHash = hashApiKey(rawKey);
  for (const row of result.rows) {
    if (timingSafeEqual(row.key_hash, keyHash)) {
      return row;
    }
  }
  return null;
}

/**
 * List all API keys for an admin (for dashboard). Never includes raw key or full hash.
 */
export async function listApiKeysByAdmin(adminId: string): Promise<ApiKeyListRecord[]> {
  const result = await query<ApiKeyListRecord>(
    `SELECT api_key_id, admin_id, name, key_prefix, rate_limit_per_minute, created_at, last_used_at, revoked_at
     FROM api_keys
     WHERE admin_id = $1
     ORDER BY created_at DESC`,
    [adminId]
  );
  return result.rows;
}

/**
 * Revoke an API key (soft delete). Middleware will reject revoked keys.
 */
export async function revokeApiKey(apiKeyId: string, adminId: string): Promise<boolean> {
  const result = await query<ApiKeyRecord>(
    `UPDATE api_keys SET revoked_at = CURRENT_TIMESTAMP
     WHERE api_key_id = $1 AND admin_id = $2 AND revoked_at IS NULL
     RETURNING api_key_id`,
    [apiKeyId, adminId]
  );
  return result.rowCount !== null && result.rowCount > 0;
}

/**
 * Update last_used_at for an API key (call after successful request)
 */
export async function touchApiKeyLastUsed(apiKeyId: string): Promise<void> {
  await query(
    `UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE api_key_id = $1`,
    [apiKeyId]
  );
}
