import crypto from 'crypto';

/**
 * Generate a secure JWT secret
 * This script generates a cryptographically secure random string suitable for JWT signing
 */
function generateJWTSecret(): string {
  // Generate 64 random bytes (512 bits) and convert to base64
  // This provides 256 bits of entropy, which is more than sufficient for JWT secrets
  const secret = crypto.randomBytes(64).toString('base64');
  
  return secret;
}

// Generate and display the secret
const secret = generateJWTSecret();
console.log('\n✓ JWT Secret generated successfully!\n');
console.log('Add this to your .env.local file:');
console.log(`JWT_SECRET=${secret}\n`);
console.log('⚠️  IMPORTANT: Keep this secret secure and never commit it to version control!\n');

