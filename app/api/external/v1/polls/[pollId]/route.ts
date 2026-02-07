import { NextRequest, NextResponse } from 'next/server';
import { withExternalApiKey } from '@/lib/auth/external-api';
import type { ExternalApiRequest } from '@/lib/auth/external-api';
import { getPollById } from '@/lib/repositories/polls';
import { getHackathonById } from '@/lib/repositories/hackathons';

/**
 * Check if the API key's admin has access to this poll (created poll or owns hackathon).
 */
async function canAccessPoll(adminId: string, pollId: string): Promise<boolean> {
  const poll = await getPollById(pollId);
  if (!poll) return false;
  if (poll.created_by === adminId) return true;
  if (poll.hackathon_id) {
    const hackathon = await getHackathonById(poll.hackathon_id);
    if (hackathon && hackathon.created_by === adminId) return true;
  }
  return false;
}

/**
 * GET /api/external/v1/polls/:id
 * Get poll details. Only allowed if the poll is owned by the API key's admin (or their hackathon).
 * Requires X-API-Key or Authorization: Bearer <key>.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ pollId: string }> }
) {
  return withExternalApiKey(async (request: ExternalApiRequest) => {
    try {
      const { adminId } = request.externalClient;
      const { pollId } = await context.params;

      const poll = await getPollById(pollId);
      if (!poll) {
        return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
      }

      const allowed = await canAccessPoll(adminId, pollId);
      if (!allowed) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      return NextResponse.json({
        poll: {
          poll_id: poll.poll_id,
          hackathon_id: poll.hackathon_id,
          name: poll.name,
          start_time: poll.start_time,
          end_time: poll.end_time,
          voting_mode: poll.voting_mode,
          voting_permissions: poll.voting_permissions,
          voter_weight: poll.voter_weight,
          judge_weight: poll.judge_weight,
          is_public_results: poll.is_public_results,
          allow_self_vote: poll.allow_self_vote,
          created_at: poll.created_at,
        },
      });
    } catch (error) {
      console.error('External API get poll error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}
