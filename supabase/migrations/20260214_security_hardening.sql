-- Security Hardening Migration

-- 1. Create a table to track reward epochs/claims to prevent Replay Attacks
CREATE TABLE IF NOT EXISTS reward_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    epoch_start TIMESTAMPTZ NOT NULL,
    epoch_end TIMESTAMPTZ NOT NULL,
    instance_id UUID REFERENCES deployed_instances (id),
    amount_minted NUMERIC,
    tx_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (instance_id, epoch_end)
);

-- 2. Secure Aggregation Function (Prevention of OOM in Node.js layer)
CREATE OR REPLACE FUNCTION aggregate_miner_usage(
    min_timestamp TIMESTAMPTZ
)
RETURNS TABLE (
    instance_id UUID,
    wallet_address TEXT,
    total_tokens NUMERIC,
    total_cost NUMERIC,
    request_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id as instance_id,
        (i.config->>'walletAddress')::TEXT as wallet_address,
        COALESCE(SUM(u.total_tokens), 0) as total_tokens,
        COALESCE(SUM(u.cost), 0) as total_cost,
        COUNT(u.id) as request_count
    FROM 
        deployed_instances i
    LEFT JOIN 
        instance_usage_events u ON u.instance_id = i.id
    WHERE 
        (i.config->>'walletAddress') IS NOT NULL
        AND u.timestamp >= min_timestamp
        AND u.timestamp > COALESCE((i.config->>'lastRewardedAt')::TIMESTAMPTZ, '1970-01-01'::TIMESTAMPTZ)
    GROUP BY 
        i.id, i.config->>'walletAddress';
END;
$$;