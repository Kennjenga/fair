-- UP
-- Add poll_judges junction table

CREATE TABLE IF NOT EXISTS poll_judges (
  poll_id UUID NOT NULL REFERENCES polls(poll_id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (poll_id, email)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_poll_judges_poll_id ON poll_judges(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_judges_email ON poll_judges(email);

-- DOWN
DROP INDEX IF EXISTS idx_poll_judges_email;
DROP INDEX IF EXISTS idx_poll_judges_poll_id;
DROP TABLE IF EXISTS poll_judges;

