import { NextRequest, NextResponse } from 'next/server';
import { withExternalApiKey } from '@/lib/auth/external-api';
import type { ExternalApiRequest } from '@/lib/auth/external-api';
import { getHackathonsByAdmin } from '@/lib/repositories/hackathons';

/**
 * GET /api/external/v1/hackathons
 * List hackathons for the organization (admin that owns the API key).
 * Requires X-API-Key or Authorization: Bearer <key>.
 */
export async function GET(req: NextRequest) {
  return withExternalApiKey(async (request: ExternalApiRequest) => {
    try {
      const { adminId } = request.externalClient;
      const hackathons = await getHackathonsByAdmin(adminId);

      // Return public-safe fields only
      const list = hackathons.map((h) => ({
        hackathon_id: h.hackathon_id,
        name: h.name,
        description: h.description,
        start_date: h.start_date,
        end_date: h.end_date,
        voting_closes_at: h.voting_closes_at,
        created_by: h.created_by,
        created_at: h.created_at,
        updated_at: h.updated_at,
      }));

      return NextResponse.json({ hackathons: list });
    } catch (error) {
      console.error('External API list hackathons error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}
