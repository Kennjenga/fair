import { query } from '@/lib/db';
import type { AdminRole } from '@/types/auth';

/**
 * Log an action to the audit log
 * @param action - Action name (e.g., 'poll_created', 'vote_submitted')
 * @param userId - Admin ID who performed the action
 * @param pollId - Poll ID (if applicable)
 * @param role - Admin role
 * @param details - Additional details as JSON object
 * @param ipAddress - IP address of the requester
 */
export async function logAudit(
  action: string,
  userId: string | null,
  pollId: string | null,
  role: AdminRole | null,
  details: Record<string, unknown> | null = null,
  ipAddress: string | null = null
): Promise<void> {
  try {
    await query(
      `INSERT INTO audit_logs (action, user_id, poll_id, role, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        action,
        userId,
        pollId,
        role,
        details ? JSON.stringify(details) : null,
        ipAddress,
      ]
    );
  } catch (error) {
    // Don't throw - audit logging should not break the main flow
    console.error('Failed to log audit:', error);
  }
}

/**
 * Get client IP address from request
 * @param headers - Request headers
 * @returns IP address string
 */
export function getClientIp(headers: Headers): string | null {
  // Check various headers for IP address
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  return null;
}

