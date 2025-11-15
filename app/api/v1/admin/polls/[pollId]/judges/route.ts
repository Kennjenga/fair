import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import { createJudgeSchema } from '@/lib/validation/schemas';
import { getPollById } from '@/lib/repositories/polls';
import { addJudgeToPoll, removeJudgeFromPoll, getJudgesByPoll } from '@/lib/repositories/judges';
import { logAudit, getClientIp } from '@/lib/utils/audit';
import type { AuthenticatedRequest } from '@/lib/auth/middleware';

/**
 * @swagger
 * /api/v1/admin/polls/{pollId}/judges:
 *   get:
 *     summary: Get all judges for a poll
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  return withAdmin(async (req: AuthenticatedRequest) => {
    try {
      const admin = req.admin!;
      const { pollId } = await params;
      
      // Check poll exists and access
      const poll = await getPollById(pollId);
      if (!poll) {
        return NextResponse.json(
          { error: 'Poll not found' },
          { status: 404 }
        );
      }
      
      if (admin.role === 'admin' && poll.created_by !== admin.adminId) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
      
      const judges = await getJudgesByPoll(pollId);
      
      return NextResponse.json({ judges });
    } catch (error) {
      console.error('Get judges error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * @swagger
 * /api/v1/admin/polls/{pollId}/judges:
 *   post:
 *     summary: Add a judge to a poll
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  return withAdmin(async (req: AuthenticatedRequest) => {
    try {
      const admin = req.admin!;
      const { pollId } = await params;
      const body = await req.json();
      
      // Check poll exists and access
      const poll = await getPollById(pollId);
      if (!poll) {
        return NextResponse.json(
          { error: 'Poll not found' },
          { status: 404 }
        );
      }
      
      if (admin.role === 'admin' && poll.created_by !== admin.adminId) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
      
      // Validate request
      const validated = createJudgeSchema.parse(body);
      
      // Add judge
      const judge = await addJudgeToPoll(pollId, validated.email, validated.name);
      
      // Log audit
      await logAudit(
        'judge_added',
        admin.adminId,
        pollId,
        admin.role,
        { judgeEmail: validated.email },
        getClientIp(req.headers)
      );
      
      return NextResponse.json({ judge }, { status: 201 });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Validation failed', details: error },
          { status: 400 }
        );
      }
      
      console.error('Add judge error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}

