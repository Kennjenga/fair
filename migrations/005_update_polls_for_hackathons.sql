-- UP
-- Update polls table to support hackathons and new voting modes

-- Create enums for voting modes and permissions
CREATE TYPE voting_mode AS ENUM ('single', 'multiple', 'ranked');
CREATE TYPE voting_permissions AS ENUM ('judges_only', 'voters_and_judges');

-- Add hackathon_id to polls (nullable initially for migration)
ALTER TABLE polls ADD COLUMN hackathon_id UUID REFERENCES hackathons(hackathon_id) ON DELETE CASCADE;

-- Add voting mode and permissions
ALTER TABLE polls ADD COLUMN voting_mode voting_mode NOT NULL DEFAULT 'single';
ALTER TABLE polls ADD COLUMN voting_permissions voting_permissions NOT NULL DEFAULT 'voters_and_judges';

-- Add weight fields for weighted voting
ALTER TABLE polls ADD COLUMN voter_weight DECIMAL(10, 2) NOT NULL DEFAULT 1.0;
ALTER TABLE polls ADD COLUMN judge_weight DECIMAL(10, 2) NOT NULL DEFAULT 1.0;

-- Add rank points configuration (JSONB for flexible configuration)
-- Example: {"1": 10, "2": 7, "3": 5, "4": 3, "5": 1}
ALTER TABLE polls ADD COLUMN rank_points_config JSONB DEFAULT '{"1": 10, "2": 7, "3": 5, "4": 3, "5": 1}'::jsonb;

-- Add index for hackathon_id
CREATE INDEX IF NOT EXISTS idx_polls_hackathon_id ON polls(hackathon_id);

-- DOWN
DROP INDEX IF EXISTS idx_polls_hackathon_id;
ALTER TABLE polls DROP COLUMN IF EXISTS rank_points_config;
ALTER TABLE polls DROP COLUMN IF EXISTS judge_weight;
ALTER TABLE polls DROP COLUMN IF EXISTS voter_weight;
ALTER TABLE polls DROP COLUMN IF EXISTS voting_permissions;
ALTER TABLE polls DROP COLUMN IF EXISTS voting_mode;
ALTER TABLE polls DROP COLUMN IF EXISTS hackathon_id;
DROP TYPE IF EXISTS voting_permissions;
DROP TYPE IF EXISTS voting_mode;

