-- UP
-- Create hackathon_submissions table for participant submissions

CREATE TABLE IF NOT EXISTS hackathon_submissions (
  submission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id UUID NOT NULL REFERENCES hackathons(hackathon_id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(team_id) ON DELETE SET NULL,
  
  -- Submission data (JSONB for flexibility)
  submission_data JSONB NOT NULL,
  
  -- File references (stored in Cloudinary, referenced here)
  file_references JSONB DEFAULT '[]'::jsonb,
  
  -- Integrity
  submission_hash VARCHAR(255) NOT NULL,
  
  -- Metadata
  submitted_by VARCHAR(255),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Immutability flag
  is_locked BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_submissions_hackathon ON hackathon_submissions(hackathon_id);
CREATE INDEX IF NOT EXISTS idx_submissions_team ON hackathon_submissions(team_id);
CREATE INDEX IF NOT EXISTS idx_submissions_hash ON hackathon_submissions(submission_hash);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_by ON hackathon_submissions(submitted_by);
CREATE INDEX IF NOT EXISTS idx_submissions_locked ON hackathon_submissions(is_locked);

-- DOWN
DROP INDEX IF EXISTS idx_submissions_locked;
DROP INDEX IF EXISTS idx_submissions_submitted_by;
DROP INDEX IF EXISTS idx_submissions_hash;
DROP INDEX IF EXISTS idx_submissions_team;
DROP INDEX IF EXISTS idx_submissions_hackathon;
DROP TABLE IF EXISTS hackathon_submissions;
