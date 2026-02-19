-- 7. Deployed Instances & API Keys
CREATE TABLE IF NOT EXISTS public.deployed_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name TEXT NOT NULL,
    service_id UUID REFERENCES public.services (id) ON DELETE SET NULL,
    provider TEXT NOT NULL, -- 'local', 'aws', 'gcp', etc.
    region TEXT,
    version TEXT,
    config JSONB DEFAULT '{}',
    status TEXT DEFAULT 'provisioning', -- 'active', 'offline', 'error'
    last_heartbeat_at TIMESTAMP
    WITH
        TIME ZONE,
        owner_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
        created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT now()
);

-- API Keys for Instances (Hashed)
CREATE TABLE IF NOT EXISTS public.instance_api_keys (
    id BIGSERIAL PRIMARY KEY,
    instance_id UUID REFERENCES public.deployed_instances (id) ON DELETE CASCADE,
    key_hash TEXT NOT NULL,
    key_prefix TEXT NOT NULL, -- 'sk-inst-'
    label TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT now(),
        last_used_at TIMESTAMP
    WITH
        TIME ZONE
);

-- RLS
ALTER TABLE deployed_instances ENABLE ROW LEVEL SECURITY;

ALTER TABLE instance_api_keys ENABLE ROW LEVEL SECURITY;

-- Instance Policies
CREATE POLICY "Allow read for owner and admins" ON deployed_instances FOR
SELECT TO authenticated USING (
        auth.uid () = owner_id
        OR public.get_current_user_role () IN (
            'system_admin', 'owner', 'admin'
        )
    );

CREATE POLICY "Allow insert for authenticated users" ON deployed_instances FOR
INSERT
    TO authenticated
WITH
    CHECK (
        auth.uid () = owner_id
        OR public.get_current_user_role () IN (
            'system_admin',
            'owner',
            'admin'
        )
    );
-- Note: Service Role (API) bypasses RLS, so these are just for frontend/user access.

-- API Key Policies (Only admins can manage keys, or owner)
CREATE POLICY "Allow manage keys for owner and admins" ON instance_api_keys FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM deployed_instances di
        WHERE
            di.id = instance_api_keys.instance_id
            AND (
                di.owner_id = auth.uid ()
                OR public.get_current_user_role () IN (
                    'system_admin',
                    'owner',
                    'admin'
                )
            )
    )
);