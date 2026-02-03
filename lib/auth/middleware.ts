import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from './jwt';
import type { AdminRole } from '@/types/auth';
import { isAdminPayload, isVoterPayload } from '@/types/auth';

/**
 * Extended request with admin information
 */
export interface AuthenticatedRequest extends NextRequest {
  admin?: {
    adminId: string;
    email: string;
    role: AdminRole;
  };
}

/**
 * Extended request with voter information (for voter-only routes)
 */
export interface VoterAuthenticatedRequest extends NextRequest {
  voter?: {
    voterId: string;
    email: string;
  };
}

/**
 * Authentication middleware for API routes
 * Verifies JWT token and attaches admin info to request
 */
export function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  options?: {
    roles?: AdminRole[];
  }
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.get('authorization');
      const token = extractTokenFromHeader(authHeader);

      if (!token) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Verify token
      const payload = verifyToken(token);

      // Only admin payloads are allowed for withAuth
      if (!isAdminPayload(payload)) {
        return NextResponse.json(
          { error: 'Invalid token (admin required)' },
          { status: 403 }
        );
      }

      // Check role if specified
      if (options?.roles && !options.roles.includes(payload.role)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      // Attach admin info to request
      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.admin = {
        adminId: payload.adminId,
        email: payload.email,
        role: payload.role,
      };

      return handler(authenticatedReq);
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json(
          { error: error.message },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
  };
}

/**
 * Middleware to ensure user is a super admin
 */
export function withSuperAdmin(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(handler, { roles: ['super_admin'] });
}

/**
 * Middleware to ensure user is an admin (regular or super)
 */
export function withAdmin(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(handler, { roles: ['admin', 'super_admin'] });
}

/**
 * Middleware for voter-only routes.
 * Verifies JWT and ensures payload is voter (type === 'voter').
 */
export function withVoter(
  handler: (req: VoterAuthenticatedRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const authHeader = req.headers.get('authorization');
      const token = extractTokenFromHeader(authHeader);
      if (!token) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      const payload = verifyToken(token);
      if (!isVoterPayload(payload)) {
        return NextResponse.json(
          { error: 'Invalid token (voter login required)' },
          { status: 403 }
        );
      }
      const voterReq = req as VoterAuthenticatedRequest;
      voterReq.voter = { voterId: payload.voterId, email: payload.email };
      return handler(voterReq);
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
  };
}

