import { query, transaction } from '@/lib/db';
import { generateSecureToken, hashToken, encryptPlainToken, decryptPlainToken } from '@/lib/utils/token';
import type { Token, TokenDeliveryStatus } from '@/types/token';
import type { QueryRow } from '@/types/database';

/**
 * Token database record
 */
export interface TokenRecord extends QueryRow {
  token_id: string;
  token: string; // Hashed token
  poll_id: string;
  team_id: string;
  email: string;
  used: boolean;
  issued_at: Date;
  expires_at: Date | null;
  delivery_status: TokenDeliveryStatus;
  delivery_log: Array<{
    timestamp: Date;
    status: TokenDeliveryStatus;
    message?: string;
  }>;
  plain_token_encrypted?: string | null; // Encrypted plain token for email sending
  created_at: Date;
}

/**
 * Create a voting token
 */
export async function createToken(
  pollId: string,
  teamId: string,
  email: string,
  expiresAt?: Date
): Promise<{ token: string; tokenRecord: TokenRecord }> {
  const token = generateSecureToken();
  const tokenHash = hashToken(token);
  const encryptedPlainToken = encryptPlainToken(token);
  
  const result = await query<TokenRecord>(
    `INSERT INTO tokens (token, poll_id, team_id, email, expires_at, delivery_status, plain_token_encrypted)
     VALUES ($1, $2, $3, $4, $5, 'queued', $6)
     RETURNING *`,
    [tokenHash, pollId, teamId, email, expiresAt || null, encryptedPlainToken]
  );
  
  return {
    token, // Return plain token for email
    tokenRecord: result.rows[0],
  };
}

/**
 * Find token by plain token string
 */
export async function findTokenByPlainToken(
  plainToken: string
): Promise<TokenRecord | null> {
  const tokenHash = hashToken(plainToken);
  
  const result = await query<TokenRecord>(
    'SELECT * FROM tokens WHERE token = $1',
    [tokenHash]
  );
  
  return result.rows[0] || null;
}

/**
 * Get token by ID
 */
export async function getTokenById(tokenId: string): Promise<TokenRecord | null> {
  const result = await query<TokenRecord>(
    'SELECT * FROM tokens WHERE token_id = $1',
    [tokenId]
  );
  
  return result.rows[0] || null;
}

/**
 * Get plain token from token record (decrypts stored plain token)
 */
export function getPlainTokenFromRecord(tokenRecord: TokenRecord): string | null {
  if (!tokenRecord.plain_token_encrypted) {
    return null;
  }
  
  try {
    return decryptPlainToken(tokenRecord.plain_token_encrypted);
  } catch (error) {
    console.error('Failed to decrypt plain token:', error);
    return null;
  }
}

/**
 * Get tokens for a poll
 */
export async function getTokensByPoll(pollId: string): Promise<TokenRecord[]> {
  const result = await query<TokenRecord>(
    'SELECT * FROM tokens WHERE poll_id = $1 ORDER BY created_at DESC',
    [pollId]
  );
  
  return result.rows;
}

/**
 * Mark token as used
 */
export async function markTokenAsUsed(tokenId: string): Promise<void> {
  await query(
    'UPDATE tokens SET used = TRUE WHERE token_id = $1',
    [tokenId]
  );
}

/**
 * Update token delivery status
 */
export async function updateTokenDeliveryStatus(
  tokenId: string,
  status: TokenDeliveryStatus,
  message?: string
): Promise<void> {
  // Build the delivery log entry as a JSONB object
  const logEntry = {
    timestamp: new Date().toISOString(),
    status: status,
    message: message || null,
  };
  
  await query(
    `UPDATE tokens 
     SET delivery_status = $1::VARCHAR(50),
         delivery_log = COALESCE(delivery_log, '[]'::jsonb) || jsonb_build_array($2::jsonb)
     WHERE token_id = $3`,
    [status, JSON.stringify(logEntry), tokenId]
  );
}

/**
 * Bulk create tokens for voters
 * Handles duplicates gracefully - if email already exists, updates team_id if different
 * Returns all processed emails, including those that were already registered
 * All team members are included regardless of registration status
 */
