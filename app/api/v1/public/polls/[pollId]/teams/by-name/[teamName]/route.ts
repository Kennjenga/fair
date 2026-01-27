import { NextRequest, NextResponse } from 'next/server';
import { getPollById } from '@/lib/repositories/polls';
import { getTeamByName } from '@/lib/repositories/teams';

/**
 * GET /api/v1/public/polls/{pollId}/teams/by-name/{teamName}
 * Get team details by team name for a poll (public endpoint for form pre-population)
 * This endpoint allows fetching team details using team name instead of team ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ pollId: string; teamName: string }> }
) {
  try {
    const { pollId, teamName } = await params;
    
    // Decode team name from URL
    const decodedTeamName = decodeURIComponent(teamName);
    
    // Check poll exists
    const poll = await getPollById(pollId);
    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }
    
    // Get team by name
    const team = await getTeamByName(pollId, decodedTeamName);
    
    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }
    
    // Return team details for form pre-population
    return NextResponse.json({
      team: {
        team_id: team.team_id,
        team_name: team.team_name,
        project_name: team.project_name,
        project_description: team.project_description,
        pitch: team.pitch,
        live_site_url: team.live_site_url,
        github_url: team.github_url,
      },
    });
  } catch (error: any) {
    console.error('Error fetching team details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team details', details: error.message },
      { status: 500 }
    );
  }
}
