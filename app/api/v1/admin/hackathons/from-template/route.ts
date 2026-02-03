import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { createHackathonFromTemplate } from '@/lib/repositories/hackathons-extended';
import { getEffectiveAdminId } from '@/lib/repositories/admins';

/**
 * POST /api/v1/admin/hackathons/from-template
 * Create a hackathon from a template
 */
export async function POST(request: NextRequest) {
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

    // Resolve admin_id that exists in admins table (fixes FK when session adminId is stale)
    const adminId = await getEffectiveAdminId(payload);
    if (!adminId) {
      return NextResponse.json(
        { error: 'Admin account not found; re-login or contact support' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.templateId || !body.name) {
      return NextResponse.json(
        { error: 'Missing required fields: templateId, name' },
        { status: 400 }
      );
    }

    // Parse dates if provided
    const startDate = body.startDate ? new Date(body.startDate) : undefined;
    const endDate = body.endDate ? new Date(body.endDate) : undefined;
    const submissionDeadline = body.submissionDeadline ? new Date(body.submissionDeadline) : undefined;
    const evaluationDeadline = body.evaluationDeadline ? new Date(body.evaluationDeadline) : undefined;
    const votingClosesAt = body.votingClosesAt ? new Date(body.votingClosesAt) : undefined;

    // Create hackathon from template
    const hackathon = await createHackathonFromTemplate(
      body.templateId,
      body.name,
      adminId,
      body.description,
      startDate,
      endDate,
      submissionDeadline,
      evaluationDeadline,
      body.customConfig,
      votingClosesAt
    );

    return NextResponse.json({ hackathon }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating hackathon from template:', error);
    return NextResponse.json(
      { error: 'Failed to create hackathon', details: error.message },
      { status: 500 }
    );
  }
}
