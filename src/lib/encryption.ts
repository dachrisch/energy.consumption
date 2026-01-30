import CryptoJS from 'crypto-js';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY && process.env.NODE_ENV === 'production') {
    console.warn('WARNING: ENCRYPTION_KEY environment variable is not set in production. Using a fallback key. Database data will be insecure and may become unreadable if the key is changed later.');
}

// Fallback for dev/build to prevent breaking local setup or build process
const KEY = ENCRYPTION_KEY || 'dev-encryption-key-321';

// Derive a 32-byte key for AES-256-GCM using PBKDF2
const derivedKey = crypto.pbkdf2Sync(KEY, 'salt-for-energy-monitor', 100000, 32, 'sha256');

/**
 * Encrypts text using AES-256-GCM (authenticated encryption).
 * Format: IV (12 bytes) + AUTH_TAG (16 bytes) + ENCRYPTED_DATA (Base64)
 */
export function encrypt(text: string): string {
    if (!text) {
        return '';
    }
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    
    // Combine IV, Auth Tag, and Encrypted Data
    return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

/**
 * Decrypts text, supporting both new AES-GCM and old CryptoJS formats.
 */
export function decrypt(ciphertext: string): string {
    if (!ciphertext) {
        return '';
    }
    
    try {
        const data = Buffer.from(ciphertext, 'base64');
        
        // New format check: IV (12) + Tag (16) + at least 1 byte of data
        if (data.length < 29) {
            throw new Error('Too short for AES-GCM');
        }

        const iv = data.subarray(0, 12);
        const tag = data.subarray(12, 28);
        const encrypted = data.subarray(28);
        
        const decipher = crypto.createDecipheriv('aes-256-gcm', derivedKey, iv);
        decipher.setAuthTag(tag);
        
        return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
    } catch (_e) {
        // Fallback to CryptoJS (old format)
        try {
            const bytes = CryptoJS.AES.decrypt(ciphertext, KEY);
            const decrypted = bytes.toString(CryptoJS.enc.Utf8);
            if (!decrypted) {
                return ciphertext;
            }
            return decrypted;
        } catch (_err) {
            return ciphertext;
        }
    }
}
