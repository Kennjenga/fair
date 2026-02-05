/**
 * Authentication and authorization type definitions
 */

/**
 * Admin role types
 */
export type AdminRole = 'admin' | 'super_admin';

/**
 * JWT payload for admin
 */
export interface AdminJWTPayload {
  adminId: string;
  email: string;
  role: AdminRole;
  type?: 'admin';
  iat?: number;
  exp?: number;
}

/**
 * JWT payload for voter (login as voter)
 */
export interface VoterJWTPayload {
  voterId: string;
  email: string;
  type: 'voter';
  iat?: number;
  exp?: number;
}

/**
 * JWT payload structure (admin or voter)
 */
export type JWTPayload = AdminJWTPayload | VoterJWTPayload;

/**
 * Type guard: is payload for admin
 */
export function isAdminPayload(p: JWTPayload): p is AdminJWTPayload {
  return 'adminId' in p && 'role' in p;
}

/**
 * Type guard: is payload for voter
 */
export function isVoterPayload(p: JWTPayload): p is VoterJWTPayload {
  return p.type === 'voter' && 'voterId' in p;
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

