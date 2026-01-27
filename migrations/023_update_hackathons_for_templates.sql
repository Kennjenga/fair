-- UP
-- Update hackathons table to support templates and enhanced workflow

-- Add template reference
ALTER TABLE hackathons ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES hackathon_templates(template_id) ON DELETE SET NULL;

-- Add status tracking
ALTER TABLE hackathons ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'live', 'closed', 'finalized'));

-- Add governance configuration
ALTER TABLE hackathons ADD COLUMN IF NOT EXISTS governance_config JSONB DEFAULT '{}'::jsonb;

-- Add deadline tracking
ALTER TABLE hackathons ADD COLUMN IF NOT EXISTS submission_deadline TIMESTAMP;
ALTER TABLE hackathons ADD COLUMN IF NOT EXISTS evaluation_deadline TIMESTAMP;
ALTER TABLE hackathons ADD COLUMN IF NOT EXISTS results_published_at TIMESTAMP;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_hackathons_template ON hackathons(template_id);
CREATE INDEX IF NOT EXISTS idx_hackathons_status ON hackathons(status);
CREATE INDEX IF NOT EXISTS idx_hackathons_submission_deadline ON hackathons(submission_deadline);

-- DOWN
DROP INDEX IF EXISTS idx_hackathons_submission_deadline;
DROP INDEX IF EXISTS idx_hackathons_status;
DROP INDEX IF EXISTS idx_hackathons_template;

ALTER TABLE hackathons DROP COLUMN IF EXISTS results_published_at;
ALTER TABLE hackathons DROP COLUMN IF EXISTS evaluation_deadline;
ALTER TABLE hackathons DROP COLUMN IF EXISTS submission_deadline;
ALTER TABLE hackathons DROP COLUMN IF EXISTS governance_config;
ALTER TABLE hackathons DROP COLUMN IF EXISTS status;
ALTER TABLE hackathons DROP COLUMN IF EXISTS template_id;
