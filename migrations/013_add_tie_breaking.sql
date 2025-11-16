-- UP
-- Add tie-breaking support to polls table
-- This allows creating tie-breaker polls for teams that are tied

ALTER TABLE polls 
ADD COLUMN IF NOT EXISTS parent_poll_id UUID REFERENCES polls(poll_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_tie_breaker BOOLEAN NOT NULL DEFAULT false;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_polls_parent_poll_id ON polls(parent_poll_id) WHERE parent_poll_id IS NOT NULL;

-- DOWN
DROP INDEX IF EXISTS idx_polls_parent_poll_id;
ALTER TABLE polls DROP COLUMN IF EXISTS is_tie_breaker;
ALTER TABLE polls DROP COLUMN IF EXISTS parent_poll_id;

