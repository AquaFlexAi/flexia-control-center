import { createAdminClient } from './supabase/server';

/**
 * Checks if a given IP address is authorized to access specific platform resources.
 * Authorized IPs include:
 * 1. Loopback addresses (for local build/service interaction)
 * 2. IPs assigned to active 'deployed_instances'
 * 3. Static whitelisted IPs (e.g. build system, admin IPs)
 */
export async function isIpAuthorized(ip: string, resource: 'registry' | 'rpc' | 'telemetry'): Promise<boolean> {
    // 1. Local Bypass
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('172.')) {
        return true;
    }

    const supabase = await createAdminClient();

    // 2. Check Deployed Instances (Automatic Whitelist)
    const { data: instance, error } = await supabase
        .from('deployed_instances')
        .select('id, status')
        .eq('last_ip', ip)
        .eq('status', 'active')
        .maybeSingle();

    if (instance) {
        console.log(`[IP Policy] Authorized IP ${ip} for ${resource} (Instance: ${instance.id})`);
        return true;
    }

    // 3. Check Static Whitelist (Optional system overrides)
    const { data: whitelist } = await supabase
        .from('ip_whitelist')
        .select('id')
        .eq('ip', ip)
        .maybeSingle();

    if (whitelist) {
        console.log(`[IP Policy] Authorized IP ${ip} for ${resource} (Manual Whitelist)`);
        return true;
    }

    console.warn(`[IP Policy] BOCKED IP ${ip} attempting to access ${resource}`);
    return false;
}
