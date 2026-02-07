import { NextResponse } from 'next/server';
import { withExternalApiKey } from '@/lib/auth/external-api';
import type { ExternalApiRequest } from '@/lib/auth/external-api';
import { handleValidateVote } from '@/lib/vote/validate-handler';

/**
 * POST /api/external/v1/vote/validate
 * Validate a voting token and get available teams. Same request/response as the public vote validate.
 * Requires X-API-Key or Authorization: Bearer <key>. Usage and rate limits apply.
 */
export async function POST(req: ExternalApiRequest) {
  return withExternalApiKey(async (request: ExternalApiRequest) => {
    return handleValidateVote(request);
  })(req);
}
