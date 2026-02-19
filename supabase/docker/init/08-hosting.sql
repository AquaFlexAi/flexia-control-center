-- 8. Compute Nodes (Infrastructure)
CREATE TABLE IF NOT EXISTS public.compute_nodes (
    id TEXT PRIMARY KEY, -- e.g. 'gcp-us-central1-123'
    name TEXT NOT NULL,
    provider TEXT NOT NULL, -- 'gcp', 'aws', 'hetzner', 'custom'
    region TEXT NOT NULL,
    ip_address TEXT,
    status TEXT NOT NULL DEFAULT 'provisioning', -- 'provisioning', 'ready', 'offline', 'error'
    resources JSONB NOT NULL, -- { cpuCores, ramGb, diskGb, gpu }
    connection_config JSONB, -- Encrypted connection details (SSH key, host, etc)
    tags TEXT[] DEFAULT '{}',
    account_name TEXT, -- Optional, linked to provider_credentials name
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE compute_nodes ENABLE ROW LEVEL SECURITY;

-- Policies
-- Read: Managers and above (same as providers)
CREATE POLICY "Allow read for managers and above" ON compute_nodes FOR
SELECT TO authenticated USING (
        public.get_current_user_role () IN (
            'system_admin', 'owner', 'admin', 'manager'
        )
    );

-- Write: System Admin only (provisioning/termination is a high-privilege action)
CREATE POLICY "Allow write for system admin" ON compute_nodes FOR ALL TO authenticated USING (
    public.get_current_user_role () = 'system_admin'
);