-- FlexIA Sovereign Dashboard: Database Schema Migration
-- Phase 10: Sovereign Vouchers Table
-- This table stores all signed AI inference vouchers for dashboard tracking

-- Create the sovereign_vouchers table
CREATE TABLE IF NOT EXISTS sovereign_vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    miner_address TEXT NOT NULL,
    tokens INTEGER NOT NULL,
    task_hash TEXT NOT NULL,
    timestamp BIGINT NOT NULL,
    voucher_data TEXT NOT NULL,
    signature TEXT NOT NULL,
    status TEXT DEFAULT 'unclaimed' CHECK (
        status IN (
            'unclaimed',
            'claimed',
            'rejected'
        )
    ),
    claimed_at TIMESTAMPTZ,
    tx_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_sovereign_vouchers_miner ON sovereign_vouchers (miner_address);

CREATE INDEX IF NOT EXISTS idx_sovereign_vouchers_status ON sovereign_vouchers (status);

CREATE INDEX IF NOT EXISTS idx_sovereign_vouchers_timestamp ON sovereign_vouchers (timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_sovereign_vouchers_task_hash ON sovereign_vouchers (task_hash);

-- Enable Row Level Security (RLS)
ALTER TABLE sovereign_vouchers ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access (for backend API routes)
CREATE POLICY "Service role has full access to sovereign_vouchers" ON sovereign_vouchers FOR ALL TO service_role USING (true)
WITH
    CHECK (true);

-- Policy: Authenticated users can view all vouchers (read-only for now)
CREATE POLICY "Authenticated users can view sovereign_vouchers" ON sovereign_vouchers FOR
SELECT TO authenticated USING (true);

-- Add trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sovereign_vouchers_updated_at
BEFORE UPDATE ON sovereign_vouchers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON
TABLE sovereign_vouchers IS 'Stores signed AI inference vouchers for the Sovereign Dashboard';

COMMENT ON COLUMN sovereign_vouchers.miner_address IS 'Ethereum address of the miner who completed the inference task';

COMMENT ON COLUMN sovereign_vouchers.tokens IS 'Number of FLA tokens earned for this task';

COMMENT ON COLUMN sovereign_vouchers.task_hash IS 'Unique hash identifying the inference task';

COMMENT ON COLUMN sovereign_vouchers.timestamp IS 'Unix timestamp when the voucher was signed';

COMMENT ON COLUMN sovereign_vouchers.voucher_data IS 'ABI-encoded voucher payload for on-chain verification';

COMMENT ON COLUMN sovereign_vouchers.signature IS 'Authority signature for the voucher';

COMMENT ON COLUMN sovereign_vouchers.status IS 'Current status: unclaimed, claimed, or rejected';

COMMENT ON COLUMN sovereign_vouchers.claimed_at IS 'Timestamp when the voucher was claimed on-chain';

COMMENT ON COLUMN sovereign_vouchers.tx_hash IS 'Blockchain transaction hash for the claim (if claimed)';