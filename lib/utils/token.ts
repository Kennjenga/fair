import crypto from 'crypto';

/**
 * Generate a secure random token for voting
 * @param length - Token length in bytes (default: 32)
 * @returns Base64-encoded token string
 */
export function generateSecureToken(length: number = 32): string {
  const bytes = crypto.randomBytes(length);
  return bytes.toString('base64url');
}

/**
 * Create a hash from a token for storage/verification
 * @param token - Plain token
 * @returns SHA-256 hash of the token
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Verify a token against a hash
 * @param token - Plain token to verify
 * @param hash - Stored hash to compare against
 * @returns True if token matches hash
 */
export function verifyTokenHash(token: string, hash: string): boolean {
  const computedHash = hashToken(token);
  return crypto.timingSafeEqual(
    Buffer.from(computedHash),
    Buffer.from(hash)
  );
}

