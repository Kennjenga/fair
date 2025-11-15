import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import { createPollSchema, updatePollSchema } from '@/lib/validation/schemas';
import { createPoll, getPollsByAdmin, updatePoll, deletePoll } from '@/lib/repositories/polls';
import { logAudit, getClientIp } from '@/lib/utils/audit';
import type { AuthenticatedRequest } from '@/lib/auth/middleware';

/**
 * @swagger
 * /api/v1/admin/polls:
 *   get:
 *     summary: Get all polls for admin
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of polls
 */
export async function GET(req: NextRequest) {
  return withAdmin(async (req: AuthenticatedRequest) => {
    try {
      const admin = req.admin!;
      
      // Regular admins only see their own polls, super admins see all
      const polls = admin.role === 'super_admin'
        ? await require('@/lib/repositories/polls').getAllPolls()
        : await getPollsByAdmin(admin.adminId);
      
      return NextResponse.json({ polls });
    } catch (error) {
      console.error('Get polls error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * @swagger
 * /api/v1/admin/polls:
 *   post:
 *     summary: Create a new poll
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePollRequest'
 *     responses:
 *       201:
 *         description: Poll created
 */
export async function POST(req: NextRequest) {
  return withAdmin(async (req: AuthenticatedRequest) => {
    try {
      const admin = req.admin!;
      const body = await req.json();
      
      // Validate request
      const validated = createPollSchema.parse(body);
      
      // Create poll
      const poll = await createPoll(
        validated.name,
        new Date(validated.startTime),
        new Date(validated.endTime),
        admin.adminId,
        validated.allowSelfVote,
        validated.requireTeamNameGate,
        validated.isPublicResults
      );
      
      // Log audit
      await logAudit(
        'poll_created',
        admin.adminId,
        poll.poll_id,
        admin.role,
        { pollName: poll.name },
        getClientIp(req.headers)
      );
      
      return NextResponse.json({ poll }, { status: 201 });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Validation failed', details: error },
          { status: 400 }
        );
      }
      
      console.error('Create poll error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}

