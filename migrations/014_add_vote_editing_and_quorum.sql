-- UP
-- Add vote editing and quorum requirements to polls table
-- This allows polls to control whether votes can be changed after submission
-- and sets minimum participation thresholds for voters and judges

ALTER TABLE polls 
ADD COLUMN IF NOT EXISTS allow_vote_editing BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS min_voter_participation INTEGER,
ADD COLUMN IF NOT EXISTS min_judge_participation INTEGER;

-- Add check constraints for quorum values (must be positive if set)
ALTER TABLE polls 
ADD CONSTRAINT check_min_voter_participation 
  CHECK (min_voter_participation IS NULL OR min_voter_participation > 0);

ALTER TABLE polls 
ADD CONSTRAINT check_min_judge_participation 
  CHECK (min_judge_participation IS NULL OR min_judge_participation > 0);

-- DOWN
ALTER TABLE polls DROP CONSTRAINT IF EXISTS check_min_judge_participation;
ALTER TABLE polls DROP CONSTRAINT IF EXISTS check_min_voter_participation;
ALTER TABLE polls DROP COLUMN IF EXISTS min_judge_participation;
ALTER TABLE polls DROP COLUMN IF EXISTS min_voter_participation;
ALTER TABLE polls DROP COLUMN IF EXISTS allow_vote_editing;

