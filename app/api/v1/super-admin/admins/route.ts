import { NextRequest, NextResponse } from 'next/server';
import { withSuperAdmin } from '@/lib/auth/middleware';
import { createAdminSchema } from '@/lib/validation/schemas';
import { createAdmin, getAllAdmins, updateAdminRole } from '@/lib/repositories/admins';
import { sendAdminCreationEmail } from '@/lib/email/brevo';
import { logAudit, getClientIp } from '@/lib/utils/audit';
import type { AuthenticatedRequest } from '@/lib/auth/middleware';

/**
 * @swagger
 * /api/v1/super-admin/admins:
 *   get:
 *     summary: Get all admins
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 */
export async function GET(req: NextRequest) {
  return withSuperAdmin(async (req: AuthenticatedRequest) => {
    try {
      const admins = await getAllAdmins();

      return NextResponse.json({
        admins: admins.map(a => ({
          adminId: a.admin_id,
          email: a.email,
          role: a.role,
          mfaEnabled: a.mfa_enabled,
          createdAt: a.created_at,
          updatedAt: a.updated_at,
        })),
      });
    } catch (error) {
      console.error('Get admins error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * @swagger
 * /api/v1/super-admin/admins:
 *   post:
 *     summary: Create a new admin
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 */
export async function POST(req: NextRequest) {
  return withSuperAdmin(async (req: AuthenticatedRequest) => {
    try {
      const admin = req.admin!;
      const body = await req.json();

      // Validate request
      const validated = createAdminSchema.parse(body);

      // Check if admin with email already exists
      const { findAdminByEmail } = await import('@/lib/repositories/admins');
      const existing = await findAdminByEmail(validated.email);
      if (existing) {
        return NextResponse.json(
          { error: 'Admin with this email already exists' },
          { status: 400 }
        );
      }

      // Create admin
      const newAdmin = await createAdmin(
        validated.email,
        validated.password,
        validated.role
      );

      // Send email notification with password
      try {
        await sendAdminCreationEmail(
          newAdmin.email,
          validated.password,
          validated.role
        );
      } catch (emailError) {
        // Log email error but don't fail the admin creation
        console.error('Failed to send admin creation email:', emailError);
        // Continue with response - admin is created successfully
      }

      // Log audit
      await logAudit(
        'admin_created',
        admin.adminId,
        null,
        admin.role,
        { newAdminEmail: newAdmin.email, newAdminRole: newAdmin.role },
        getClientIp(req.headers)
      );

      return NextResponse.json(
        {
          admin: {
            adminId: newAdmin.admin_id,
            email: newAdmin.email,
            role: newAdmin.role,
          },
          password: validated.password, // Return password so super admin can see it
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

      console.error('Create admin error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}

