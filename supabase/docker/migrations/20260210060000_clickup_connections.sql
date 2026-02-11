-- Multi-Instance ClickUp OAuth Connections
-- Each SaaS user can connect multiple ClickUp workspaces

CREATE TABLE IF NOT EXISTS public.clickup_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL,
    label TEXT NOT NULL DEFAULT 'My Workspace',
    workspace_id TEXT,
    workspace_name TEXT,
    access_token TEXT NOT NULL,
    team_id TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clickup_connections_user ON public.clickup_connections (user_id);

-- RLS
ALTER TABLE public.clickup_connections ENABLE ROW LEVEL SECURITY;

-- Users can only see/manage their own connections
CREATE POLICY "Users manage own clickup connections" ON public.clickup_connections FOR ALL TO authenticated USING (user_id = auth.uid ())
WITH
    CHECK (user_id = auth.uid ());

-- Service role full access
CREATE POLICY "Service role full access clickup" ON public.clickup_connections FOR ALL TO service_role USING (true);