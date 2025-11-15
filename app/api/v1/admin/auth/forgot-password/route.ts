import { NextRequest, NextResponse } from 'next/server';
import { findAdminByEmail } from '@/lib/repositories/admins';
import { createPasswordResetToken, invalidateAllTokensForAdmin } from '@/lib/repositories/password-reset';
import { sendPasswordResetEmail } from '@/lib/email/password-reset';
import { logAudit, getClientIp } from '@/lib/utils/audit';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

/**
 * @swagger
 * /api/v1/admin/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent (always returns success for security)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request
    const validated = forgotPasswordSchema.parse(body);
    
    // Find admin by email
    const admin = await findAdminByEmail(validated.email);
    
    // Always return success (don't reveal if email exists)
    // This prevents email enumeration attacks
    if (admin) {
      // Invalidate any existing tokens
      await invalidateAllTokensForAdmin(admin.admin_id);
      
      // Create new reset token
      const { token } = await createPasswordResetToken(admin.admin_id, 1); // 1 hour expiry
      
      // Send reset email
      try {
        await sendPasswordResetEmail(admin.email, token);
        
        // Log audit
        await logAudit(
          'password_reset_requested',
          admin.admin_id,
          null,
          admin.role,
          { email: admin.email },
          getClientIp(req.headers)
        );
      } catch (error) {
        // Log error but don't reveal to user
        console.error('Failed to send password reset email:', error);
      }
    }
    
    // Always return success message
    return NextResponse.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }
    
    console.error('Forgot password error:', error);
    // Still return success to prevent email enumeration
    return NextResponse.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  }
}


