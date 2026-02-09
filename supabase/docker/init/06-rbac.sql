
-- 06-rbac.sql: Role Based Access Control Tables

-- Roles Table (Lookup)
CREATE TABLE IF NOT EXISTS public.roles (
    key TEXT PRIMARY KEY, -- e.g., 'system_admin', 'owner'
    name TEXT NOT NULL,   -- e.g., 'System Admin'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Permissions Table (Lookup)
CREATE TABLE IF NOT EXISTS public.permissions (
    key TEXT PRIMARY KEY, -- e.g., 'view_dashboard', 'manage_services'
    description TEXT,
    module TEXT,          -- e.g., 'dashboard', 'services', 'billing'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Role Permissions (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_key TEXT REFERENCES public.roles(key) ON DELETE CASCADE,
    permission_key TEXT REFERENCES public.permissions(key) ON DELETE CASCADE,
    PRIMARY KEY (role_key, permission_key),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Everyone authenticated can read RBAC definitions (needed for UI to know what's possible)
CREATE POLICY "Allow read for authenticated" ON public.roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON public.permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON public.role_permissions FOR SELECT TO authenticated USING (true);

-- Only System Admin can modify RBAC definitions
CREATE POLICY "Allow write for system_admin" ON public.roles FOR ALL TO authenticated USING (public.get_current_user_role() = 'system_admin');
CREATE POLICY "Allow write for system_admin" ON public.permissions FOR ALL TO authenticated USING (public.get_current_user_role() = 'system_admin');
CREATE POLICY "Allow write for system_admin" ON public.role_permissions FOR ALL TO authenticated USING (public.get_current_user_role() = 'system_admin');
