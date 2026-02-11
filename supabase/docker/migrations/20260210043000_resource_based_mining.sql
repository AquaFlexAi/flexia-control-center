-- Add resource-based mining columns to usage tracking
-- Migration: Add resource metrics for Islamic profit-sharing model

ALTER TABLE public.instance_usage_events
ADD COLUMN IF NOT EXISTS cpu_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS memory_mb_seconds BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS gpu_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bandwidth_bytes BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS storage_gb_days DECIMAL(12, 4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS hosting_type TEXT DEFAULT 'cloud',
ADD COLUMN IF NOT EXISTS hardware_cost_usd DECIMAL(10, 4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS uptime_percentage DECIMAL(5, 2) DEFAULT 100.0,
ADD COLUMN IF NOT EXISTS avg_latency_ms INTEGER,
ADD COLUMN IF NOT EXISTS error_rate DECIMAL(5, 4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS resource_value_usd DECIMAL(10, 4) DEFAULT 0;

-- Create index for resource-based queries
CREATE INDEX IF NOT EXISTS idx_usage_events_resource_value ON public.instance_usage_events (
    instance_id,
    resource_value_usd DESC
);

-- Add profit tracking to instances
ALTER TABLE public.deployed_instances
ADD COLUMN IF NOT EXISTS total_resource_value_contributed DECIMAL(18, 6) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_flx_earned DECIMAL(18, 8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_profit_distribution_at TIMESTAMP
WITH
    TIME ZONE;

COMMENT ON COLUMN instance_usage_events.resource_value_usd IS 'Islamic finance: actual cost of resources provided (CPU, memory, bandwidth) for profit-sharing calculation';