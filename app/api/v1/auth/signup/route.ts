import { NextRequest, NextResponse } from 'next/server';
import { createAdmin } from '@/lib/repositories/admins';
import { createAdminSchema } from '@/lib/validation/schemas';
import { findAdminByEmail } from '@/lib/repositories/admins';
import { sendAdminSignupEmail } from '@/lib/email/brevo';
import { logAudit, getClientIp } from '@/lib/utils/audit';

/**
 * @swagger
 * /api/v1/auth/signup:
 *   post:
 *     summary: Public signup - Create a new admin account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       201:
 *         description: Account created successfully
 *       400:
 *         description: Validation error or email already exists
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request
    const validated = createAdminSchema.parse({
      ...body,
      role: 'admin', // New signups are always regular admins
    });

    // Check if admin with email already exists
    const existing = await findAdminByEmail(validated.email);
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Create admin account
    const newAdmin = await createAdmin(
      validated.email,
      validated.password,
      'admin' // Regular admin role
    );

    // Send welcome email
    try {
      await sendAdminSignupEmail(newAdmin.email);
    } catch (emailError) {
      // Log email error but don't fail the signup
      console.error('Failed to send signup email:', emailError);
      // Continue with response - account is created successfully
    }

    // Log audit
    await logAudit(
      'admin_signup',
      newAdmin.admin_id,
      null,
      'admin',
      { email: newAdmin.email },
      getClientIp(req.headers)
    );

    return NextResponse.json(
      {
        message: 'Account created successfully',
        admin: {
          adminId: newAdmin.admin_id,
          email: newAdmin.email,
          role: newAdmin.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error },
        { status: 400 }
      );
    }

    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


