import { NextRequest, NextResponse } from 'next/server';
import { getPollById } from '@/lib/repositories/polls';
import { getVoteCountsByPoll, getVotesByPoll } from '@/lib/repositories/votes';
import { getTeamsByPoll } from '@/lib/repositories/teams';
import { getExplorerUrl } from '@/lib/blockchain/avalanche';
import { withAdmin } from '@/lib/auth/middleware';
import type { AuthenticatedRequest } from '@/lib/auth/middleware';

/**
 * @swagger
 * /api/v1/results/{pollId}:
 *   get:
 *     summary: Get poll results
 *     tags: [Results]
 *     parameters:
 *       - in: path
 *         name: pollId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Poll results
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  try {
    const { pollId } = await params;
    
    // Get poll
    const poll = await getPollById(pollId);
    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }
    
    // Check if results are public
    const isPublic = poll.is_public_results;
    
    // Check if user is authenticated admin
    const authHeader = req.headers.get('authorization');
    let hasAccess = isPublic;
    let isAdmin = false;
    let isPollCreator = false;
    let isSuperAdmin = false;
    
    if (authHeader) {
      try {
        // Verify JWT token and get admin info
        const { verifyToken } = await import('@/lib/auth/jwt');
        const token = authHeader.replace('Bearer ', '');
        const decoded = verifyToken(token);
        
        if (decoded) {
          isAdmin = true;
          // Check if super admin or poll creator
          const { findAdminById } = await import('@/lib/repositories/admins');
          const admin = await findAdminById(decoded.adminId);
          
          if (admin) {
            isSuperAdmin = admin.role === 'super_admin';
            isPollCreator = poll.created_by === decoded.adminId;
            // Allow access if super admin or poll creator
            hasAccess = isPublic || isSuperAdmin || isPollCreator;
          }
        }
      } catch (error) {
        // Invalid token, treat as unauthenticated
        console.error('Token verification error:', error);
      }
    }
    
    // If results are not public and user doesn't have access, deny
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Results are not publicly available' },
        { status: 403 }
      );
    }
    
    // Get vote counts
    const voteCounts = await getVoteCountsByPoll(pollId);
    
    // Get all votes with transaction hashes
    const votes = await getVotesByPoll(pollId);
    const votesWithExplorer = votes
      .filter(v => v.tx_hash)
      .map(v => ({
        voteId: v.vote_id,
        teamIdTarget: v.team_id_target,
        timestamp: v.timestamp,
        txHash: v.tx_hash,
        explorerUrl: v.tx_hash ? getExplorerUrl(v.tx_hash) : null,
      }));
    
    // Get teams for reference
    const teams = await getTeamsByPoll(pollId);
    
    return NextResponse.json({
      poll: {
        pollId: poll.poll_id,
        name: poll.name,
        startTime: poll.start_time,
        endTime: poll.end_time,
        isPublicResults: poll.is_public_results,
      },
      results: {
        voteCounts,
        totalVotes: votes.length,
        votes: votesWithExplorer,
        teams: teams.map(t => ({
          teamId: t.team_id,
          teamName: t.team_name,
        })),
      },
    });
  } catch (error) {
    console.error('Get results error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

