import crypto from 'crypto';

/**
 * Get encryption key for token encryption
 * Uses JWT_SECRET or a default key (for development only)
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.JWT_SECRET || process.env.ENCRYPTION_KEY || 'default-secret-key-change-in-production';
  // Use first 32 bytes of SHA-256 hash of secret as key
  return crypto.createHash('sha256').update(secret).digest().slice(0, 32);
}

/**
 * Encrypt a plain token for storage
 * @param plainToken - Plain token to encrypt
 * @returns Encrypted token (base64 encoded)
 */
export function encryptPlainToken(plainToken: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  let encrypted = cipher.update(plainToken, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  // Prepend IV to encrypted data
  return iv.toString('base64') + ':' + encrypted;
}

/**
 * Decrypt a stored plain token
 * @param encryptedToken - Encrypted token (base64 encoded with IV)
 * @returns Decrypted plain token
 */
export function decryptPlainToken(encryptedToken: string): string {
  const key = getEncryptionKey();
  const [ivBase64, encrypted] = encryptedToken.split(':');
  
  if (!ivBase64 || !encrypted) {
    throw new Error('Invalid encrypted token format');
  }
  
  const iv = Buffer.from(ivBase64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  
  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

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

