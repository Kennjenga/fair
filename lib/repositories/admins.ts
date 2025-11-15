import { query, transaction } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import type { AdminRole } from '@/types/auth';
import type { QueryRow } from '@/types/database';

/**
 * Admin database record
 */
export interface AdminRecord extends QueryRow {
  admin_id: string;
  email: string;
  password_hash: string;
  role: AdminRole;
  mfa_enabled: boolean;
  mfa_secret: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Create a new admin
 */
export async function createAdmin(
  email: string,
  password: string,
  role: AdminRole = 'admin'
): Promise<AdminRecord> {
  const passwordHash = await hashPassword(password);
  
  const result = await query<AdminRecord>(
    `INSERT INTO admins (email, password_hash, role)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [email, passwordHash, role]
  );
  
  return result.rows[0];
}

/**
 * Find admin by email
 */
export async function findAdminByEmail(email: string): Promise<AdminRecord | null> {
  const result = await query<AdminRecord>(
    'SELECT * FROM admins WHERE email = $1',
    [email]
  );
  
  return result.rows[0] || null;
}

/**
 * Find admin by ID
 */
export async function findAdminById(adminId: string): Promise<AdminRecord | null> {
  const result = await query<AdminRecord>(
    'SELECT * FROM admins WHERE admin_id = $1',
    [adminId]
  );
  
  return result.rows[0] || null;
}

/**
 * Verify admin credentials
 */
export async function verifyAdminCredentials(
  email: string,
  password: string
): Promise<AdminRecord | null> {
  const admin = await findAdminByEmail(email);
  
  if (!admin) {
    return null;
  }
  
  const isValid = await verifyPassword(password, admin.password_hash);
  
  if (!isValid) {
    return null;
  }
  
  return admin;
}

/**
 * Get all admins (super admin only)
 */
export async function getAllAdmins(): Promise<AdminRecord[]> {
  const result = await query<AdminRecord>(
    'SELECT admin_id, email, role, mfa_enabled, created_at, updated_at FROM admins ORDER BY created_at DESC'
  );
  
  return result.rows;
}

/**
 * Update admin role
 */
export async function updateAdminRole(
  adminId: string,
  role: AdminRole
): Promise<AdminRecord> {
  const result = await query<AdminRecord>(
    `UPDATE admins SET role = $1, updated_at = CURRENT_TIMESTAMP
     WHERE admin_id = $2
     RETURNING admin_id, email, role, mfa_enabled, created_at, updated_at`,
    [role, adminId]
  );
  
  return result.rows[0];
}

/**
 * Update admin password
 */
export async function updateAdminPassword(
  adminId: string,
  passwordHash: string
): Promise<void> {
  await query(
    `UPDATE admins SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
     WHERE admin_id = $2`,
    [passwordHash, adminId]
  );
}

