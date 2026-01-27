import { NextRequest, NextResponse } from 'next/server';
import { getPollsByHackathon } from '@/lib/repositories/polls';

/**
 * GET /api/v1/public/hackathons/:hackathonId/polls
 * Get all polls for a hackathon (public endpoint for submission forms)
 * 
 * This allows the public submission form to fetch available polls
 * when rendering a poll_id select field.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hackathonId: string }> }
) {
  try {
    // Resolve dynamic route params
    const { hackathonId } = await params;
    
    // Get polls for this hackathon (public endpoint, no auth required)
    const polls = await getPollsByHackathon(hackathonId);
    
    // Return only essential poll info for form dropdowns
    const publicPolls = polls.map(poll => ({
      poll_id: poll.poll_id,
      name: poll.name,
      start_time: poll.start_time,
      end_time: poll.end_time,
    }));
    
    return NextResponse.json({ polls: publicPolls }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching public hackathon polls:', error);
    return NextResponse.json(
      { error: 'Failed to fetch polls', details: error.message },
      { status: 500 }
    );
  }
}
