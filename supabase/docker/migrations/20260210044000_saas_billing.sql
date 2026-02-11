-- SaaS Billing and Subscription Schema
-- Support for Islamic Finance Profit-Sharing Pool

-- 1. Subscription Tiers
DO $$ BEGIN
    CREATE TYPE public.subscription_tier AS ENUM ('free', 'pro', 'enterprise');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.subscription_status AS ENUM ('active', 'trialing', 'past_due', 'canceled', 'unpaid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. User Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID REFERENCES auth.users (id) ON DELETE CASCADE UNIQUE,
    tier public.subscription_tier DEFAULT 'free',
    status public.subscription_status DEFAULT 'active',
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    stripe_price_id TEXT,
    current_period_start TIMESTAMP
    WITH
        TIME ZONE,
        current_period_end TIMESTAMP
    WITH
        TIME ZONE,
        cancel_at_period_end BOOLEAN DEFAULT false,
        created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT now()
);

-- 3. Usage Quotas (Monthly)


CREATE TABLE IF NOT EXISTS public.user_usage_quotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    month_year DATE DEFAULT date_trunc('month', now())::date,
    
    token_usage_limit BIGINT,
    token_usage_current BIGINT DEFAULT 0,
    
    resource_value_limit DECIMAL(10,2),
    resource_value_current DECIMAL(10,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, month_year)
);

-- 4. User API Keys
CREATE TABLE IF NOT EXISTS public.user_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID REFERENCES auth.users (id) ON DELETE CASCADE,
    key_hash TEXT NOT NULL UNIQUE,
    key_prefix TEXT NOT NULL,
    label TEXT,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP
    WITH
        TIME ZONE,
        created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT now()
);

-- RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.user_usage_quotas ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can view own quotas" ON public.user_usage_quotas FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can manage own API keys" ON public.user_api_keys FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions (user_id);

CREATE INDEX IF NOT EXISTS idx_quotas_user_month ON public.user_usage_quotas (user_id, month_year);

CREATE INDEX IF NOT EXISTS idx_user_api_keys_hash ON public.user_api_keys (key_hash);