-- UP
-- Add form_key column to hackathon_form_fields to support multiple forms per hackathon
-- This allows a hackathon to have separate forms like "team_formation" and "project_details"

-- Add form_key column with default 'default' for backward compatibility
ALTER TABLE hackathon_form_fields 
ADD COLUMN IF NOT EXISTS form_key VARCHAR(50) NOT NULL DEFAULT 'default';

-- Update unique constraint to include form_key
-- This allows the same field_name to exist in different forms (e.g., team_name in both team_formation and project_details)
ALTER TABLE hackathon_form_fields 
DROP CONSTRAINT IF EXISTS hackathon_form_fields_hackathon_id_field_name_key;

ALTER TABLE hackathon_form_fields 
ADD CONSTRAINT hackathon_form_fields_hackathon_id_form_key_field_name_key 
UNIQUE(hackathon_id, form_key, field_name);

-- Add index for form_key lookups
CREATE INDEX IF NOT EXISTS idx_form_fields_form_key ON hackathon_form_fields(hackathon_id, form_key);

-- DOWN
DROP INDEX IF EXISTS idx_form_fields_form_key;
ALTER TABLE hackathon_form_fields 
DROP CONSTRAINT IF EXISTS hackathon_form_fields_hackathon_id_form_key_field_name_key;
ALTER TABLE hackathon_form_fields 
ADD CONSTRAINT hackathon_form_fields_hackathon_id_field_name_key 
UNIQUE(hackathon_id, field_name);
ALTER TABLE hackathon_form_fields DROP COLUMN IF EXISTS form_key;
