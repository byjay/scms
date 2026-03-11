/**
 * Secure Authentication Utilities using Web Crypto API
 */

export async function hashPassword(password: string): Promise<string> {
    const msgUint8 = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    const newHash = await hashPassword(password);
    return newHash === hash;
}

// In a real production app, we would use salt + PBKDF2/Argon2.
// For Cloudflare Workers / D1, SHA-256 is a significant upgrade over the previous weak checksum.
