import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import { getPollsByHackathon } from '@/lib/repositories/polls';
import { getHackathonById } from '@/lib/repositories/hackathons';
import { canAccessResource } from '@/lib/repositories/admins';
import type { AuthenticatedRequest } from '@/lib/auth/middleware';

/**
 * @swagger
 * /api/v1/admin/hackathons/{hackathonId}/polls:
 *   get:
 *     summary: Get all polls for a hackathon
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
      
      // Check hackathon exists and access (use resolved admin_id so stale session works)
      const hackathon = await getHackathonById(hackathonId);
      if (!hackathon) {
        return NextResponse.json(
          { error: 'Hackathon not found' },
          { status: 404 }
        );
      }

      const allowed = await canAccessResource(admin, hackathon.created_by);
      if (!allowed) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      // Get polls for hackathon
      const polls = await getPollsByHackathon(hackathonId);
      
      return NextResponse.json({ polls });
    } catch (error) {
      console.error('Get hackathon polls error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}

