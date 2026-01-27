import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { getSubmissionsByHackathon } from '@/lib/repositories/submissions';

/**
 * GET /api/v1/admin/hackathons/:hackathonId/submissions
 * Get submissions for a hackathon with pagination, search and optional poll filter.
 * Pagination defaults to page=1, pageSize=10 when not provided.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hackathonId: string }> },
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Resolve dynamic route params
    const { hackathonId } = await params;

    // Extract query parameters for pagination and filtering
    const url = new URL(request.url);
    const pageParam = url.searchParams.get('page');
    const pageSizeParam = url.searchParams.get('pageSize');
    const search = url.searchParams.get('search') || undefined;
    const pollId = url.searchParams.get('pollId') || undefined;

    const page = pageParam ? Number.parseInt(pageParam, 10) : 1;
    const pageSize = pageSizeParam ? Number.parseInt(pageSizeParam, 10) : 10;

    const { submissions, total } = await getSubmissionsByHackathon(hackathonId, {
      page,
      pageSize,
      search,
      pollId,
    });

    return NextResponse.json(
      {
        submissions,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions', details: error.message },
      { status: 500 },
    );
  }
}
