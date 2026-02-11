-- Support for Crypto Staking as Payment Method
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'stripe';

ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS staking_details JSONB DEFAULT '{}'::jsonb;

-- Track individual staked assets for Mudarabah
CREATE TABLE IF NOT EXISTS public.staked_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID REFERENCES auth.users (id) ON DELETE CASCADE,
    asset_type TEXT NOT NULL, -- 'BTC', 'ETH', 'BNB', 'USDT'
    amount DECIMAL(36, 18) NOT NULL,
    entry_price_usd DECIMAL(36, 18),
    staked_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT now(),
        last_yield_check_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT now(),
        is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.staked_assets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can view own staked assets" ON public.staked_assets FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Index
CREATE INDEX IF NOT EXISTS idx_staked_assets_user ON public.staked_assets (user_id);