import { query, transaction } from '@/lib/db';
import { generateSecureToken, hashToken } from '@/lib/utils/token';
import type { Token, TokenDeliveryStatus } from '@/types/token';

/**
 * Token database record
 */
export interface TokenRecord {
  token_id: string;
  token: string;
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
  
  const result = await query<TokenRecord>(
    `INSERT INTO tokens (token, poll_id, team_id, email, expires_at, delivery_status)
     VALUES ($1, $2, $3, $4, $5, 'queued')
     RETURNING *`,
    [tokenHash, pollId, teamId, email, expiresAt || null]
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
  await query(
    `UPDATE tokens 
     SET delivery_status = $1,
         delivery_log = delivery_log || jsonb_build_object(
           'timestamp', CURRENT_TIMESTAMP,
           'status', $1,
           'message', $2
         )::jsonb
     WHERE token_id = $3`,
    [status, message || null, tokenId]
  );
}

/**
 * Bulk create tokens for voters
 */
export async function bulkCreateTokens(
  pollId: string,
  voters: Array<{ email: string; teamId: string }>,
  expiresAt?: Date
): Promise<Array<{ email: string; token: string; tokenId: string }>> {
  const results: Array<{ email: string; token: string; tokenId: string }> = [];
  
  for (const voter of voters) {
    const { token, tokenRecord } = await createToken(
      pollId,
      voter.teamId,
      voter.email,
      expiresAt
    );
    
    results.push({
      email: voter.email,
      token,
      tokenId: tokenRecord.token_id,
    });
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

