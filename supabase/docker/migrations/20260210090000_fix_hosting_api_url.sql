DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hosting_providers' AND column_name = 'api_url') THEN
        ALTER TABLE public.hosting_providers ADD COLUMN api_url TEXT;
    END IF;
END $$;