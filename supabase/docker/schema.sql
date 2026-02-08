-- FlexIA Control Center Schema

-- 1. Services Table
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'offline',
    instances INTEGER DEFAULT 1,
    region TEXT,
    specs TEXT,
    endpoint TEXT,
    pending_action TEXT, -- e.g., 'starting', 'stopping', 'restarting'
    run_mode TEXT DEFAULT 'prod', -- 'dev' | 'prod'
    source_path TEXT, -- Local path for bind mounts
    branding_overlay JSONB, -- Custom logo, colors, etc.
    last_deployed TIMESTAMP
    WITH
        TIME ZONE DEFAULT now()
);

-- Global Branding Settings
CREATE TABLE IF NOT EXISTS public.branding_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    title TEXT DEFAULT 'FlexIA Control',
    primary_color TEXT DEFAULT '#8b5cf6',
    logo_path TEXT DEFAULT '/assets/flexia-logo.svg',
    footer_text TEXT DEFAULT 'Property of FlexIA AI',
    theme TEXT DEFAULT 'glass-dark',
    updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT now()
);

-- Insert default record if not exists
INSERT INTO
    public.branding_settings (id, title)
VALUES (
        '00000000-0000-0000-0000-000000000000',
        'FlexIA Control'
    ) ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON services FOR ALL USING (
    auth.role () = 'authenticated'
);

-- 2. Organization Credits Table
CREATE TABLE IF NOT EXISTS organization_credits (
    org_id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    balance INTEGER DEFAULT 0,
    tier TEXT DEFAULT 'starter',
    updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE organization_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON organization_credits FOR ALL USING (
    auth.role () = 'authenticated'
);

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

CREATE POLICY "Allow all for authenticated" ON logs FOR ALL USING (
    auth.role () = 'authenticated'
);

-- 4. Seed Initial Data
INSERT INTO services (name, type, status, instances, region, specs, endpoint)
VALUES 
('OpenCode IDE', 'Development Environment', 'online', 1, 'US-East (N. Virginia)', '4 vCPU / 8GB RAM', 'https://ide.flexia.io'),
('Agent Zero Cluster', 'Multi-Agent Swarm', 'processing', 4, 'EU-West (Ireland)', 'Auto-scaling (Node Cluster)', 'https://agents.flexia.io'),
('AI Router', 'API Gateway', 'online', 2, 'Global Edge', 'Serverless (Next.js Edge)', 'https://api.flexia.io');

INSERT INTO
    organization_credits (balance, tier)
VALUES (14250, 'pro');