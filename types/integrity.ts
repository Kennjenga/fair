/**
 * Integrity commitment type definitions
 */

/**
 * Commitment type enum
 */
export type CommitmentType = 'rules' | 'submissions' | 'evaluations' | 'results';

/**
 * Integrity commitment database record
 */
export interface IntegrityCommitment {
  commitmentId: string;
  hackathonId: string;
  commitmentType: CommitmentType;
  commitmentHash: string;
  commitmentData: Record<string, any>;
  txHash: string | null;
  blockNumber: number | null;
  createdAt: Date;
}

/**
 * Commitment creation request
 */
export interface CreateCommitmentRequest {
  hackathonId: string;
  type: CommitmentType;
  data: Record<string, any>;
}

/**
 * Verification result
 */
export interface VerificationResult {
  isValid: boolean;
  commitmentHash: string;
  recomputedHash: string;
  message: string;
}

/**
 * Integrity proof for public verification
 */
export interface IntegrityProof {
  hackathonId: string;
  hackathonName: string;
  commitments: IntegrityCommitment[];
  verificationStatus: 'valid' | 'invalid' | 'pending';
  lastVerified: Date | null;
}
