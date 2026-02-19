-- 1. Services Table
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    service_kind TEXT,
    slug TEXT,
    status TEXT DEFAULT 'offline',
    instances INTEGER DEFAULT 1,
    region TEXT,
    specs TEXT,
    endpoint TEXT,
    pending_action TEXT, -- e.g., 'starting', 'stopping', 'restarting'
    run_mode TEXT DEFAULT 'prod', -- 'dev' | 'prod'
    source_path TEXT, -- Local path for bind mounts
    branding_overlay JSONB, -- Custom logo, colors, etc.
    image TEXT, -- Docker image (e.g., 'flexia/opencode:latest')
    ports JSONB, -- Port mappings (e.g., {"3000": "3000"})
    env_vars JSONB, -- Environment variables (e.g., {"DEBUG": "true"})
    volumes JSONB, -- Bind mounts (e.g., ["/host:/container"])
    last_deployed TIMESTAMP
    WITH
        TIME ZONE DEFAULT now()
);

-- Service Telemetry (Time-series)
CREATE TABLE IF NOT EXISTS public.telemetry (
    id BIGSERIAL PRIMARY KEY,
    service_id UUID REFERENCES public.services (id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL, -- 'cpu', 'ram', 'tokens'
    value FLOAT NOT NULL,
    recorded_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT now()
);

-- Index for fast time-series queries
CREATE INDEX IF NOT EXISTS idx_telemetry_service_time ON public.telemetry (service_id, recorded_at DESC);

-- Enable RLS for Services
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for all authenticated" ON services FOR SELECT TO authenticated USING (true);

-- Split write access to enforce delete restriction
CREATE POLICY "Allow insert/update for devs and above" ON services FOR INSERT TO authenticated WITH CHECK (
    public.get_current_user_role() IN ('system_admin', 'owner', 'admin', 'manager', 'developer')
);

CREATE POLICY "Allow update for devs and above" ON services FOR UPDATE TO authenticated USING (
    public.get_current_user_role() IN ('system_admin', 'owner', 'admin', 'manager', 'developer')
) WITH CHECK (
    public.get_current_user_role() IN ('system_admin', 'owner', 'admin', 'manager', 'developer')
);

CREATE POLICY "Allow delete for admins and above" ON services FOR DELETE TO authenticated USING (
    public.get_current_user_role() IN ('system_admin', 'owner', 'admin')
);

-- Enable RLS for Telemetry
ALTER TABLE telemetry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for all authenticated" ON telemetry FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow write for devs and above" ON telemetry FOR INSERT TO authenticated WITH CHECK (
    public.get_current_user_role() IN ('system_admin', 'owner', 'admin', 'manager', 'developer')
);
