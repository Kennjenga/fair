import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import { seedBuiltInTemplatesIfMissing } from '@/lib/repositories/templates';
import type { AuthenticatedRequest } from '@/lib/auth/middleware';

/**
 * POST /api/v1/admin/templates/seed
 * Idempotently seed built-in hackathon templates (Centralized, Community-Led, etc.) into the database.
 * Only inserts templates that do not already exist by governance_model.
 * Use when "Browse Templates" shows no templates so all options (e.g. centralized) appear.
 */
export async function POST(req: AuthenticatedRequest) {
  return withAdmin(async (_req: AuthenticatedRequest) => {
    try {
      const { seeded, skipped } = await seedBuiltInTemplatesIfMissing();
      return NextResponse.json({ seeded, skipped }, { status: 200 });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Templates seed] Error:', message);
      return NextResponse.json(
        { error: 'Failed to seed templates', details: message },
        { status: 500 }
      );
    }
  })(req);
}
