
import vault from 'node-vault';

// Initialize Vault client
const client = vault({
    apiVersion: 'v1',
    endpoint: process.env.VAULT_ADDR || 'http://127.0.0.1:8200',
    token: process.env.VAULT_TOKEN,
});

export class VaultService {
    private static instance: VaultService;
    private initialized = false;

    private constructor() { }

    public static getInstance(): VaultService {
        if (!VaultService.instance) {
            VaultService.instance = new VaultService();
        }
        return VaultService.instance;
    }

    /**
     * Reads a secret from Vault
     * @param path Path to the secret (e.g., 'secret/data/my-secret')
     */
    async getSecret(path: string): Promise<any> {
        try {
            const result = await client.read(path);
            return result.data.data; // Vault KV v2 structure
        } catch (error: any) {
            // console.error(`[Vault] Error reading secret at ${path}:`, error.message);
            // throw error;
            return null; // Return null on failure to allow fallback
        }
    }

    /**
     * Writes a secret to Vault
     * @param path Path to the secret
     * @param data Key-value pairs to store
     */
    async writeSecret(path: string, data: any): Promise<void> {
        try {
            await client.write(path, { data });
        } catch (error: any) {
            console.error(`[Vault] Error writing secret to ${path}:`, error.message);
            throw error;
        }
    }

    /**
     * Checks if Vault is sealed
     */
    async isSealed(): Promise<boolean> {
        try {
            const status = await client.status();
            return status.sealed;
        } catch (error: any) {
            console.error('[Vault] Error checking status:', error.message);
            return true; // Assume sealed/down on error
        }
    }
}

export const vaultService = VaultService.getInstance();

/**
 * Helper to get a config value from Vault or return a default
 * @param category The category (e.g., 'deployments-core')
 * @param key The specific key (e.g., 'registry')
 * @param defaultValue Fallback value if Vault is unreachable or key is missing
 */
export async function getConfigValue(category: string, key: string, defaultValue: string): Promise<string> {
    try {
        const secretPath = `secret/data/${category}`;
        const secret = await vaultService.getSecret(secretPath);

        if (secret && secret[key]) {
            return secret[key];
        }
    } catch (err) {
        // Silent failure, fallback
    }
    return defaultValue;
}
