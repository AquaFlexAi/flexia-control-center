/**
 * Cloudflare Service for dynamic Access Policy management.
 * Used to automatically whitelist node IPs during registration.
 */

const API_BASE = 'https://api.cloudflare.com/client/v4';

const API_TOKEN = process.env.CF_API_TOKEN;
const ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const DOMAIN = process.env.TEST_DOMAIN || 'flshbm.org';

export class CloudflareService {
    private static headers = {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
    };

    private static async fetchAPI(endpoint: string, method = 'GET', body?: any) {
        if (!API_TOKEN || !ACCOUNT_ID) {
            console.warn('[CloudflareService] Missing credentials, skipping API call.');
            return null;
        }

        const url = `${API_BASE}${endpoint}`;
        const options: RequestInit = { 
            method, 
            headers: this.headers,
            cache: 'no-store'
        };
        if (body) options.body = JSON.stringify(body);

        try {
            const res = await fetch(url, options);
            const data = await res.json();

            if (!data.success) {
                console.error(`[CloudflareService] API Error [${method} ${endpoint}]:`, JSON.stringify(data.errors));
                return null;
            }
            return data.result;
        } catch (error) {
            console.error(`[CloudflareService] Fetch Exception [${method} ${endpoint}]:`, error);
            return null;
        }
    }

    /**
     * Whitelists an IP in the Cloudflare Access Policy for the configured domain.
     * Uses/Creates a dedicated "FlexIA Node Whitelist" policy.
     * @param ip New IP to whitelist
     * @param oldIp (Optional) Old IP to remove from the whitelist
     */
    static async whitelistIP(ip: string, oldIp?: string | null): Promise<boolean> {
        console.log(`[CloudflareService] Attempting to whitelist IP: ${ip}`);
        
        try {
            // 1. Get the Access Application for the domain
            const apps = await this.fetchAPI(`/accounts/${ACCOUNT_ID}/access/apps`);
            if (!apps) return false;

            const wildcardDomain = `*.${DOMAIN}`;
            const app = apps.find((a: any) => a.domain === wildcardDomain || a.domain === DOMAIN);

            if (!app) {
                console.error(`[CloudflareService] Could not find Access App for ${DOMAIN}`);
                return false;
            }

            // 2. Get the policies
            const policies = await this.fetchAPI(`/accounts/${ACCOUNT_ID}/access/apps/${app.id}/policies`);
            if (!policies) return false;

            // We use a dedicated policy for nodes to avoid touching user email policies
            const POLICY_NAME = 'FlexIA Node Whitelist';
            let policy = policies.find((p: any) => p.name === POLICY_NAME);
            
            if (!policy) {
                console.log(`[CloudflareService] Creating new policy: ${POLICY_NAME}`);
                policy = await this.fetchAPI(`/accounts/${ACCOUNT_ID}/access/apps/${app.id}/policies`, 'POST', {
                    name: POLICY_NAME,
                    decision: 'allow',
                    include: []
                });
                if (!policy) return false;
            }

            // 3. Update the policy to include the new IP
            const includeRules = [...(policy.include || [])];
            
            // Check if IP already whitelisted
            const alreadyWhitelisted = includeRules.some((rule: any) => rule.ip?.ip === ip);
            
            // Remove old IP if provided
            let changed = false;
            if (oldIp && oldIp !== ip) {
                const initialLength = includeRules.length;
                const filteredRules = includeRules.filter((rule: any) => rule.ip?.ip !== oldIp);
                if (filteredRules.length < initialLength) {
                    console.log(`[CloudflareService] Removing old IP: ${oldIp}`);
                    includeRules.length = 0;
                    includeRules.push(...filteredRules);
                    changed = true;
                }
            }

            if (alreadyWhitelisted && !changed) {
                console.log(`[CloudflareService] IP ${ip} already whitelisted and no old IP to remove.`);
                return true;
            }

            // Add new IP rule
            if (!alreadyWhitelisted && ip) {
                includeRules.push({ ip: { ip } });
                changed = true;
            }

            if (!changed) return true;

            const updateData = {
                ...policy,
                include: includeRules
            };

            const result = await this.fetchAPI(
                `/accounts/${ACCOUNT_ID}/access/apps/${app.id}/policies/${policy.id}`,
                'PUT',
                updateData
            );

            if (result) {
                console.log(`[CloudflareService] Successfully updated ${POLICY_NAME} with IP: ${ip}`);
                return true;
            }

            return false;
        } catch (error) {
            console.error('[CloudflareService] Whitelist IP Exception:', error);
            return false;
        }
    }

    /**
     * Revokes an IP from the Cloudflare Access Policy.
     */
    static async revokeIP(ip: string): Promise<boolean> {
        console.log(`[CloudflareService] Revoking IP: ${ip}`);
        return this.whitelistIP('', ip); // Passing empty string as new IP effectively just removes oldIp
    }
}
