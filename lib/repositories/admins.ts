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
  /** Optional display name for profile */
  display_name: string | null;
  /** Optional phone number */
  phone: string | null;
  /** Optional organization name */
  organization: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Profile fields that can be updated by the admin
 */
export interface AdminProfileUpdate {
  display_name?: string | null;
  phone?: string | null;
  organization?: string | null;
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
 * Resolve the effective admin_id for the current session (JWT payload).
 * Uses session adminId if it exists in admins; otherwise falls back to lookup by email.
 * Use this for created_by, access checks, and listing "my" resources when session adminId may be stale.
 */
export async function getEffectiveAdminId(payload: { adminId: string; email?: string }): Promise<string | null> {
  const byId = await findAdminById(payload.adminId);
  if (byId) return byId.admin_id;
  if (payload.email) {
    const byEmail = await findAdminByEmail(payload.email);
    if (byEmail) return byEmail.admin_id;
  }
  return null;
}

/**
 * Check if the current admin can access a resource owned by createdBy (e.g. hackathon).
 * Super admins can access any; regular admins only if createdBy matches their effective admin_id.
 */
export async function canAccessResource(
  admin: { adminId: string; email: string; role: AdminRole },
  createdBy: string
): Promise<boolean> {
  if (admin.role === 'super_admin') return true;
  const effectiveId = await getEffectiveAdminId({ adminId: admin.adminId, email: admin.email });
  return createdBy === effectiveId || createdBy === admin.adminId;
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
    `SELECT admin_id, email, role, mfa_enabled, display_name, phone, organization, created_at, updated_at
     FROM admins ORDER BY created_at DESC`
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

/**
 * Update admin profile (display name, phone, organization).
 * Only updates fields that are provided (not undefined).
 */
export async function updateAdminProfile(
  adminId: string,
  data: AdminProfileUpdate
): Promise<AdminRecord> {
  const updates: string[] = [];
  const values: (string | null)[] = [];
  let paramIndex = 1;

  if (data.display_name !== undefined) {
    updates.push(`display_name = $${paramIndex++}`);
    values.push(data.display_name ?? null);
  }
  if (data.phone !== undefined) {
    updates.push(`phone = $${paramIndex++}`);
    values.push(data.phone ?? null);
  }
  if (data.organization !== undefined) {
    updates.push(`organization = $${paramIndex++}`);
    values.push(data.organization ?? null);
  }

  if (updates.length === 0) {
    const admin = await findAdminById(adminId);
    if (!admin) throw new Error('Admin not found');
    return admin;
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(adminId);  const result = await query<AdminRecord>(
    `UPDATE admins SET ${updates.join(', ')}
     WHERE admin_id = $${paramIndex}
     RETURNING *`,
    values
  );  return result.rows[0];
}
