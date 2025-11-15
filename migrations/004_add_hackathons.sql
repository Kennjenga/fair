-- UP
-- Add hackathons table

CREATE TABLE IF NOT EXISTS hackathons (
  hackathon_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_by UUID NOT NULL REFERENCES admins(admin_id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date > start_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_hackathons_created_by ON hackathons(created_by);
CREATE INDEX IF NOT EXISTS idx_hackathons_dates ON hackathons(start_date, end_date);

-- DOWN
DROP INDEX IF EXISTS idx_hackathons_dates;
DROP INDEX IF EXISTS idx_hackathons_created_by;
DROP TABLE IF EXISTS hackathons;

