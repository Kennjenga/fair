-- UP
-- Add 'voters_only' option to voting_permissions enum

-- PostgreSQL doesn't support ALTER TYPE ... ADD VALUE in a transaction block
-- So we need to use a different approach
-- First, create a new type with all values
CREATE TYPE voting_permissions_new AS ENUM ('voters_only', 'judges_only', 'voters_and_judges');

-- Drop the default constraint temporarily (PostgreSQL can't cast defaults automatically)
ALTER TABLE polls 
  ALTER COLUMN voting_permissions DROP DEFAULT;

-- Update the column to use the new type
ALTER TABLE polls 
  ALTER COLUMN voting_permissions TYPE voting_permissions_new 
  USING voting_permissions::text::voting_permissions_new;

-- Restore the default value
ALTER TABLE polls 
  ALTER COLUMN voting_permissions SET DEFAULT 'voters_and_judges'::voting_permissions_new;

-- Drop the old type
DROP TYPE voting_permissions;

-- Rename the new type to the original name
ALTER TYPE voting_permissions_new RENAME TO voting_permissions;

-- DOWN
-- Revert to original enum (remove 'voters_only')
CREATE TYPE voting_permissions_old AS ENUM ('judges_only', 'voters_and_judges');

-- Update any polls with 'voters_only' to 'voters_and_judges' before changing type
UPDATE polls SET voting_permissions = 'voters_and_judges' WHERE voting_permissions = 'voters_only';

-- Drop the default constraint temporarily
ALTER TABLE polls 
  ALTER COLUMN voting_permissions DROP DEFAULT;

-- Update the column to use the old type
ALTER TABLE polls 
  ALTER COLUMN voting_permissions TYPE voting_permissions_old 
  USING voting_permissions::text::voting_permissions_old;

-- Restore the default value
ALTER TABLE polls 
  ALTER COLUMN voting_permissions SET DEFAULT 'voters_and_judges'::voting_permissions_old;

-- Drop the current type
DROP TYPE voting_permissions;

-- Rename the old type back
ALTER TYPE voting_permissions_old RENAME TO voting_permissions;

