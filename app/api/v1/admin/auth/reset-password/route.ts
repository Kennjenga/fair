import { NextRequest, NextResponse } from 'next/server';
import { findPasswordResetToken, markTokenAsUsed } from '@/lib/repositories/password-reset';
import { findAdminById, updateAdminPassword } from '@/lib/repositories/admins';
import { hashPassword } from '@/lib/auth/password';
import { logAudit, getClientIp } from '@/lib/utils/audit';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

/**
 * @swagger
 * /api/v1/admin/auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired token
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request
    const validated = resetPasswordSchema.parse(body);
    
    // Find and validate token
    const resetToken = await findPasswordResetToken(validated.token);
    
    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }
    
    // Get admin
    const admin = await findAdminById(resetToken.admin_id);
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }
    
    // Hash new password
    const passwordHash = await hashPassword(validated.password);
    
    // Update password
    await updateAdminPassword(admin.admin_id, passwordHash);
    
    // Mark token as used
    await markTokenAsUsed(resetToken.token_id);
    
    // Log audit
    await logAudit(
      'password_reset_completed',
      admin.admin_id,
      null,
      admin.role,
      { email: admin.email },
      getClientIp(req.headers)
    );
    
    return NextResponse.json({
      message: 'Password has been reset successfully. You can now login with your new password.',
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error },
        { status: 400 }
      );
    }
    
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


