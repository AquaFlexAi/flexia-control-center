-- Seed Initial Data

-- Branding Settings (Config)
INSERT INTO
    public.branding_settings (id, title)
VALUES (
        '00000000-0000-0000-0000-000000000000',
        'FlexIA Control'
    ) ON CONFLICT (id) DO NOTHING;

-- Services
INSERT INTO services (name, type, status, instances, region, specs, endpoint)
VALUES 
('OpenCode IDE', 'Development Environment', 'online', 1, 'US-East (N. Virginia)', '4 vCPU / 8GB RAM', 'https://ide.flexia.io'),
('Agent Zero Cluster', 'Multi-Agent Swarm', 'processing', 4, 'EU-West (Ireland)', 'Auto-scaling (Node Cluster)', 'https://agents.flexia.io'),
('AI Router', 'API Gateway', 'online', 2, 'Global Edge', 'Serverless (Next.js Edge)', 'https://api.flexia.io');

-- Organization Credits
INSERT INTO
    organization_credits (balance, tier)
VALUES (14250, 'pro');

-- Hosting Providers
INSERT INTO public.hosting_providers (name, display_name, enabled)
VALUES 
    ('gcp', 'Google Cloud Platform', false),
    ('aws', 'Amazon Web Services', false),
    ('digitalocean', 'DigitalOcean', false),
    ('hetzner', 'Hetzner Cloud', false)
ON CONFLICT (name) DO NOTHING;
