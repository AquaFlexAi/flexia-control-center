import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import { ethers } from 'ethers';

const scryptAsync = promisify(scrypt);

// In a real app, this should be a strong environment variable
const MASTER_KEY_SECRET = process.env.ENCRYPTION_KEY || 'flexia-control-center-master-key-change-me';
const ALGORITHM = 'aes-256-gcm';

export class EncryptionService {
    private static key: Buffer;

    private static async getKey(): Promise<Buffer> {
        if (!this.key) {
            // Derive a 32-byte key from the master secret using a fixed salt (or handle salt storage)
            // For simplicity in this iteration, we use a fixed salt. In prod, store salt with data.
            this.key = (await scryptAsync(MASTER_KEY_SECRET, 'salt', 32)) as Buffer;
        }
        return this.key;
    }

    static async encrypt(text: string): Promise<string> {
        const key = await this.getKey();
        const iv = randomBytes(16);
        const cipher = createCipheriv(ALGORITHM, key, iv);

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        // Format: iv:authTag:encrypted
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    }

    static async decrypt(encryptedText: string): Promise<string> {
        const [ivHex, authTagHex, encryptedHex] = encryptedText.split(':');
        if (!ivHex || !authTagHex || !encryptedHex) {
            throw new Error('Invalid encrypted format');
        }

        const key = await this.getKey();
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');

        const decipher = createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }

    static async encryptObject(obj: any): Promise<any> {
        const json = JSON.stringify(obj);
        return this.encrypt(json);
    }

    static async decryptObject<T>(encryptedText: string): Promise<T> {
        const json = await this.decrypt(encryptedText);
        return JSON.parse(json);
    }
}

// --- Image Fingerprinting & Integrity ---

const BLOCKCHAIN_RPC_URL = process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545';

// Minimal ABI for the Image Registry
const REGISTRY_ABI = [
    "function isImageHashValid(string image, string hash) external view returns (bool)"
];

// Simple in-memory cache to prevent redundant RPC calls
// Key: image:hash, Value: { valid: boolean, timestamp: number }
const integrityCache: Record<string, { valid: boolean, timestamp: number }> = {};
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Official fingerprints for critical images (Bootstrap / Fallback Seed)
const OFFICIAL_FINGERPRINTS: Record<string, string[]> = {
    'ai-router-service:latest': [
        '7fbbe79b99c280393c9e583cc095b9f8cef29e80cba9574bf06cd702a78e0aba',
    ],
    'flexia-blockchain:latest': [
        '88b31fdca533e0b330adf657f6f9f7da7ff774c70de7f440b475638f6e69d242'
    ]
};

/**
 * Verifies if an image is "official" and untampered (Sovereign v3 - On-Chain)
 * @param image The image name (e.g. flexia-ai-router:latest)
 * @param imageId The actual Docker Image ID (sha256:...)
 */
export async function verifyImageIntegrity(image: string, imageId: string): Promise<{ valid: boolean; reason?: string }> {
    const normalizedId = imageId.startsWith('sha256:') ? imageId.substring(7) : imageId;

    // 1. Check Local Cache
    const cacheKey = `${image}:${normalizedId}`;
    const cached = integrityCache[cacheKey];
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        if (cached.valid) return { valid: true };
    }

    // 2. Try On-Chain Registry (Decentralized Truth)
    const registryAddress = process.env.IMAGE_REGISTRY_ADDRESS;
    if (registryAddress && registryAddress !== ethers.ZeroAddress) {
        try {
            const provider = new ethers.JsonRpcProvider(BLOCKCHAIN_RPC_URL);
            const contract = new ethers.Contract(registryAddress, REGISTRY_ABI, provider);

            const isValidOnChain = await contract.isImageHashValid(image, normalizedId);

            // Update Cache
            integrityCache[cacheKey] = { valid: isValidOnChain, timestamp: Date.now() };

            if (isValidOnChain) return { valid: true };

            // If it exists in registry and is false, it's a hard FAIL (revoked)
            return {
                valid: false,
                reason: `On-chain verification failed for ${image}. Hash ${normalizedId.substring(0, 12)} is not registered or was revoked by the DAO.`
            };
        } catch (error: any) {
            console.warn(`[Security] On-chain registry unreachable: ${error.message}. Falling back to local seed.`);
        }
    }

    // 3. Fallback to Local Bootstrap Seed (Safety Anchor)
    const expectedHashes = OFFICIAL_FINGERPRINTS[image];
    if (!expectedHashes) {
        return { valid: true }; // Not a critical/official image
    }

    const isMatch = expectedHashes.some(hash =>
        normalizedId.startsWith(hash) || hash.startsWith(normalizedId)
    );

    if (!isMatch) {
        return {
            valid: false,
            reason: `Fingerprint mismatch for ${image}. Expected [${expectedHashes[0].substring(0, 12)}...], but got ${normalizedId.substring(0, 12)}... Potential fraud detected.`
        };
    }

    return { valid: true };
}

/**
 * Fetches the Image ID for a local image using shell exec
 */
export function getImageId(image: string): string | null {
    const { execSync } = require('child_process');
    try {
        const output = execSync(`docker inspect --format="{{.Id}}" ${image}`).toString().trim();
        return output;
    } catch (error) {
        console.error(`[Security] Failed to get Image ID for ${image}:`, error);
        return null;
    }
}
