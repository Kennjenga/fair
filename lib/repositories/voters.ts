import { query } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import type { QueryRow } from '@/types/database';

/**
 * Voter database record (for voter login and participation view).
 */
export interface VoterRecord extends QueryRow {
  voter_id: string;
  email: string;
  password_hash: string;
  created_at: Date;
}

/**
 * Create a new voter account (email + password).
 */
export async function createVoter(email: string, password: string): Promise<VoterRecord> {
  const passwordHash = await hashPassword(password);
  const result = await query<VoterRecord>(
    `INSERT INTO voters (email, password_hash)
     VALUES ($1, $2)
     RETURNING *`,
    [email.toLowerCase().trim(), passwordHash]
  );
  return result.rows[0];
}

/**
 * Find voter by email.
 */
export async function findVoterByEmail(email: string): Promise<VoterRecord | null> {
  const result = await query<VoterRecord>(
    'SELECT * FROM voters WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))',
    [email]
  );
  return result.rows[0] || null;
}

/**
 * Verify voter credentials (email + password).
 */
export async function verifyVoterCredentials(
  email: string,
  password: string
): Promise<VoterRecord | null> {
  const voter = await findVoterByEmail(email);
  if (!voter) return null;
  const isValid = await verifyPassword(password, voter.password_hash);
  return isValid ? voter : null;
}
