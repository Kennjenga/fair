import { NextRequest, NextResponse } from 'next/server';
import { withExternalApiKey } from '@/lib/auth/external-api';
import type { ExternalApiRequest } from '@/lib/auth/external-api';
import { getHackathonById } from '@/lib/repositories/hackathons';
import { getPollsByHackathon } from '@/lib/repositories/polls';

/**
 * GET /api/external/v1/hackathons/:hackathonId/polls
 * List polls for a hackathon. Only allowed if the hackathon is owned by the API key's admin.
 * Requires X-API-Key or Authorization: Bearer <key>.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ hackathonId: string }> }
) {
  return withExternalApiKey(async (request: ExternalApiRequest) => {
    try {
      const { adminId } = request.externalClient;
      const { hackathonId } = await context.params;

      const hackathon = await getHackathonById(hackathonId);
      if (!hackathon) {
        return NextResponse.json({ error: 'Hackathon not found' }, { status: 404 });
      }

      if (hackathon.created_by !== adminId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      const polls = await getPollsByHackathon(hackathonId);

      const list = polls.map((p) => ({
        poll_id: p.poll_id,
        hackathon_id: p.hackathon_id,
        name: p.name,
        start_time: p.start_time,
        end_time: p.end_time,
        voting_mode: p.voting_mode,
        voting_permissions: p.voting_permissions,
        is_public_results: p.is_public_results,
        created_at: p.created_at,
      }));

      return NextResponse.json({ polls: list });
    } catch (error) {
      console.error('External API list hackathon polls error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}
