-- UP
-- Create user_participation table for tracking user participation in decisions

CREATE TABLE IF NOT EXISTS user_participation (
  participation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_identifier VARCHAR(255) NOT NULL,
  hackathon_id UUID NOT NULL REFERENCES hackathons(hackathon_id) ON DELETE CASCADE,
  
  participation_role VARCHAR(50) NOT NULL CHECK (participation_role IN ('organizer', 'participant', 'judge', 'voter')),
  
  -- Metadata
  participated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_identifier, hackathon_id, participation_role)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_participation_user ON user_participation(user_identifier);
CREATE INDEX IF NOT EXISTS idx_participation_hackathon ON user_participation(hackathon_id);
CREATE INDEX IF NOT EXISTS idx_participation_role ON user_participation(participation_role);
CREATE INDEX IF NOT EXISTS idx_participation_user_hackathon ON user_participation(user_identifier, hackathon_id);

-- DOWN
DROP INDEX IF EXISTS idx_participation_user_hackathon;
DROP INDEX IF EXISTS idx_participation_role;
DROP INDEX IF EXISTS idx_participation_hackathon;
DROP INDEX IF EXISTS idx_participation_user;
DROP TABLE IF EXISTS user_participation;
