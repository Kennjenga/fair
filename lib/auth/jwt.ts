import jwt, { type SignOptions } from 'jsonwebtoken';
import type { JWTPayload, VoterJWTPayload } from '@/types/auth';

/**
 * JWT secret from environment variables
 * Ensures it's always a string for type safety
 */
const JWT_SECRET: string = process.env.JWT_SECRET || 'default-secret-change-in-production';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Generate a JWT token for an admin
 * @param payload - JWT payload containing admin information
 * @returns Signed JWT token
 */
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Generate a JWT token for a voter (for voter login)
 */
export function generateVoterToken(payload: Omit<VoterJWTPayload, 'iat' | 'exp'>): string {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'],
  };
  return jwt.sign({ ...payload, type: 'voter' as const }, JWT_SECRET, options);
}

/**
 * Verify and decode a JWT token
 * @param token - JWT token to verify
 * @returns Decoded JWT payload
 * @throws Error if token is invalid or expired
 */
export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as JWTPayload;
    return decoded as JWTPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Extract token from Authorization header
 * @param authHeader - Authorization header value (e.g., "Bearer <token>")
 * @returns Token string or null
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

