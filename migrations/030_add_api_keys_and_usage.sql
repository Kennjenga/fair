-- UP
-- External API: API keys for organizations and usage tracking for rate limits and billing

-- API keys: one per admin (or multiple per admin); store only hash and prefix
CREATE TABLE IF NOT EXISTS api_keys (
  api_key_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admins(admin_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(64) NOT NULL,
  key_prefix VARCHAR(16) NOT NULL,
  rate_limit_per_minute INTEGER DEFAULT 60,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP,
  revoked_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_keys_admin_id ON api_keys(admin_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_prefix ON api_keys(key_prefix);
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);

-- Usage records for rate limiting and billing (no PII)
CREATE TABLE IF NOT EXISTS api_key_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(api_key_id) ON DELETE CASCADE,
  endpoint VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_key_usage_api_key_created ON api_key_usage(api_key_id, created_at DESC);

-- DOWN
DROP INDEX IF EXISTS idx_api_key_usage_api_key_created;
DROP TABLE IF EXISTS api_key_usage;
DROP INDEX IF EXISTS idx_api_keys_key_hash;
DROP INDEX IF EXISTS idx_api_keys_key_prefix;
DROP INDEX IF EXISTS idx_api_keys_admin_id;
DROP TABLE IF EXISTS api_keys;
