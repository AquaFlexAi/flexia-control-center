-- Add is_archived column to services table
ALTER TABLE services
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

ALTER TABLE services
ADD COLUMN IF NOT EXISTS exposed_ip TEXT DEFAULT '0.0.0.0';