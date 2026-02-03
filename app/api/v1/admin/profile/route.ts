import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import { findAdminById, updateAdminProfile } from '@/lib/repositories/admins';
import { updateAdminProfileSchema } from '@/lib/validation/schemas';
import type { AuthenticatedRequest } from '@/lib/auth/middleware';

/**
 * GET /api/v1/admin/profile
 * Returns the current admin's profile (safe fields only).
 */
export async function GET(req: NextRequest) {
  return withAdmin(async (req: AuthenticatedRequest) => {
    try {
      const adminId = req.admin!.adminId;
      const admin = await findAdminById(adminId);
      if (!admin) {
        return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
      }
      return NextResponse.json({
        adminId: admin.admin_id,
        email: admin.email,
        role: admin.role,
        displayName: admin.display_name ?? null,
        phone: admin.phone ?? null,
        organization: admin.organization ?? null,
        accountId: admin.admin_id,
        createdAt: admin.created_at,
        updatedAt: admin.updated_at,
      });
    } catch (error) {
      console.error('Profile GET error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * PATCH /api/v1/admin/profile
 * Updates the current admin's profile (display name, phone, organization).
 */
export async function PATCH(req: NextRequest) {
  return withAdmin(async (req: AuthenticatedRequest) => {
    try {
      const adminId = req.admin!.adminId;
      const body = await req.json();
      const validated = updateAdminProfileSchema.parse(body);

      const updated = await updateAdminProfile(adminId, {
        display_name: validated.displayName,
        phone: validated.phone,
        organization: validated.organization,
      });

      return NextResponse.json({
        adminId: updated.admin_id,
        email: updated.email,
        role: updated.role,
        displayName: updated.display_name ?? null,
        phone: updated.phone ?? null,
        organization: updated.organization ?? null,
        accountId: updated.admin_id,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Validation failed', details: error },
          { status: 400 }
        );
      }
      console.error('Profile PATCH error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}
