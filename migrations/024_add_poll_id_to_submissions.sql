-- UP
-- Add poll_id column to hackathon_submissions to associate submissions with polls
-- This allows project submissions to be linked to specific polls within a hackathon

ALTER TABLE hackathon_submissions 
ADD COLUMN IF NOT EXISTS poll_id UUID REFERENCES polls(poll_id) ON DELETE SET NULL;

-- Index for performance when querying submissions by poll
CREATE INDEX IF NOT EXISTS idx_submissions_poll ON hackathon_submissions(poll_id) WHERE poll_id IS NOT NULL;

-- DOWN
DROP INDEX IF EXISTS idx_submissions_poll;
ALTER TABLE hackathon_submissions DROP COLUMN IF EXISTS poll_id;
