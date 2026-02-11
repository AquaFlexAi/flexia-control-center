-- Hosting Providers Schema
CREATE TABLE IF NOT EXISTS public.hosting_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    enabled BOOLEAN DEFAULT false,
    api_url TEXT,
    config_schema JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Provider Credentials (Encrypted)
CREATE TABLE IF NOT EXISTS public.provider_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    provider_id UUID REFERENCES public.hosting_providers (id) ON DELETE CASCADE,
    credentials JSONB NOT NULL, -- Encrypted content
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hosting_providers ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.provider_credentials ENABLE ROW LEVEL SECURITY;

-- Policies for Hosting Providers
CREATE POLICY "Public view hosting providers" ON public.hosting_providers FOR
SELECT USING (true);
-- Allow all to view available providers (or restrict to authenticated)

CREATE POLICY "Admin manage hosting providers" ON public.hosting_providers FOR ALL TO authenticated USING (
    public.get_current_user_role () IN ('system_admin', 'owner')
);

-- Policies for Credentials
CREATE POLICY "Admin manage credentials" ON public.provider_credentials FOR ALL TO authenticated USING (
    public.get_current_user_role () IN ('system_admin', 'owner')
);

CREATE POLICY "Service Role Full Access Providers" ON public.hosting_providers FOR ALL TO service_role USING (true);

CREATE POLICY "Service Role Full Access Credentials" ON public.provider_credentials FOR ALL TO service_role USING (true);