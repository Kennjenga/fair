import { NextResponse } from 'next/server';
import { withExternalApiKey } from '@/lib/auth/external-api';
import type { ExternalApiRequest } from '@/lib/auth/external-api';
import { handleSubmitVote } from '@/lib/vote/submit-handler';

/**
 * POST /api/external/v1/vote/submit
 * Submit a vote (voter or judge). Same request/response as the public vote submit.
 * Requires X-API-Key or Authorization: Bearer <key>. Usage and rate limits apply.
 */
export async function POST(req: ExternalApiRequest) {
  return withExternalApiKey(async (request: ExternalApiRequest) => {
    return handleSubmitVote(request);
  })(req);
}
