import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import type { AuthenticatedRequest } from '@/lib/auth/middleware';
import { revokeApiKey } from '@/lib/repositories/api-keys';
import { getEffectiveAdminId } from '@/lib/repositories/admins';

/**
 * POST /api/v1/admin/api-keys/:apiKeyId/revoke
 * Revoke an API key (soft delete). Only the key owner can revoke.
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ apiKeyId: string }> }
) {
  return withAdmin(async (request: AuthenticatedRequest) => {
    const adminId = await getEffectiveAdminId({
      adminId: request.admin!.adminId,
      email: request.admin!.email,
    });
    if (!adminId) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 403 });
    }

    const { apiKeyId } = await context.params;
    const revoked = await revokeApiKey(apiKeyId, adminId);

    if (!revoked) {
      return NextResponse.json(
        { error: 'API key not found or already revoked' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  })(req);
}