export async function bulkCreateTokens(
  pollId: string,
  voters: Array<{ email: string; teamId: string }>,
  expiresAt?: Date
): Promise<Array<{ email: string; token: string; tokenId: string }>> {
  const results: Array<{ email: string; token: string; tokenId: string }> = [];
  
  for (const voter of voters) {
    try {
      // Generate token for new entries
      const token = generateSecureToken();
      const tokenHash = hashToken(token);
      const encryptedPlainToken = encryptPlainToken(token);
      
      // Try to insert - use ON CONFLICT DO NOTHING to handle duplicates gracefully
      // This ensures all team members are included, even if already registered
      const insertResult = await query<TokenRecord>(
        `INSERT INTO tokens (token, poll_id, team_id, email, expires_at, delivery_status, plain_token_encrypted)
         VALUES ($1, $2, $3, $4, $5, 'queued', $6)
         ON CONFLICT (poll_id, email) DO NOTHING
         RETURNING *`,
        [tokenHash, pollId, voter.teamId, voter.email, expiresAt || null, encryptedPlainToken]
      );
      
      if (insertResult.rows[0]) {
        // New token created
        results.push({
          email: voter.email,
          token: token,
          tokenId: insertResult.rows[0].token_id,
        });
      } else {
        // Token already exists - get it and update team_id if needed
        const existingTokenResult = await query<TokenRecord>(
          'SELECT * FROM tokens WHERE poll_id = $1 AND email = $2',
          [pollId, voter.email]
        );
        
        if (existingTokenResult.rows[0]) {
          const existingToken = existingTokenResult.rows[0];
          
          // Update team_id if different
          if (existingToken.team_id !== voter.teamId) {
            await query(
              'UPDATE tokens SET team_id = $1 WHERE token_id = $2',
              [voter.teamId, existingToken.token_id]
            );
          }
          
          // Try to get plain token from existing record
          let plainToken = 'existing';
          if (existingToken.plain_token_encrypted) {
            try {
              const decrypted = decryptPlainToken(existingToken.plain_token_encrypted);
              if (decrypted) {
                plainToken = decrypted;
              }
            } catch (e) {
              // Can't decrypt, use placeholder
            }
          }
          
          results.push({
            email: voter.email,
            token: plainToken,
            tokenId: existingToken.token_id,
          });
        } else {
          // This shouldn't happen, but handle it
          console.error(`Token insert failed but no existing token found for ${voter.email}`);
          results.push({
            email: voter.email,
            token: 'error',
            tokenId: 'error',
          });
        }
      }
    } catch (error: any) {
      // Fallback: if INSERT fails for any reason, try to get/update existing token
      try {
        const existingTokenResult = await query<TokenRecord>(
          'SELECT * FROM tokens WHERE poll_id = $1 AND email = $2',
          [pollId, voter.email]
        );
        
        if (existingTokenResult.rows[0]) {
          const tokenRecord = existingTokenResult.rows[0];
          
          // Update team_id if different
          if (tokenRecord.team_id !== voter.teamId) {
            await query(
              'UPDATE tokens SET team_id = $1 WHERE token_id = $2',
              [voter.teamId, tokenRecord.token_id]
            );
          }
          
          // Try to get plain token
          let plainToken = 'existing';
          if (tokenRecord.plain_token_encrypted) {
            try {
              const decrypted = decryptPlainToken(tokenRecord.plain_token_encrypted);
              if (decrypted) {
                plainToken = decrypted;
              }
            } catch (e) {
              // Can't decrypt, use placeholder
            }
          }
          
          results.push({
            email: voter.email,
            token: plainToken,
            tokenId: tokenRecord.token_id,
          });
        } else {
          // Token doesn't exist and insert failed - this shouldn't happen but log it
          console.error(`Failed to create or find token for ${voter.email}:`, error);
          results.push({
            email: voter.email,
            token: 'error',
            tokenId: 'error',
          });
        }
      } catch (err) {
        console.error(`Failed to handle token for ${voter.email}:`, err);
        // Still include in results to show it was processed
        results.push({
          email: voter.email,
          token: 'error',
          tokenId: 'error',
        });
      }
    }
  }
  
  return results;
}

/**
 * Reassign token (voter) to a different team
 */
export async function reassignTokenToTeam(
  tokenId: string,
  newTeamId: string
): Promise<TokenRecord> {
  const result = await query<TokenRecord>(
    'UPDATE tokens SET team_id = $1 WHERE token_id = $2 RETURNING *',
    [newTeamId, tokenId]
  );
  
  if (!result.rows[0]) {
    throw new Error('Token not found');
  }
  
  return result.rows[0];
}

/**
 * Get tokens by team
 */
export async function getTokensByTeam(teamId: string): Promise<TokenRecord[]> {
  const result = await query<TokenRecord>(
    'SELECT * FROM tokens WHERE team_id = $1 ORDER BY created_at DESC',
    [teamId]
  );
  
  return result.rows;
}

/**
 * Delete token (and invalidate it)
 * This will also cascade delete votes if foreign key constraints are set up
 */
export async function deleteToken(tokenId: string): Promise<void> {
  await query(
    'DELETE FROM tokens WHERE token_id = $1',
    [tokenId]
  );
}

