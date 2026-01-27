-- UP
-- Create hackathon_form_fields table for custom participation forms

CREATE TABLE IF NOT EXISTS hackathon_form_fields (
  field_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id UUID NOT NULL REFERENCES hackathons(hackathon_id) ON DELETE CASCADE,
  
  field_name VARCHAR(255) NOT NULL,
  field_type VARCHAR(50) NOT NULL CHECK (field_type IN ('text', 'long_text', 'url', 'file', 'select', 'multi_select', 'team_members')),
  field_label VARCHAR(255) NOT NULL,
  field_description TEXT,
  
  -- Validation
  is_required BOOLEAN DEFAULT FALSE,
  validation_rules JSONB DEFAULT '{}'::jsonb,
  
  -- Options for select/multi-select
  field_options JSONB DEFAULT '[]'::jsonb,
  
  -- Visibility
  visibility_scope VARCHAR(50) DEFAULT 'public' CHECK (visibility_scope IN ('public', 'judges_only', 'organizer_only')),
  
  -- Ordering
  display_order INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(hackathon_id, field_name)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_form_fields_hackathon ON hackathon_form_fields(hackathon_id);
CREATE INDEX IF NOT EXISTS idx_form_fields_display_order ON hackathon_form_fields(hackathon_id, display_order);

-- DOWN
DROP INDEX IF EXISTS idx_form_fields_display_order;
DROP INDEX IF EXISTS idx_form_fields_hackathon;
DROP TABLE IF EXISTS hackathon_form_fields;
