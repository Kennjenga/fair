-- UP
-- Add max_ranked_positions field to polls table
-- This allows poll creators to limit how many positions voters/judges can rank

ALTER TABLE polls 
ADD COLUMN IF NOT EXISTS max_ranked_positions INTEGER;

-- Set default to NULL (unlimited) for existing polls
-- NULL means rank all teams, a number means rank only top N positions

-- DOWN
ALTER TABLE polls DROP COLUMN IF EXISTS max_ranked_positions;

