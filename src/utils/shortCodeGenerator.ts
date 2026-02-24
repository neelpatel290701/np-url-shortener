// Define custom alphabet for URL-friendly characters (A-Z, a-z, 0-9)
import { customAlphabet } from 'nanoid';

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const nanoidGenerator = customAlphabet(alphabet, 7);

/**
 * Generates a unique short ID using NanoID.
 * @param length - Length of the ID (default 7)
 * @returns - Short ID
 */
export const generateShortCode = (length: number = 7): string => {
    // If length is different from default, we might need to recreate generator or just use default nanoid
    // But for consistency with previous interface:
    if (length === 7) return nanoidGenerator();
    return customAlphabet(alphabet, length)();
};
