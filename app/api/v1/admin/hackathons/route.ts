import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import { createHackathonSchema, updateHackathonSchema } from '@/lib/validation/schemas';
import { createHackathon, getHackathonsByAdmin, getAllHackathons, updateHackathon, deleteHackathon } from '@/lib/repositories/hackathons';
import { logAudit, getClientIp } from '@/lib/utils/audit';
import type { AuthenticatedRequest } from '@/lib/auth/middleware';

/**
 * @swagger
 * /api/v1/admin/hackathons:
 *   get:
 *     summary: Get all hackathons for admin
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of hackathons
 */
export async function GET(req: NextRequest) {
  return withAdmin(async (req: AuthenticatedRequest) => {
    try {
      const admin = req.admin!;
      
      // Regular admins only see their own hackathons, super admins see all
      const hackathons = admin.role === 'super_admin'
        ? await getAllHackathons()
        : await getHackathonsByAdmin(admin.adminId);
      
      return NextResponse.json({ hackathons });
    } catch (error) {
      console.error('Get hackathons error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * @swagger
 * /api/v1/admin/hackathons:
 *   post:
 *     summary: Create a new hackathon
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateHackathonRequest'
 *     responses:
 *       201:
 *         description: Hackathon created
 */
export async function POST(req: NextRequest) {
  return withAdmin(async (req: AuthenticatedRequest) => {
    try {
      const admin = req.admin!;
      const body = await req.json();
      
      // Validate request
      const validated = createHackathonSchema.parse(body);
      
      // Create hackathon
      const hackathon = await createHackathon(
        validated.name,
        admin.adminId,
        validated.description,
        validated.startDate ? new Date(validated.startDate) : undefined,
        validated.endDate ? new Date(validated.endDate) : undefined,
        validated.votingClosesAt ? new Date(validated.votingClosesAt) : undefined
      );
      
      // Log audit
      await logAudit(
        'hackathon_created',
        admin.adminId,
        null,
        admin.role,
        { hackathonName: hackathon.name },
        getClientIp(req.headers)
      );
      
      return NextResponse.json({ hackathon }, { status: 201 });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Validation failed', details: error },
          { status: 400 }
        );
      }
      
      console.error('Create hackathon error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}

