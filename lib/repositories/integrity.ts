import { query } from '@/lib/db';
import type { IntegrityCommitment, CommitmentType, VerificationResult } from '@/types/integrity';
import type { QueryRow } from '@/types/database';
import crypto from 'crypto';

/**
 * Commitment database record
 */
export interface CommitmentRecord extends QueryRow {
  commitment_id: string;
  hackathon_id: string;
  commitment_type: CommitmentType;
  commitment_hash: string;
  commitment_data: Record<string, any>;
  tx_hash: string | null;
  block_number: number | null;
  created_at: Date;
}

/**
 * Create a commitment hash from data
 */
function createCommitmentHash(data: Record<string, any>): string {
  const dataString = JSON.stringify(data, Object.keys(data).sort());
  return crypto.createHash('sha256').update(dataString).digest('hex');
}

/**
 * Create an integrity commitment
 */
export async function createCommitment(
  hackathonId: string,
  type: CommitmentType,
  data: Record<string, any>,
  txHash?: string,
  blockNumber?: number
): Promise<CommitmentRecord> {
  const commitmentHash = createCommitmentHash(data);

  const result = await query<CommitmentRecord>(
    `INSERT INTO integrity_commitments 
     (hackathon_id, commitment_type, commitment_hash, commitment_data, tx_hash, block_number)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (hackathon_id, commitment_type)
     DO UPDATE SET 
       commitment_hash = EXCLUDED.commitment_hash,
       commitment_data = EXCLUDED.commitment_data,
       tx_hash = EXCLUDED.tx_hash,
       block_number = EXCLUDED.block_number,
       created_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [
      hackathonId,
      type,
      commitmentHash,
      JSON.stringify(data),
      txHash || null,
      blockNumber || null,
    ]
  );

  return parseCommitment(result.rows[0]);
}

/**
 * Get commitment by ID
 */
export async function getCommitmentById(commitmentId: string): Promise<CommitmentRecord | null> {
  const result = await query<CommitmentRecord>(
    'SELECT * FROM integrity_commitments WHERE commitment_id = $1',
    [commitmentId]
  );

  return result.rows[0] ? parseCommitment(result.rows[0]) : null;
}

/**
 * Get commitment by hackathon and type
 */
export async function getCommitment(
  hackathonId: string,
  type: CommitmentType
): Promise<CommitmentRecord | null> {
  const result = await query<CommitmentRecord>(
    'SELECT * FROM integrity_commitments WHERE hackathon_id = $1 AND commitment_type = $2',
    [hackathonId, type]
  );

  return result.rows[0] ? parseCommitment(result.rows[0]) : null;
}

/**
 * Get all commitments for a hackathon
 */
export async function getAllCommitments(hackathonId: string): Promise<CommitmentRecord[]> {
  const result = await query<CommitmentRecord>(
    'SELECT * FROM integrity_commitments WHERE hackathon_id = $1 ORDER BY created_at ASC',
    [hackathonId]
  );

  return result.rows.map(parseCommitment);
}

/**
 * Verify a commitment's integrity
 */
export async function verifyCommitment(commitmentId: string): Promise<VerificationResult> {
  const commitment = await getCommitmentById(commitmentId);
  
  if (!commitment) {
    return {
      isValid: false,
      commitmentHash: '',
      recomputedHash: '',
      message: 'Commitment not found',
    };
  }

  const recomputedHash = createCommitmentHash(commitment.commitment_data);
  const isValid = recomputedHash === commitment.commitment_hash;

  return {
    isValid,
    commitmentHash: commitment.commitment_hash,
    recomputedHash,
    message: isValid ? 'Commitment is valid' : 'Commitment hash mismatch - data may have been tampered with',
  };
}

/**
 * Verify all commitments for a hackathon
 */
export async function verifyAllCommitments(hackathonId: string): Promise<{
  allValid: boolean;
  results: Array<VerificationResult & { type: CommitmentType }>;
}> {
  const commitments = await getAllCommitments(hackathonId);
  const results: Array<VerificationResult & { type: CommitmentType }> = [];

  for (const commitment of commitments) {
    const verification = await verifyCommitment(commitment.commitment_id);
    results.push({
      ...verification,
      type: commitment.commitment_type,
    });
  }

  const allValid = results.every((r) => r.isValid);

  return { allValid, results };
}

/**
 * Update blockchain reference for a commitment
 */
export async function updateBlockchainReference(
  commitmentId: string,
  txHash: string,
  blockNumber: number
): Promise<CommitmentRecord> {
  const result = await query<CommitmentRecord>(
    `UPDATE integrity_commitments 
     SET tx_hash = $1, block_number = $2
     WHERE commitment_id = $3
     RETURNING *`,
    [txHash, blockNumber, commitmentId]
  );

  if (!result.rows[0]) {
    throw new Error('Commitment not found');
  }

  return parseCommitment(result.rows[0]);
}

/**
 * Check if a hackathon has a specific commitment type
 */
export async function hasCommitment(
  hackathonId: string,
  type: CommitmentType
): Promise<boolean> {
  const result = await query<{ exists: boolean }>(
    `SELECT EXISTS(
       SELECT 1 FROM integrity_commitments 
       WHERE hackathon_id = $1 AND commitment_type = $2
     ) as exists`,
    [hackathonId, type]
  );

  return result.rows[0]?.exists || false;
}

/**
 * Get commitment count for a hackathon
 */
export async function getCommitmentCount(hackathonId: string): Promise<number> {
  const result = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM integrity_commitments WHERE hackathon_id = $1',
    [hackathonId]
  );

  return parseInt(result.rows[0]?.count || '0', 10);
}

/**
 * Delete a commitment
 */
export async function deleteCommitment(commitmentId: string): Promise<void> {
  await query(
    'DELETE FROM integrity_commitments WHERE commitment_id = $1',
    [commitmentId]
  );
}

/**
 * Parse commitment record (handle JSONB fields)
 */
function parseCommitment(record: CommitmentRecord): CommitmentRecord {
  if (typeof record.commitment_data === 'string') {
    record.commitment_data = JSON.parse(record.commitment_data);
  }
  return record;
}
