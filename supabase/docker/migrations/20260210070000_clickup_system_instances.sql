-- Add system instance support to clickup_connections
-- System instances are visible to admin/owner but only editable by super_admin

ALTER TABLE public.clickup_connections
ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS connection_type TEXT DEFAULT 'user' CHECK (
    connection_type IN ('system', 'user')
);

-- Drop old permissive RLS policies
DROP POLICY IF EXISTS "Users manage own clickup connections" ON public.clickup_connections;

DROP POLICY IF EXISTS "Service role full access clickup" ON public.clickup_connections;

-- New RLS Policies

-- 1. Service role full access (workers, scripts)
CREATE POLICY "Service role full access clickup" ON public.clickup_connections FOR ALL TO service_role USING (true);

-- 2. Users can SELECT their own connections AND system connections (if admin/owner/system_admin)
CREATE POLICY "Users read own and system connections" ON public.clickup_connections FOR
SELECT TO authenticated USING (
        user_id = auth.uid ()
        OR (
            is_system = true
            AND public.get_current_user_role () IN (
                'system_admin', 'owner', 'admin'
            )
        )
    );

-- 3. Users can INSERT/UPDATE/DELETE their own non-system connections
CREATE POLICY "Users manage own user connections" ON public.clickup_connections FOR ALL TO authenticated USING (
    user_id = auth.uid ()
    AND is_system = false
)
WITH
    CHECK (
        user_id = auth.uid ()
        AND is_system = false
    );

-- 4. Only system_admin can INSERT/UPDATE/DELETE system connections
CREATE POLICY "System admin manages system connections" ON public.clickup_connections FOR ALL TO authenticated USING (
    is_system = true
    AND public.get_current_user_role () = 'system_admin'
)
WITH
    CHECK (
        is_system = true
        AND public.get_current_user_role () = 'system_admin'
    );