-- Add optional profile fields to admins for display name, phone, and organization
ALTER TABLE admins
  ADD COLUMN IF NOT EXISTS display_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS organization VARCHAR(255);
