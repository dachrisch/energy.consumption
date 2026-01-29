import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY && process.env.NODE_ENV === 'production') {
    throw new Error('CRITICAL: ENCRYPTION_KEY environment variable is required in production.');
}

// Fallback for dev only to prevent breaking local setup
const KEY = ENCRYPTION_KEY || 'dev-encryption-key-321';

export function encrypt(text: string): string {
    if (!text) return '';
    return CryptoJS.AES.encrypt(text, KEY).toString();
}

export function decrypt(ciphertext: string): string {
    if (!ciphertext) return '';
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, KEY);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        if (!decrypted) {
            // If decryption results in empty string, it might be that the text was not encrypted or key changed
            return ciphertext;
        }
        return decrypted;
    } catch (e) {
        // Fallback to original text if decryption fails (e.g. for already existing plaintext keys)
        return ciphertext;
    }
}
