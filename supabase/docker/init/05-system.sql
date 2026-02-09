-- 3. Logs Table
CREATE TABLE IF NOT EXISTS logs (
    id BIGSERIAL PRIMARY KEY,
    service_id TEXT,
    level TEXT DEFAULT 'info',
    message TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for all authenticated" ON logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow write for devs and above" ON logs FOR INSERT TO authenticated WITH CHECK (
    public.get_current_user_role() IN ('system_admin', 'owner', 'admin', 'manager', 'developer')
);

-- 4. Hosting Providers
CREATE TABLE IF NOT EXISTS public.hosting_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- 'gcp', 'aws', 'digitalocean'
    display_name TEXT NOT NULL,
    enabled BOOLEAN DEFAULT false,
    config_schema JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Provider Credentials / Config
CREATE TABLE IF NOT EXISTS public.provider_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES public.hosting_providers(id) ON DELETE CASCADE,
    credentials JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT unique_active_config_per_provider UNIQUE (provider_id)
);

-- Enable RLS for Providers
ALTER TABLE hosting_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for managers and above" ON hosting_providers FOR SELECT TO authenticated USING (
    public.get_current_user_role() IN ('system_admin', 'owner', 'admin', 'manager')
);
CREATE POLICY "Allow write for system admin" ON hosting_providers FOR ALL TO authenticated USING (
    public.get_current_user_role() = 'system_admin'
);

ALTER TABLE provider_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for managers and above" ON provider_credentials FOR SELECT TO authenticated USING (
    public.get_current_user_role() IN ('system_admin', 'owner', 'admin', 'manager')
);
CREATE POLICY "Allow write for system admin" ON provider_credentials FOR ALL TO authenticated USING (
    public.get_current_user_role() = 'system_admin'
);

-- 6. Health Checks History
CREATE TABLE IF NOT EXISTS public.health_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES public.hosting_providers(id) ON DELETE CASCADE,
    check_type TEXT NOT NULL, -- 'connection', 'instance'
    status TEXT NOT NULL, -- 'healthy', 'unhealthy', 'error'
    details JSONB,
    instance_id TEXT, -- Optional, if checking specific instance
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE health_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for all authenticated" ON health_checks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow write for system admin" ON health_checks FOR ALL TO authenticated USING (
    public.get_current_user_role() = 'system_admin'
);
