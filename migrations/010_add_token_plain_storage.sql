-- UP
-- Add column to store plain tokens encrypted for email sending
-- This allows retrieving plain tokens when sending emails

ALTER TABLE tokens 
ADD COLUMN IF NOT EXISTS plain_token_encrypted TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tokens_plain_token_encrypted ON tokens(plain_token_encrypted) WHERE plain_token_encrypted IS NOT NULL;

-- DOWN
DROP INDEX IF EXISTS idx_tokens_plain_token_encrypted;
ALTER TABLE tokens DROP COLUMN IF EXISTS plain_token_encrypted;

