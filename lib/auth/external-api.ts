import { NextRequest, NextResponse } from 'next/server';
import { findApiKeyByRawKey, touchApiKeyLastUsed } from '@/lib/repositories/api-keys';
import { recordUsage, countUsageInLastMinutes } from '@/lib/repositories/api-usage';
import type { ApiKeyRecord } from '@/lib/repositories/api-keys';

/**
 * External client identity attached to the request after API key validation.
 * Used by external API routes to scope resources to the key's admin.
 */
export interface ExternalClient {
  adminId: string;
  apiKeyId: string;
}

/**
 * Request type for external API handlers: includes resolved client from API key.
 */
export interface ExternalApiRequest extends NextRequest {
  externalClient: ExternalClient;
}

/**
 * Extract API key from request: X-API-Key header or Authorization: Bearer <key>
 */
function extractApiKeyFromRequest(req: NextRequest): string | null {
  const apiKeyHeader = req.headers.get('x-api-key');
  if (apiKeyHeader && typeof apiKeyHeader === 'string' && apiKeyHeader.trim()) {
    return apiKeyHeader.trim();
  }
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    return token || null;
  }
  return null;
}

/**
 * Build endpoint string for usage logging (method + pathname)
 */
function getEndpointFromRequest(req: NextRequest): string {
  try {
    const url = new URL(req.url);
    return `${req.method} ${url.pathname}`;
  } catch {
    return `${req.method} /api/external/v1`;
  }
}

/**
 * Middleware for external API routes: validates API key, enforces rate limit,
 * records usage, and attaches externalClient to the request.
 */
export function withExternalApiKey(
  handler: (req: ExternalApiRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const rawKey = extractApiKeyFromRequest(req);
    if (!rawKey) {
      return NextResponse.json(
        { error: 'Missing API key. Provide X-API-Key header or Authorization: Bearer <key>.' },
        { status: 401 }
      );
    }

    const keyRecord: ApiKeyRecord | null = await findApiKeyByRawKey(rawKey);
    if (!keyRecord) {
      return NextResponse.json(
        { error: 'Invalid or revoked API key' },
        { status: 401 }
      );
    }

    const limit = keyRecord.rate_limit_per_minute ?? 60;
    const count = await countUsageInLastMinutes(keyRecord.api_key_id, 1);
    if (count >= limit) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: 60,
          usage: { limit, current: count },
        },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    const endpoint = getEndpointFromRequest(req);
    await recordUsage(keyRecord.api_key_id, endpoint);
    await touchApiKeyLastUsed(keyRecord.api_key_id).catch(() => {
      // Non-fatal; don't fail the request
    });

    const extReq = req as ExternalApiRequest;
    extReq.externalClient = {
      adminId: keyRecord.admin_id,
      apiKeyId: keyRecord.api_key_id,
    };

    return handler(extReq);
  };
}
