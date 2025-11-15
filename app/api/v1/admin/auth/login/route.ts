import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCredentials } from '@/lib/repositories/admins';
import { generateToken } from '@/lib/auth/jwt';
import { loginSchema } from '@/lib/validation/schemas';
import { logAudit, getClientIp } from '@/lib/utils/audit';

/**
 * @swagger
 * /api/v1/admin/auth/login:
 *   post:
 *     summary: Admin login
 *     description: Authenticate an admin and return JWT token
 *     tags: [Admin]
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
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request
    const validated = loginSchema.parse(body);
    
    // Verify credentials
    const admin = await verifyAdminCredentials(validated.email, validated.password);
    
    if (!admin) {
      // Log failed login attempt
      await logAudit(
        'login_failed',
        null,
        null,
        null,
        { email: validated.email },
        getClientIp(req.headers)
      );
      
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Generate JWT token
    const token = generateToken({
      adminId: admin.admin_id,
      email: admin.email,
      role: admin.role,
    });
    
    // Log successful login
    await logAudit(
      'login_success',
      admin.admin_id,
      null,
      admin.role,
      { email: admin.email },
      getClientIp(req.headers)
    );
    
    return NextResponse.json({
      token,
      admin: {
        adminId: admin.admin_id,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error },
        { status: 400 }
      );
    }
    
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

