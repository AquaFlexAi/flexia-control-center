/**
 * Centralized HashiCorp Vault Secret Retrieval
 * Logic derived from oracle.ts for ecosystem-wide use.
 */

export interface VaultSecret {
    [key: string]: any;
}

export async function getVaultSecret(bucket: string): Promise<VaultSecret | null> {
    const vaultAddr = process.env.VAULT_ADDR || 'http://localhost:8200';
    const vaultToken = process.env.VAULT_TOKEN || 'root';
    const secretPath = `secret/data/flexia/${bucket}`;

    try {
        const res = await fetch(`${vaultAddr}/v1/${secretPath}`, {
            headers: { 'X-Vault-Token': vaultToken },
            // Add a short timeout to prevent blocking if Vault is down
            signal: AbortSignal.timeout(2000)
        });

        if (res.ok) {
            const json = await res.json();
            return json.data?.data || null;
        }

        // Log errors but don't throw, allowing fallback to env
        if (res.status !== 404) {
            console.warn(`[Vault] Non-200 response for bucket ${bucket}: ${res.status} ${res.statusText}`);
        }
    } catch (err: any) {
        console.warn(`[Vault] Unreachable for bucket ${bucket}: ${err.message}`);
    }

    return null;
}

/**
 * Get a specific configuration value, prioritizing Vault
 */
export async function getConfigValue(bucket: string, key: string, fallback?: string): Promise<string> {
    // 1. Try Vault
    const secrets = await getVaultSecret(bucket);
    if (secrets && secrets[key]) {
        return secrets[key];
    }

    // 2. Fallback to Env
    if (process.env[key]) {
        return process.env[key]!;
    }

    if (fallback !== undefined) {
        return fallback;
    }

    throw new Error(`Configuration key "${key}" not found in Vault bucket "${bucket}" or environment.`);
}

/**
 * Assert that a secret MUST come from Vault in production
 */
export async function assertVaultSecret(bucket: string, key: string): Promise<string> {
    const secrets = await getVaultSecret(bucket);
    if (secrets && secrets[key]) {
        return secrets[key];
    }

    if (process.env.NODE_ENV === 'production') {
        throw new Error(`CRITICAL SECURITY FAILURE: Secret "${key}" missing in Vault bucket "${bucket}".`);
    }

    // Dev fallback
    return process.env[key] || '';
}
