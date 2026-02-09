import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

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
