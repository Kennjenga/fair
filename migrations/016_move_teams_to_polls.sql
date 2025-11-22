-- UP
-- Move teams from hackathons back to polls
-- Teams should belong to polls, not hackathons, as different polls may have different teams

-- Add poll_id column (nullable initially)
ALTER TABLE teams ADD COLUMN IF NOT EXISTS poll_id UUID REFERENCES polls(poll_id) ON DELETE CASCADE;

-- Migrate existing data: assign teams to polls through their hackathons
-- For each team, find the first poll in the same hackathon
UPDATE teams t
SET poll_id = (
  SELECT p.poll_id 
  FROM polls p 
  WHERE p.hackathon_id = t.hackathon_id 
  ORDER BY p.created_at ASC
  LIMIT 1
)
WHERE t.hackathon_id IS NOT NULL 
  AND t.poll_id IS NULL;

-- Delete orphaned teams that cannot be assigned to any poll
-- These are teams that don't have a matching poll in their hackathon
DELETE FROM teams WHERE poll_id IS NULL AND hackathon_id IS NOT NULL;

-- Also delete teams with NULL hackathon_id (shouldn't exist, but handle edge case)
DELETE FROM teams WHERE poll_id IS NULL;

-- Verify no NULL poll_id values remain before proceeding
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM teams WHERE poll_id IS NULL) THEN
    RAISE EXCEPTION 'Cannot proceed: Some teams still have NULL poll_id after migration';
  END IF;
END $$;

-- Drop the old hackathon_id foreign key constraint
ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_hackathon_id_fkey;

-- Remove hackathon_id column
ALTER TABLE teams DROP COLUMN IF EXISTS hackathon_id;

-- Update unique constraint to use poll_id
ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_hackathon_id_team_name_key;
ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_poll_id_team_name_key;
ALTER TABLE teams ADD CONSTRAINT teams_poll_id_team_name_key UNIQUE(poll_id, team_name);

-- Update indexes
DROP INDEX IF EXISTS idx_teams_hackathon_id;
CREATE INDEX IF NOT EXISTS idx_teams_poll_id ON teams(poll_id);

-- Make poll_id NOT NULL after migration (should be safe now as we deleted orphaned teams)
ALTER TABLE teams ALTER COLUMN poll_id SET NOT NULL;

-- DOWN
-- Restore teams to hackathons structure
ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_poll_id_team_name_key;
DROP INDEX IF EXISTS idx_teams_poll_id;

ALTER TABLE teams ADD COLUMN hackathon_id UUID REFERENCES hackathons(hackathon_id) ON DELETE CASCADE;

-- Migrate data back (if needed)
UPDATE teams t
SET hackathon_id = p.hackathon_id
FROM polls p
WHERE t.poll_id = p.poll_id
  AND p.hackathon_id IS NOT NULL;

ALTER TABLE teams ADD CONSTRAINT teams_hackathon_id_team_name_key UNIQUE(hackathon_id, team_name);
CREATE INDEX IF NOT EXISTS idx_teams_hackathon_id ON teams(hackathon_id);

ALTER TABLE teams DROP COLUMN IF EXISTS poll_id;

