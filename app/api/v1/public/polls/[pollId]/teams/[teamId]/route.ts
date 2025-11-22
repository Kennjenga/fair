import { NextRequest, NextResponse } from 'next/server';
import { getPollById } from '@/lib/repositories/polls';
import { getTeamById } from '@/lib/repositories/teams';
import { getTokensByTeam, findTokenByPlainToken } from '@/lib/repositories/tokens';

/**
 * @swagger
 * /api/v1/public/polls/{pollId}/teams/{teamId}:
 *   get:
 *     summary: Get public team details (requires valid voting token)
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: pollId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Team details
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Invalid or expired token
 *       403:
 *         description: Token does not belong to this team
 *       404:
 *         description: Team not found
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ pollId: string; teamId: string }> }
) {
  try {
    const { pollId, teamId } = await params;
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Validate token
    const tokenRecord = await findTokenByPlainToken(token);
    if (!tokenRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check if token belongs to the requested team
    if (tokenRecord.team_id !== teamId) {
      return NextResponse.json(
        { error: 'You do not have access to view this team' },
        { status: 403 }
      );
    }

    // Check if token belongs to the requested poll
    if (tokenRecord.poll_id !== pollId) {
      return NextResponse.json(
        { error: 'Invalid poll for this token' },
        { status: 403 }
      );
    }

    // Check poll exists
    const poll = await getPollById(pollId);
    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }

    // Check team exists and belongs to poll
    const team = await getTeamById(teamId);
    if (!team || team.poll_id !== pollId) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Get tokens (voters) for this team
    const tokens = await getTokensByTeam(teamId);

    return NextResponse.json({
      team: {
        team_id: team.team_id,
        team_name: team.team_name,
        poll_id: team.poll_id,
        project_name: team.project_name,
        project_description: team.project_description,
        pitch: team.pitch,
        live_site_url: team.live_site_url,
        github_url: team.github_url,
        created_at: team.created_at,
      },
      voters: tokens.map(t => ({
        tokenId: t.token_id,
        email: t.email,
        used: t.used,
        issuedAt: t.issued_at,
      })),
    });
  } catch (error) {
    console.error('Get public team error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

