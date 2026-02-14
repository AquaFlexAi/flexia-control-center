
-- 1. Sovereign Vouchers Table
CREATE TABLE IF NOT EXISTS sovereign_vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    miner_address TEXT NOT NULL,
    tokens NUMERIC NOT NULL,
    task_hash TEXT NOT NULL,
    timestamp BIGINT NOT NULL,
    voucher_data TEXT NOT NULL,
    signature TEXT NOT NULL,
    status TEXT DEFAULT 'unclaimed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Update Deployed Instances
ALTER TABLE deployed_instances 
ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(id),
ADD COLUMN IF NOT EXISTS total_flx_earned NUMERIC DEFAULT 0;

-- 3. Add Index for performance
CREATE INDEX IF NOT EXISTS idx_sovereign_vouchers_miner ON sovereign_vouchers(miner_address);
CREATE INDEX IF NOT EXISTS idx_deployed_instances_service_id ON deployed_instances(service_id);
