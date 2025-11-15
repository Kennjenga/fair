import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from './jwt';
import type { AdminRole } from '@/types/auth';

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

