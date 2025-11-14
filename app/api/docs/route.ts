import { NextResponse } from 'next/server';
import { swaggerSpec } from '@/lib/swagger';

/**
 * Swagger/OpenAPI JSON endpoint
 * GET /api/docs
 * Returns the OpenAPI specification in JSON format
 */
export async function GET() {
  return NextResponse.json(swaggerSpec);
}


