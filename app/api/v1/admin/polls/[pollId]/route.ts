import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import { updatePollSchema } from '@/lib/validation/schemas';
import { getPollById, updatePoll, deletePoll } from '@/lib/repositories/polls';
import { logAudit, getClientIp } from '@/lib/utils/audit';
import type { AuthenticatedRequest } from '@/lib/auth/middleware';

/**
 * @swagger
 * /api/v1/admin/polls/{pollId}:
 *   get:
 *     summary: Get poll by ID
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
      
      const poll = await getPollById(pollId);
      
      if (!poll) {
        return NextResponse.json(
          { error: 'Poll not found' },
          { status: 404 }
        );
      }
      
      // Check access: regular admins can only access their own polls
      if (admin.role === 'admin' && poll.created_by !== admin.adminId) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
      
      return NextResponse.json({ poll });
    } catch (error) {
      console.error('Get poll error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * @swagger
 * /api/v1/admin/polls/{pollId}:
 *   patch:
 *     summary: Update poll
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  return withAdmin(async (req: AuthenticatedRequest) => {
    try {
      const admin = req.admin!;
      const { pollId } = await params;
      const body = await req.json();
      
      // Check poll exists and access
      const existingPoll = await getPollById(pollId);
      if (!existingPoll) {
        return NextResponse.json(
          { error: 'Poll not found' },
          { status: 404 }
        );
      }
      
      if (admin.role === 'admin' && existingPoll.created_by !== admin.adminId) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
      
      // Validate request
      const validated = updatePollSchema.parse(body);
      
      // Prepare updates
      const updates: {
        name?: string;
        startTime?: Date;
        endTime?: Date;
        votingMode?: 'single' | 'multiple' | 'ranked';
        votingPermissions?: 'voters_only' | 'judges_only' | 'voters_and_judges';
        voterWeight?: number;
        judgeWeight?: number;
        rankPointsConfig?: Record<string, number>;
        allowSelfVote?: boolean;
        requireTeamNameGate?: boolean;
        isPublicResults?: boolean;
      } = {};
      
      if (validated.name) updates.name = validated.name;
      if (validated.startTime) updates.startTime = new Date(validated.startTime);
      
      // Allow extending poll duration even after end time has passed
      if (validated.endTime) {
        const newEndTime = new Date(validated.endTime);
        // If updating end time, ensure it's after start time (use existing or new start time)
        const startTime = validated.startTime ? new Date(validated.startTime) : existingPoll.start_time;
        if (newEndTime <= startTime) {
          return NextResponse.json(
            { error: 'End time must be after start time' },
            { status: 400 }
          );
        }
        updates.endTime = newEndTime;
      }
      
      if (validated.votingMode) updates.votingMode = validated.votingMode;
      if (validated.votingPermissions) updates.votingPermissions = validated.votingPermissions;
      if (validated.voterWeight !== undefined) updates.voterWeight = validated.voterWeight;
      if (validated.judgeWeight !== undefined) updates.judgeWeight = validated.judgeWeight;
      if (validated.rankPointsConfig) updates.rankPointsConfig = validated.rankPointsConfig;
      if (validated.allowSelfVote !== undefined) updates.allowSelfVote = validated.allowSelfVote;
      if (validated.requireTeamNameGate !== undefined) updates.requireTeamNameGate = validated.requireTeamNameGate;
      if (validated.isPublicResults !== undefined) updates.isPublicResults = validated.isPublicResults;
      
      // Update poll (allows extending duration after poll has ended)
      const poll = await updatePoll(pollId, updates);
      
      // Log audit
      await logAudit(
        'poll_updated',
        admin.adminId,
        pollId,
        admin.role,
        { updates },
        getClientIp(req.headers)
      );
      
      return NextResponse.json({ poll });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Validation failed', details: error },
          { status: 400 }
        );
      }
      
      console.error('Update poll error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * @swagger
 * /api/v1/admin/polls/{pollId}:
 *   delete:
 *     summary: Delete poll
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  return withAdmin(async (req: AuthenticatedRequest) => {
    try {
      const admin = req.admin!;
      const { pollId } = await params;
      
      // Check poll exists and access
      const existingPoll = await getPollById(pollId);
      if (!existingPoll) {
        return NextResponse.json(
          { error: 'Poll not found' },
          { status: 404 }
        );
      }
      
      if (admin.role === 'admin' && existingPoll.created_by !== admin.adminId) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
      
      // Delete poll
      await deletePoll(pollId);
      
      // Log audit
      await logAudit(
        'poll_deleted',
        admin.adminId,
        pollId,
        admin.role,
        { pollName: existingPoll.name },
        getClientIp(req.headers)
      );
      
      return NextResponse.json({ message: 'Poll deleted successfully' });
    } catch (error) {
      console.error('Delete poll error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}

