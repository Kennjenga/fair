import { NextResponse } from 'next/server';
import { externalApiSpec } from '@/lib/swagger-external';

/**
 * GET /api/docs/external
 * Returns the OpenAPI 3.0 specification for the External API.
 * Used by the "Try it" Swagger UI on /docs/external-api/try.
 */
export async function GET() {
  return NextResponse.json(externalApiSpec);
}
