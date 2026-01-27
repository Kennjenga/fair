-- UP
-- Add voting_closes_at column to hackathons table
-- This field determines when voting closes and the hackathon status should change to 'closed'

ALTER TABLE hackathons 
ADD COLUMN IF NOT EXISTS voting_closes_at TIMESTAMP;

-- Add index for performance when querying hackathons by voting_closes_at
CREATE INDEX IF NOT EXISTS idx_hackathons_voting_closes_at ON hackathons(voting_closes_at) WHERE voting_closes_at IS NOT NULL;

-- Add check constraint to ensure voting_closes_at is between start_date and end_date (if both exist)
-- Note: This constraint only applies if both dates are set
ALTER TABLE hackathons 
DROP CONSTRAINT IF EXISTS hackathons_voting_closes_at_check;

ALTER TABLE hackathons 
ADD CONSTRAINT hackathons_voting_closes_at_check 
CHECK (
  voting_closes_at IS NULL 
  OR start_date IS NULL 
  OR end_date IS NULL 
  OR (voting_closes_at >= start_date AND voting_closes_at <= end_date)
);

-- DOWN
DROP CONSTRAINT IF EXISTS hackathons_voting_closes_at_check;
DROP INDEX IF EXISTS idx_hackathons_voting_closes_at;
ALTER TABLE hackathons DROP COLUMN IF EXISTS voting_closes_at;
