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
CREATE POLICY "Allow read for admins and owners" ON organization_credits FOR SELECT TO authenticated USING (
    public.get_current_user_role() IN ('system_admin', 'owner', 'admin')
);
CREATE POLICY "Allow write for admins and owners" ON organization_credits FOR ALL TO authenticated USING (
    public.get_current_user_role() IN ('system_admin', 'owner', 'admin')
);

-- Organization Members
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'developer' CHECK (role IN ('system_admin', 'owner', 'admin', 'manager', 'developer', 'analyst', 'viewer')),
    last_activity TIMESTAMP
    WITH
        TIME ZONE DEFAULT now(),
        color TEXT DEFAULT 'bg-purple-500',
        joined_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT now()
);

-- Enable RLS for Members
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for all authenticated" ON organization_members FOR SELECT TO authenticated USING (true);

-- System Admin can do everything
CREATE POLICY "Allow full access for system admin" ON organization_members FOR ALL TO authenticated USING (
    public.get_current_user_role() = 'system_admin'
);

-- Owner can manage everyone except System Admin
CREATE POLICY "Allow management for owner" ON organization_members FOR ALL TO authenticated USING (
    public.get_current_user_role() = 'owner' AND role != 'system_admin'
) WITH CHECK (
    public.get_current_user_role() = 'owner' AND role != 'system_admin'
);

-- Admin can manage Manager, Developer, Analyst, Viewer
CREATE POLICY "Allow management for admin" ON organization_members FOR ALL TO authenticated USING (
    public.get_current_user_role() = 'admin' AND role NOT IN ('system_admin', 'owner', 'admin')
) WITH CHECK (
    public.get_current_user_role() = 'admin' AND role NOT IN ('system_admin', 'owner', 'admin')
);

-- Billing Transactions
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    org_id UUID REFERENCES public.organization_credits (org_id),
    type TEXT NOT NULL, -- 'topup', 'usage', 'subscription'
    description TEXT NOT NULL,
    amount FLOAT NOT NULL,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT now()
);

-- Enable RLS for Transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for admins and owners" ON transactions FOR SELECT TO authenticated USING (
    public.get_current_user_role() IN ('system_admin', 'owner', 'admin')
);
CREATE POLICY "Allow write for admins and owners" ON transactions FOR ALL TO authenticated USING (
    public.get_current_user_role() IN ('system_admin', 'owner', 'admin')
);
