-- Allow token_hash to be NULL for judge votes (judges authenticate by email, not token)
-- Voter votes continue to set token_hash; judge votes leave it null.
ALTER TABLE votes ALTER COLUMN token_hash DROP NOT NULL;
