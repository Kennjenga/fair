-- UP
-- Add project information fields to teams table
ALTER TABLE teams
ADD COLUMN IF NOT EXISTS project_name VARCHAR(500),
ADD COLUMN IF NOT EXISTS project_description TEXT,
ADD COLUMN IF NOT EXISTS pitch TEXT,
ADD COLUMN IF NOT EXISTS live_site_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS github_url VARCHAR(500);

-- Migrate existing metadata to new columns if metadata exists
UPDATE teams
SET 
  project_name = (metadata->>'projectName')::VARCHAR(500),
  project_description = (metadata->>'projectDescription')::TEXT,
  pitch = (metadata->>'pitch')::TEXT,
  live_site_url = (metadata->>'liveSiteUrl')::VARCHAR(500),
  github_url = (metadata->>'githubUrl')::VARCHAR(500)
WHERE metadata IS NOT NULL 
  AND (
    metadata->>'projectName' IS NOT NULL 
    OR metadata->>'projectDescription' IS NOT NULL 
    OR metadata->>'pitch' IS NOT NULL 
    OR metadata->>'liveSiteUrl' IS NOT NULL 
    OR metadata->>'githubUrl' IS NOT NULL
  );

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_teams_project_name ON teams(project_name) WHERE project_name IS NOT NULL;

-- DOWN
-- Remove project information fields
DROP INDEX IF EXISTS idx_teams_project_name;
ALTER TABLE teams
DROP COLUMN IF EXISTS project_name,
DROP COLUMN IF EXISTS project_description,
DROP COLUMN IF EXISTS pitch,
DROP COLUMN IF EXISTS live_site_url,
DROP COLUMN IF EXISTS github_url;


