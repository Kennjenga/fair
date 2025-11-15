import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import { updateHackathonSchema } from '@/lib/validation/schemas';
import { getHackathonById, updateHackathon, deleteHackathon } from '@/lib/repositories/hackathons';
import { logAudit, getClientIp } from '@/lib/utils/audit';
import type { AuthenticatedRequest } from '@/lib/auth/middleware';

/**
 * @swagger
 * /api/v1/admin/hackathons/{hackathonId}:
 *   get:
 *     summary: Get hackathon by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ hackathonId: string }> }
) {
  return withAdmin(async (req: AuthenticatedRequest) => {
    try {
      const admin = req.admin!;
      const { hackathonId } = await params;
      
      const hackathon = await getHackathonById(hackathonId);
      
      if (!hackathon) {
        return NextResponse.json(
          { error: 'Hackathon not found' },
          { status: 404 }
        );
      }
      
      // Check access: regular admins can only access their own hackathons
      if (admin.role === 'admin' && hackathon.created_by !== admin.adminId) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
      
      return NextResponse.json({ hackathon });
    } catch (error) {
      console.error('Get hackathon error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * @swagger
 * /api/v1/admin/hackathons/{hackathonId}:
 *   put:
 *     summary: Update hackathon
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ hackathonId: string }> }
) {
  return withAdmin(async (req: AuthenticatedRequest) => {
    try {
      const admin = req.admin!;
      const { hackathonId } = await params;
      const body = await req.json();
      
      // Check hackathon exists and access
      const hackathon = await getHackathonById(hackathonId);
      if (!hackathon) {
        return NextResponse.json(
          { error: 'Hackathon not found' },
          { status: 404 }
        );
      }
      
      if (admin.role === 'admin' && hackathon.created_by !== admin.adminId) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
      
      // Validate request
      const validated = updateHackathonSchema.parse(body);
      
      // Update hackathon
      const updated = await updateHackathon(hackathonId, {
        name: validated.name,
        description: validated.description,
        startDate: validated.startDate ? new Date(validated.startDate) : undefined,
        endDate: validated.endDate ? new Date(validated.endDate) : undefined,
      });
      
      // Log audit
      await logAudit(
        'hackathon_updated',
        admin.adminId,
        null,
        admin.role,
        { hackathonId, hackathonName: updated.name },
        getClientIp(req.headers)
      );
      
      return NextResponse.json({ hackathon: updated });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Validation failed', details: error },
          { status: 400 }
        );
      }
      
      console.error('Update hackathon error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * @swagger
 * /api/v1/admin/hackathons/{hackathonId}:
 *   delete:
 *     summary: Delete hackathon
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ hackathonId: string }> }
) {
  return withAdmin(async (req: AuthenticatedRequest) => {
    try {
      const admin = req.admin!;
      const { hackathonId } = await params;
      
      // Check hackathon exists and access
      const hackathon = await getHackathonById(hackathonId);
      if (!hackathon) {
        return NextResponse.json(
          { error: 'Hackathon not found' },
          { status: 404 }
        );
      }
      
      if (admin.role === 'admin' && hackathon.created_by !== admin.adminId) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
      
      // Delete hackathon
      await deleteHackathon(hackathonId);
      
      // Log audit
      await logAudit(
        'hackathon_deleted',
        admin.adminId,
        null,
        admin.role,
        { hackathonId, hackathonName: hackathon.name },
        getClientIp(req.headers)
      );
      
      return NextResponse.json({ message: 'Hackathon deleted successfully' });
    } catch (error) {
      console.error('Delete hackathon error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}

