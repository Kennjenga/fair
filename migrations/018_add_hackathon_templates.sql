-- UP
-- Create hackathon_templates table for reusable governance frameworks

CREATE TABLE IF NOT EXISTS hackathon_templates (
  template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  governance_model VARCHAR(100) NOT NULL,
  intended_use TEXT,
  complexity_level VARCHAR(20) NOT NULL CHECK (complexity_level IN ('beginner', 'intermediate', 'advanced')),
  
  -- Configuration stored as JSONB
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Default form fields for this template
  default_form_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Visibility
  is_built_in BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES admins(admin_id) ON DELETE CASCADE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_templates_governance_model ON hackathon_templates(governance_model);
CREATE INDEX IF NOT EXISTS idx_templates_created_by ON hackathon_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_templates_is_built_in ON hackathon_templates(is_built_in);
CREATE INDEX IF NOT EXISTS idx_templates_complexity ON hackathon_templates(complexity_level);

-- DOWN
DROP INDEX IF EXISTS idx_templates_complexity;
DROP INDEX IF EXISTS idx_templates_is_built_in;
DROP INDEX IF EXISTS idx_templates_created_by;
DROP INDEX IF EXISTS idx_templates_governance_model;
DROP TABLE IF EXISTS hackathon_templates;
