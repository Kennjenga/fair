import { NextRequest, NextResponse } from 'next/server';
import { getHackathonWithTemplate } from '@/lib/repositories/hackathons-extended';

/**
 * GET /api/v1/public/hackathons/:id
 * Get public hackathon details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hackathonId: string }> }
) {
  try {
    // Resolve dynamic route params
    const { hackathonId } = await params;
    const hackathon = await getHackathonWithTemplate(hackathonId);

    if (!hackathon) {
      return NextResponse.json({ error: 'Hackathon not found' }, { status: 404 });
    }

    // Only return public information
    const publicHackathon = {
      hackathon_id: hackathon.hackathon_id,
      name: hackathon.name,
      description: hackathon.description,
      start_date: hackathon.start_date,
      end_date: hackathon.end_date,
      submission_deadline: hackathon.submission_deadline,
      status: hackathon.status,
      template_name: hackathon.template_name,
      governance_model: hackathon.governance_model,
    };

    return NextResponse.json({ hackathon: publicHackathon }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching public hackathon:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hackathon', details: error.message },
      { status: 500 }
    );
  }
}
