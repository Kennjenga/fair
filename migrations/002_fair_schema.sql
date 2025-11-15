-- UP
-- FAIR Voting Platform Schema

-- Admins table (supports both regular admins and super admins)
CREATE TABLE IF NOT EXISTS admins (
  admin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_secret VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Polls table
CREATE TABLE IF NOT EXISTS polls (
  poll_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  allow_self_vote BOOLEAN DEFAULT FALSE,
  require_team_name_gate BOOLEAN DEFAULT TRUE,
  is_public_results BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES admins(admin_id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (end_time > start_time)
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  team_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name VARCHAR(255) NOT NULL,
  poll_id UUID NOT NULL REFERENCES polls(poll_id) ON DELETE CASCADE,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(poll_id, team_name)
);

-- Tokens table (one-time voting tokens)
CREATE TABLE IF NOT EXISTS tokens (
  token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(255) UNIQUE NOT NULL,
  poll_id UUID NOT NULL REFERENCES polls(poll_id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  delivery_status VARCHAR(50) DEFAULT 'queued' CHECK (delivery_status IN ('queued', 'sent', 'delivered', 'bounced', 'failed')),
  delivery_log JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(poll_id, email)
);

-- Votes table
CREATE TABLE IF NOT EXISTS votes (
  vote_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(poll_id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  team_id_target UUID NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tx_hash VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES admins(admin_id) ON DELETE SET NULL,
  poll_id UUID REFERENCES polls(poll_id) ON DELETE SET NULL,
  role VARCHAR(20),
  details JSONB,
  ip_address VARCHAR(45),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);
CREATE INDEX IF NOT EXISTS idx_polls_created_by ON polls(created_by);
CREATE INDEX IF NOT EXISTS idx_polls_dates ON polls(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_teams_poll_id ON teams(poll_id);
CREATE INDEX IF NOT EXISTS idx_tokens_poll_id ON tokens(poll_id);
CREATE INDEX IF NOT EXISTS idx_tokens_team_id ON tokens(team_id);
CREATE INDEX IF NOT EXISTS idx_tokens_token ON tokens(token);
CREATE INDEX IF NOT EXISTS idx_tokens_email ON tokens(email);
CREATE INDEX IF NOT EXISTS idx_tokens_used ON tokens(used);
CREATE INDEX IF NOT EXISTS idx_votes_poll_id ON votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_team_id_target ON votes(team_id_target);
CREATE INDEX IF NOT EXISTS idx_votes_tx_hash ON votes(tx_hash);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_poll_id ON audit_logs(poll_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

-- DOWN
DROP INDEX IF EXISTS idx_audit_logs_timestamp;
DROP INDEX IF EXISTS idx_audit_logs_action;
DROP INDEX IF EXISTS idx_audit_logs_poll_id;
DROP INDEX IF EXISTS idx_audit_logs_user_id;
DROP INDEX IF EXISTS idx_votes_tx_hash;
DROP INDEX IF EXISTS idx_votes_team_id_target;
DROP INDEX IF EXISTS idx_votes_poll_id;
DROP INDEX IF EXISTS idx_tokens_used;
DROP INDEX IF EXISTS idx_tokens_email;
DROP INDEX IF EXISTS idx_tokens_token;
DROP INDEX IF EXISTS idx_tokens_team_id;
DROP INDEX IF EXISTS idx_tokens_poll_id;
DROP INDEX IF EXISTS idx_teams_poll_id;
DROP INDEX IF EXISTS idx_polls_dates;
DROP INDEX IF EXISTS idx_polls_created_by;
DROP INDEX IF EXISTS idx_admins_role;
DROP INDEX IF EXISTS idx_admins_email;

DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS votes;
DROP TABLE IF EXISTS tokens;
DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS polls;
DROP TABLE IF EXISTS admins;

