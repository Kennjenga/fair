-- UP
-- Move teams from polls to hackathons

-- Add hackathon_id column (nullable initially)
ALTER TABLE teams ADD COLUMN hackathon_id UUID REFERENCES hackathons(hackathon_id) ON DELETE CASCADE;

-- Migrate existing data: assign teams to hackathons through their polls
-- This assumes polls have been migrated to have hackathon_id
UPDATE teams t
SET hackathon_id = p.hackathon_id
FROM polls p
WHERE t.poll_id = p.poll_id
  AND p.hackathon_id IS NOT NULL;

-- For teams where poll doesn't have hackathon_id yet, we'll need to handle this in data migration
-- For now, we'll make it nullable and handle in migration script

-- Drop the old poll_id foreign key constraint
ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_poll_id_fkey;

-- Remove poll_id column
ALTER TABLE teams DROP COLUMN IF EXISTS poll_id;

-- Update unique constraint to use hackathon_id
ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_poll_id_team_name_key;
ALTER TABLE teams ADD CONSTRAINT teams_hackathon_id_team_name_key UNIQUE(hackathon_id, team_name);

-- Update indexes
DROP INDEX IF EXISTS idx_teams_poll_id;
CREATE INDEX IF NOT EXISTS idx_teams_hackathon_id ON teams(hackathon_id);

-- Make hackathon_id NOT NULL after migration
-- This will be done in a separate step after data migration

-- DOWN
-- Restore teams to polls structure
ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_hackathon_id_team_name_key;
DROP INDEX IF EXISTS idx_teams_hackathon_id;

ALTER TABLE teams ADD COLUMN poll_id UUID REFERENCES polls(poll_id) ON DELETE CASCADE;

-- Migrate data back (if needed)
UPDATE teams t
SET poll_id = (
  SELECT p.poll_id 
  FROM polls p 
  WHERE p.hackathon_id = t.hackathon_id 
  LIMIT 1
)
WHERE t.hackathon_id IS NOT NULL;

ALTER TABLE teams ADD CONSTRAINT teams_poll_id_team_name_key UNIQUE(poll_id, team_name);
CREATE INDEX IF NOT EXISTS idx_teams_poll_id ON teams(poll_id);

ALTER TABLE teams DROP COLUMN IF EXISTS hackathon_id;

