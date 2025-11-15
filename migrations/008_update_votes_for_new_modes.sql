-- UP
-- Update votes table to support multiple voting modes

-- Create vote_type enum
CREATE TYPE vote_type AS ENUM ('voter', 'judge');

-- Add vote_type column
ALTER TABLE votes ADD COLUMN vote_type vote_type NOT NULL DEFAULT 'voter';

-- Add judge_email for judge votes
ALTER TABLE votes ADD COLUMN judge_email VARCHAR(255);

-- Add rankings JSONB for ranked votes
-- Structure: [{"teamId": "uuid", "rank": 1, "points": 10, "reason": "optional"}]
ALTER TABLE votes ADD COLUMN rankings JSONB;

-- Change team_id_target to support multiple teams
-- Keep team_id_target for backward compatibility (single votes)
-- Add teams JSONB array for multiple/ranked votes
-- Structure for multiple: ["teamId1", "teamId2", ...]
-- Structure for ranked: [{"teamId": "uuid", "rank": 1, "points": 10}, ...]
ALTER TABLE votes ADD COLUMN teams JSONB;

-- Make team_id_target nullable since ranked/multiple votes won't use it
ALTER TABLE votes ALTER COLUMN team_id_target DROP NOT NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_votes_vote_type ON votes(vote_type);
CREATE INDEX IF NOT EXISTS idx_votes_judge_email ON votes(judge_email);
CREATE INDEX IF NOT EXISTS idx_votes_rankings ON votes USING GIN (rankings);
CREATE INDEX IF NOT EXISTS idx_votes_teams ON votes USING GIN (teams);

-- DOWN
DROP INDEX IF EXISTS idx_votes_teams;
DROP INDEX IF EXISTS idx_votes_rankings;
DROP INDEX IF EXISTS idx_votes_judge_email;
DROP INDEX IF EXISTS idx_votes_vote_type;

ALTER TABLE votes DROP COLUMN IF EXISTS teams;
ALTER TABLE votes DROP COLUMN IF EXISTS rankings;
ALTER TABLE votes DROP COLUMN IF EXISTS judge_email;
ALTER TABLE votes DROP COLUMN IF EXISTS vote_type;

-- Restore team_id_target NOT NULL constraint
-- Note: This might fail if there are null values, handle in migration script
-- ALTER TABLE votes ALTER COLUMN team_id_target SET NOT NULL;

DROP TYPE IF EXISTS vote_type;

