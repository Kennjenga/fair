import { NextRequest, NextResponse } from 'next/server';
import { withExternalApiKey } from '@/lib/auth/external-api';
import type { ExternalApiRequest } from '@/lib/auth/external-api';
import { getHackathonById } from '@/lib/repositories/hackathons';

/**
 * GET /api/external/v1/hackathons/:id
 * Get one hackathon by ID. Only allowed if the hackathon is owned by the API key's admin.
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

      return NextResponse.json({
        hackathon: {
          hackathon_id: hackathon.hackathon_id,
          name: hackathon.name,
          description: hackathon.description,
          start_date: hackathon.start_date,
          end_date: hackathon.end_date,
          voting_closes_at: hackathon.voting_closes_at,
          created_by: hackathon.created_by,
          created_at: hackathon.created_at,
          updated_at: hackathon.updated_at,
        },
      });
    } catch (error) {
      console.error('External API get hackathon error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}
