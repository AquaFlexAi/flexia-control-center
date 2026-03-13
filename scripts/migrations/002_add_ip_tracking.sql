
-- Migration: Add IP tracking to deployed_instances
ALTER TABLE deployed_instances ADD COLUMN IF NOT EXISTS last_ip TEXT;
