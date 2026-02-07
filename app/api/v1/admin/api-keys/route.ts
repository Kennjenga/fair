import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import type { AuthenticatedRequest } from '@/lib/auth/middleware';
import { listApiKeysByAdmin, createApiKey } from '@/lib/repositories/api-keys';
import { getEffectiveAdminId } from '@/lib/repositories/admins';
import { z } from 'zod';

/** Request body for creating an API key */
const createApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  rateLimitPerMinute: z.number().int().min(1).max(10000).optional().default(60),
});

/**
 * GET /api/v1/admin/api-keys
 * List API keys for the current admin (no raw keys or hashes returned)
 */
export async function GET(req: AuthenticatedRequest) {
  return withAdmin(async (request: AuthenticatedRequest) => {
    const adminId = await getEffectiveAdminId({
      adminId: request.admin!.adminId,
      email: request.admin!.email,
    });
    if (!adminId) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 403 });
    }

    const keys = await listApiKeysByAdmin(adminId);
    return NextResponse.json({ keys });
  })(req);
}

/**
 * POST /api/v1/admin/api-keys
 * Create a new API key. Returns the raw key once; caller must show it to the user (it is not stored).
 */
export async function POST(req: AuthenticatedRequest) {
  return withAdmin(async (request: AuthenticatedRequest) => {
    const adminId = await getEffectiveAdminId({
      adminId: request.admin!.adminId,
      email: request.admin!.email,
    });
    if (!adminId) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = createApiKeySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, rateLimitPerMinute } = parsed.data;
    const { record, rawKey } = await createApiKey(adminId, name, rateLimitPerMinute);

    // Return record without key_hash, plus rawKey (show once in UI)
    const { key_hash: _hash, ...recordSafe } = record as { key_hash: string; [k: string]: unknown };
    return NextResponse.json({
      key: {
        ...recordSafe,
        rawKey, // Only in create response; never stored or returned again
      },
    });
  })(req);
}
