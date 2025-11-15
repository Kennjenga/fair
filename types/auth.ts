/**
 * Authentication and authorization type definitions
 */

/**
 * Admin role types
 */
export type AdminRole = 'admin' | 'super_admin';

/**
 * JWT payload structure
 */
export interface JWTPayload {
  adminId: string;
  email: string;
  role: AdminRole;
  iat?: number;
  exp?: number;
}

/**
 * Admin authentication response
 */
export interface AuthResponse {
  token: string;
  admin: {
    adminId: string;
    email: string;
    role: AdminRole;
  };
}

/**
 * Login request
 */
export interface LoginRequest {
  email: string;
  password: string;
}

