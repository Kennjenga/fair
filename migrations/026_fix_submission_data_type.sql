-- UP
-- Fix submission_data column type if it's TEXT instead of JSONB
-- This migration checks and converts the column type if needed

-- First, check if the column is TEXT and needs conversion
DO $$
BEGIN
  -- Check if column exists and is TEXT type
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'hackathon_submissions' 
      AND column_name = 'submission_data' 
      AND data_type = 'text'
  ) THEN
    -- Convert TEXT to JSONB
    -- First, validate that all existing data is valid JSON
    -- If any row has invalid JSON, this will fail
    ALTER TABLE hackathon_submissions 
    ALTER COLUMN submission_data TYPE jsonb 
    USING submission_data::jsonb;
    
    RAISE NOTICE 'Converted submission_data from TEXT to JSONB';
  ELSE
    RAISE NOTICE 'submission_data is already JSONB, no conversion needed';
  END IF;
END $$;

-- Also ensure file_references is JSONB
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'hackathon_submissions' 
      AND column_name = 'file_references' 
      AND data_type = 'text'
  ) THEN
    ALTER TABLE hackathon_submissions 
    ALTER COLUMN file_references TYPE jsonb 
    USING file_references::jsonb;
    
    RAISE NOTICE 'Converted file_references from TEXT to JSONB';
  ELSE
    RAISE NOTICE 'file_references is already JSONB, no conversion needed';
  END IF;
END $$;

-- DOWN
-- Note: We cannot safely convert JSONB back to TEXT without potential data loss
-- This migration is one-way only
-- If you need to revert, you would need to manually convert the data
