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

-- Enable RLS for Branding
ALTER TABLE branding_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for all authenticated" ON branding_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow write for system admin" ON branding_settings FOR ALL TO authenticated USING (
    public.get_current_user_role() = 'system_admin'
);
