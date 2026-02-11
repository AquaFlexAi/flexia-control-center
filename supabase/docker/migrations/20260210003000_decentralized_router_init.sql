-- Decentralized AI Router Schema

-- 1. Deployed Instances
CREATE TABLE IF NOT EXISTS public.deployed_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Link to SaaS user (commented out for flexibility if auth schema varies)
    owner_id UUID, -- Placeholder for now to avoid dependency issues if auth.users not ready
    name TEXT NOT NULL,
    provider TEXT NOT NULL, -- 'gcp', 'aws', 'digitalocean', 'local'
    region TEXT,
    version TEXT,

-- Status & Health
status TEXT DEFAULT 'active', -- 'active', 'offline', 'suspended'
last_heartbeat_at TIMESTAMP
WITH
    TIME ZONE,

-- Configuration
config JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deployed_instances_status ON public.deployed_instances (status);

-- 2. Instance API Keys
CREATE TABLE IF NOT EXISTS public.instance_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID REFERENCES public.deployed_instances(id) ON DELETE CASCADE,

-- Security
key_hash TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    
    label TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_instance_api_keys_lookup ON public.instance_api_keys (key_prefix)
WHERE
    is_active = true;

-- 3. Instance Usage Events
CREATE TABLE IF NOT EXISTS public.instance_usage_events (
    id BIGSERIAL PRIMARY KEY,
    instance_id UUID REFERENCES public.deployed_instances(id) ON DELETE SET NULL,

-- Event Details
timestamp TIMESTAMP
WITH
    TIME ZONE NOT NULL,
    event_type TEXT DEFAULT 'completion',

-- AI Specifics
provider TEXT NOT NULL, model TEXT NOT NULL,

-- Quantitative
input_tokens INTEGER DEFAULT 0,
output_tokens INTEGER DEFAULT 0,
total_tokens INTEGER DEFAULT 0,
cost DECIMAL(18, 10) DEFAULT 0,
processing_time_ms INTEGER,

-- Metadata
end_user_id TEXT,
    trace_id TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usage_events_time_instance ON public.instance_usage_events (instance_id, timestamp DESC);

-- 4. Enable RLS
ALTER TABLE public.deployed_instances ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.instance_api_keys ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.instance_usage_events ENABLE ROW LEVEL SECURITY;

-- Policies
-- Service Role (Admin) Access
CREATE POLICY "Service role full access instances" ON public.deployed_instances FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access keys" ON public.instance_api_keys FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access usage" ON public.instance_usage_events FOR ALL TO service_role USING (true);

-- Authenticated Users (e.g. Dashboard Admins)
-- Assuming 'system_admin' role exists as per 05-system.sql context
CREATE POLICY "Admin full access instances" ON public.deployed_instances FOR ALL TO authenticated USING (
    public.get_current_user_role () IN ('system_admin', 'owner')
);