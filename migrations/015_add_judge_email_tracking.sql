-- UP
-- Add email tracking columns to poll_judges table
-- This allows tracking which judge invitation emails have been sent

ALTER TABLE poll_judges 
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS email_status VARCHAR(50) DEFAULT 'queued' CHECK (email_status IN ('queued', 'sent', 'delivered', 'bounced', 'failed')),
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS email_error_message TEXT;

-- Create index for faster lookups of unsent emails
CREATE INDEX IF NOT EXISTS idx_poll_judges_email_status ON poll_judges(poll_id, email_status) WHERE email_status IN ('queued', 'failed');

-- DOWN
DROP INDEX IF EXISTS idx_poll_judges_email_status;
ALTER TABLE poll_judges 
DROP COLUMN IF EXISTS email_error_message,
DROP COLUMN IF EXISTS email_sent_at,
DROP COLUMN IF EXISTS email_status,
DROP COLUMN IF EXISTS email_sent;

