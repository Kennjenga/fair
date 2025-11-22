-- UP
-- Fix judge email tracking columns
-- Ensure all required columns exist in poll_judges table

-- Add email_sent column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'poll_judges' AND column_name = 'email_sent'
  ) THEN
    ALTER TABLE poll_judges ADD COLUMN email_sent BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- Add email_status column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'poll_judges' AND column_name = 'email_status'
  ) THEN
    ALTER TABLE poll_judges 
    ADD COLUMN email_status VARCHAR(50) DEFAULT 'queued' 
    CHECK (email_status IN ('queued', 'sent', 'delivered', 'bounced', 'failed'));
  END IF;
END $$;

-- Add email_sent_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'poll_judges' AND column_name = 'email_sent_at'
  ) THEN
    ALTER TABLE poll_judges ADD COLUMN email_sent_at TIMESTAMP;
  END IF;
END $$;

-- Add email_error_message column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'poll_judges' AND column_name = 'email_error_message'
  ) THEN
    ALTER TABLE poll_judges ADD COLUMN email_error_message TEXT;
  END IF;
END $$;

-- Add has_voted column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'poll_judges' AND column_name = 'has_voted'
  ) THEN
    ALTER TABLE poll_judges ADD COLUMN has_voted BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_poll_judges_email_status ON poll_judges(poll_id, email_status) WHERE email_status IN ('queued', 'failed');

-- DOWN
-- This migration is idempotent, so the down migration just ensures columns can be dropped if needed
DROP INDEX IF EXISTS idx_poll_judges_email_status;
-- Note: We don't drop columns in the down migration as they might be needed by other parts of the system

