import { query } from '@/lib/db';
import { generateSecureToken } from '@/lib/utils/token';
import type { QueryRow } from '@/types/database';

/**
 * Password reset token database record
 */
export interface PasswordResetTokenRecord extends QueryRow {
  token_id: string;
  admin_id: string;
  token: string;
  expires_at: Date;
  used: boolean;
  created_at: Date;
}

/**
 * Create a password reset token
 * @param adminId - Admin ID
 * @param expiresInHours - Hours until token expires (default: 1)
 * @returns Token string and record
 */
export async function createPasswordResetToken(
  adminId: string,
  expiresInHours: number = 1
): Promise<{ token: string; tokenRecord: PasswordResetTokenRecord }> {
  const token = generateSecureToken(32);
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiresInHours);

  const result = await query<PasswordResetTokenRecord>(
    `INSERT INTO password_reset_tokens (admin_id, token, expires_at)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [adminId, token, expiresAt]
  );

  return {
    token,
    tokenRecord: result.rows[0],
  };
}

/**
 * Find password reset token by token string
 * @param token - Reset token
 * @returns Token record or null
 */
export async function findPasswordResetToken(
  token: string
): Promise<PasswordResetTokenRecord | null> {
  const result = await query<PasswordResetTokenRecord>(
    `SELECT * FROM password_reset_tokens 
     WHERE token = $1 AND used = FALSE AND expires_at > CURRENT_TIMESTAMP`,
    [token]
  );

  return result.rows[0] || null;
}

/**
 * Mark password reset token as used
 * @param tokenId - Token ID
 */
export async function markTokenAsUsed(tokenId: string): Promise<void> {
  await query(
    'UPDATE password_reset_tokens SET used = TRUE WHERE token_id = $1',
    [tokenId]
  );
}

/**
 * Invalidate all tokens for an admin
 * @param adminId - Admin ID
 */
export async function invalidateAllTokensForAdmin(adminId: string): Promise<void> {
  await query(
    'UPDATE password_reset_tokens SET used = TRUE WHERE admin_id = $1 AND used = FALSE',
    [adminId]
  );
}


