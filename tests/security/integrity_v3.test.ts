import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyImageIntegrity } from '@/lib/security';

// Mock ethers
const isImageHashValidMock = vi.fn();

vi.mock('ethers', () => {
    return {
        ethers: {
            ZeroAddress: '0x0000000000000000000000000000000000000000',
            JsonRpcProvider: vi.fn().mockImplementation(() => ({})),
            Contract: vi.fn().mockImplementation(() => ({
                isImageHashValid: isImageHashValidMock
            }))
        }
    };
});

describe('Sovereign v3 Integrity Verification', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        vi.resetModules();
        process.env = { ...originalEnv };
        process.env.IMAGE_REGISTRY_ADDRESS = '0x1234567890123456789012345678901234567890';
        isImageHashValidMock.mockReset();
    });

    it('should verify image against on-chain registry', async () => {
        isImageHashValidMock.mockResolvedValue(true);

        const result = await verifyImageIntegrity('official-service', 'valid-hash');
        expect(result.valid).toBe(true);
        expect(isImageHashValidMock).toHaveBeenCalledWith('official-service', 'valid-hash');
    });

    it('should reject tampered images found in registry', async () => {
        isImageHashValidMock.mockResolvedValue(false);

        const result = await verifyImageIntegrity('malicious-service', 'tampered-hash');
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('On-chain verification failed');
    });

    it('should fallback to local seed if registry is unreachable', async () => {
        isImageHashValidMock.mockRejectedValue(new Error('RPC Down'));

        // Verify it falls back to OFFICIAL_FINGERPRINTS
        const result = await verifyImageIntegrity('ai-router-service:latest', '7fbbe79b99c280393c9e583cc095b9f8cef29e80cba9574bf06cd702a78e0aba');
        expect(result.valid).toBe(true);
    });

    it('should reject images not in registry and not in local seed', async () => {
        isImageHashValidMock.mockResolvedValue(false); // Registry says invalid

        // This is a "custom" image not in OFFICIAL_FINGERPRINTS
        // Currently the logic allows non-critical images even if they fail registry check?
        // Wait, if registry returns FALSE, security.ts returns valid: false.
        const result = await verifyImageIntegrity('unknown-service', 'any-hash');
        expect(result.valid).toBe(false);
    });
});
