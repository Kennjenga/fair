-- Voters table for voter login (email + password)
-- Enables voters to log in and view their participations and vote records on the blockchain
CREATE TABLE IF NOT EXISTS voters (
  voter_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_voters_email ON voters(email);
