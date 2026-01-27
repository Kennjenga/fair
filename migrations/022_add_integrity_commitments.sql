-- UP
-- Create integrity_commitments table for cryptographic commitments

CREATE TABLE IF NOT EXISTS integrity_commitments (
  commitment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id UUID NOT NULL REFERENCES hackathons(hackathon_id) ON DELETE CASCADE,
  
  commitment_type VARCHAR(50) NOT NULL CHECK (commitment_type IN ('rules', 'submissions', 'evaluations', 'results')),
  
  -- Hash commitment
  commitment_hash VARCHAR(255) NOT NULL,
  
  -- Original data (for verification)
  commitment_data JSONB NOT NULL,
  
  -- Blockchain reference (future use)
  tx_hash VARCHAR(255),
  block_number BIGINT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(hackathon_id, commitment_type)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_commitments_hackathon ON integrity_commitments(hackathon_id);
CREATE INDEX IF NOT EXISTS idx_commitments_type ON integrity_commitments(commitment_type);
CREATE INDEX IF NOT EXISTS idx_commitments_hash ON integrity_commitments(commitment_hash);
CREATE INDEX IF NOT EXISTS idx_commitments_tx_hash ON integrity_commitments(tx_hash);

-- DOWN
DROP INDEX IF EXISTS idx_commitments_tx_hash;
DROP INDEX IF EXISTS idx_commitments_hash;
DROP INDEX IF EXISTS idx_commitments_type;
DROP INDEX IF EXISTS idx_commitments_hackathon;
DROP TABLE IF EXISTS integrity_commitments;
