---
title: "DATABASE SCHEMA - DDD Design"
description: "Detailed design document for the DATABASE SCHEMA component of the FlexIA system, following Domain-Driven Design principles."
keywords: ["ddd", "design", "architecture", "database-schema", "specification"]
category: "Reports"
last_updated: "2026-02-13"
---
# Database Schema Design

## 1. Deployed Instances
Tracks all registered AI Router instances.

```sql
CREATE TABLE public.deployed_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    provider TEXT NOT NULL, -- 'gcp', 'aws', 'digitalocean', 'local'
    region TEXT,
    version TEXT,
    
    -- Mining / Wallet Identity
    wallet_address TEXT, -- Linked Wallet for Mining Rewards
    config JSONB DEFAULT '{}'::jsonb, -- Local overrides, allowed models, etc.
    
    -- Status & Health
    status TEXT DEFAULT 'active', -- 'active', 'offline', 'suspended'
    last_heartbeat_at TIMESTAMP WITH TIME ZONE,
    
    -- Configuration
    config JSONB DEFAULT '{}'::jsonb, -- Local overrides, allowed models, etc.
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes
CREATE INDEX idx_deployed_instances_owner ON public.deployed_instances(owner_id);
CREATE INDEX idx_deployed_instances_status ON public.deployed_instances(status);
```

## 2. Instance API Keys
Securely stores credentials for instances to authenticate with the Central System.

```sql
CREATE TABLE public.instance_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID REFERENCES public.deployed_instances(id) ON DELETE CASCADE,
    
    -- Security
    key_hash TEXT NOT NULL, -- Store bcrypt/argon2 hash, NOT plain text
    key_prefix TEXT NOT NULL, -- First 8 chars for lookup (e.g., 'sk-inst-')
    
    label TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for fast lookup during auth
CREATE INDEX idx_instance_api_keys_lookup ON public.instance_api_keys(key_prefix) WHERE is_active = true;
```

## 3. Instance Usage Events
Stores raw usage data reported by instances. Partitioning recommended for high volume.

```sql
CREATE TABLE public.instance_usage_events (
    id BIGSERIAL PRIMARY KEY,
    instance_id UUID REFERENCES public.deployed_instances(id) ON DELETE SET NULL,
    
    -- Event Details
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    event_type TEXT DEFAULT 'completion', -- 'completion', 'embedding', 'error'
    
    -- AI Specifics
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    
    -- Quantitative
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    cost DECIMAL(18, 10) DEFAULT 0, -- Store with high precision
    processing_time_ms INTEGER,
    
    -- Metadata from SaaS User
    end_user_id TEXT, -- 'X-User-ID' header
    trace_id TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() -- Ingestion time
);

-- Time-series Index
CREATE INDEX idx_usage_events_time_instance ON public.instance_usage_events(instance_id, timestamp DESC);
```

## 4. Aggregated Usage (Optional View/Table)
For faster dashboard queries.

```sql
CREATE MATERIALIZED VIEW usage_daily_stats AS
SELECT
    instance_id,
    date_trunc('day', timestamp) as day,
    provider,
    model,
    SUM(total_tokens) as total_tokens,
    SUM(cost) as total_cost,
    COUNT(*) as request_count
FROM
    public.instance_usage_events
GROUP BY
    instance_id, day, provider, model;
```


