import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY && process.env.NODE_ENV === 'production') {
    console.warn('WARNING: ENCRYPTION_KEY environment variable is not set in production. Using a fallback key. Database data will be insecure and may become unreadable if the key is changed later.');
}

// Fallback for dev/build to prevent breaking local setup or build process
const KEY = ENCRYPTION_KEY || 'dev-encryption-key-321';

export function encrypt(text: string): string {
    if (!text) {
        return '';
    }
    return CryptoJS.AES.encrypt(text, KEY).toString();
}

export function decrypt(ciphertext: string): string {
    if (!ciphertext) {
        return '';
    }
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
