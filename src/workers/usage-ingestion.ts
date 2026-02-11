import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { subscribeToTopic, KAFKA_CONFIG } from '../lib/events/kafka';

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:8000';
// Must use Service Role key for ingestion
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const KAFKA_TOPIC = 'usage-events';
const GROUP_ID = 'usage-ingestion-group';

if (!supabaseKey) {
    console.error('[UsageIngestion] Missing SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

import { calculateResourceValue } from '../services/resource-calculator';

async function handleUsageEvent(message: any) {
    try {
        const { instanceId, batchId, events } = message;

        if (!instanceId || !events || !Array.isArray(events)) {
            console.warn('[UsageIngestion] Invalid message format (missing instanceId or events):', message);
            return;
        }

        console.log(`[UsageIngestion] Processing batch ${batchId} for instance ${instanceId} with ${events.length} events...`);

        // --- Anomaly Detection ---
        const validEvents = [];
        const now = Date.now();
        const MAX_DRIFT_MS = 15 * 60 * 1000; // 15 mins
        const MAX_TOKENS_PER_EVENT = 100000; // Sanity limit for single request

        for (const e of events) {
            // 1. Timestamp Check
            const eventTime = new Date(e.timestamp).getTime();
            if (isNaN(eventTime) || Math.abs(now - eventTime) > MAX_DRIFT_MS) {
                console.warn(`[UsageIngestion] Dropping event with invalid timestamp: ${e.timestamp} (Instance: ${instanceId})`);
                continue;
            }

            // 2. Token Count Sanity Check
            const totalTokens = (e.tokens?.prompt_tokens || 0) + (e.tokens?.completion_tokens || 0);
            if (totalTokens < 0 || totalTokens > MAX_TOKENS_PER_EVENT) {
                console.warn(`[UsageIngestion] Dropping event with suspicious token count: ${totalTokens} (Instance: ${instanceId})`);
                continue;
            }

            // 3. Provider/Model Check (Basic)
            if (!e.provider || !e.model) {
                console.warn(`[UsageIngestion] Dropping event missing provider/model (Instance: ${instanceId})`);
                continue;
            }

            validEvents.push(e);
        }

        if (validEvents.length < events.length) {
            console.warn(`[UsageIngestion] Filtered out ${events.length - validEvents.length} anomalous events.`);
        }

        if (validEvents.length === 0) return;

        // Map events to DB schema
        const rows = validEvents.map((e: any) => {
            // Calculate Resource Value in USD (Islamic Finance benchmark)
            const resourceValueUsd = calculateResourceValue({
                cpu_seconds: e.cpu_seconds || 0,
                memory_mb_seconds: e.memory_mb_seconds || 0,
                gpu_seconds: e.gpu_seconds || 0,
                bandwidth_bytes: e.bandwidth_bytes || 0,
                storage_gb_days: e.storage_gb_days || 0,
                hosting_type: e.hosting_type || 'local',
                uptime_percentage: 100,
                error_rate: 0
            });

            return {
                instance_id: instanceId,
                timestamp: e.timestamp || new Date().toISOString(),
                provider: e.provider || 'unknown',
                model: e.model || 'unknown',
                input_tokens: e.tokens?.prompt_tokens || e.tokens?.input_tokens || 0,
                output_tokens: e.tokens?.completion_tokens || e.tokens?.output_tokens || 0,
                total_tokens: (e.tokens?.prompt_tokens || 0) + (e.tokens?.completion_tokens || 0),
                event_type: 'completion',
                cpu_seconds: Math.ceil(e.cpu_seconds || 0),
                memory_mb_seconds: Math.ceil(e.memory_mb_seconds || 0),
                gpu_seconds: Math.ceil(e.gpu_seconds || 0),
                hosting_type: e.hosting_type || 'local',
                resource_value_usd: resourceValueUsd,
                trace_id: e.traceId || e.id
            };
        });

        // Batch insert into instance_usage_events
        const { error } = await supabase
            .from('instance_usage_events')
            .insert(rows);

        if (error) {
            console.error('[UsageIngestion] DB Insert Error:', error);
        } else {
            console.log(`[UsageIngestion] Ingested ${rows.length} events for ${instanceId} (Batch: ${batchId})`);
        }
    } catch (err) {
        console.error('[UsageIngestion] Error processing batch:', err);
    }
}

async function startWorker() {
    console.log('[UsageIngestion] Starting worker...');
    try {
        await subscribeToTopic(KAFKA_TOPIC, handleUsageEvent, GROUP_ID);
    } catch (err) {
        console.error('[UsageIngestion] Worker failed to subscribe:', err);
    }
}

startWorker();
