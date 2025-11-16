-- UP
-- Add voting_sequence field to polls table
-- This controls whether voters and judges vote simultaneously or sequentially

CREATE TYPE voting_sequence AS ENUM ('simultaneous', 'voters_first');

ALTER TABLE polls 
ADD COLUMN IF NOT EXISTS voting_sequence voting_sequence NOT NULL DEFAULT 'simultaneous';

-- DOWN
ALTER TABLE polls DROP COLUMN IF EXISTS voting_sequence;
DROP TYPE IF EXISTS voting_sequence;

