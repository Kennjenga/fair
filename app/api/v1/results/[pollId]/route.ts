import { NextRequest, NextResponse } from 'next/server';
import { getPollById } from '@/lib/repositories/polls';
import { getVotesByPoll } from '@/lib/repositories/votes';
import { getTeamsByPoll } from '@/lib/repositories/teams';
import { calculatePollResults } from '@/lib/utils/results';
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
    
    // Get all votes
    const votes = await getVotesByPoll(pollId);
    
    // Get teams for reference
    const teams = await getTeamsByPoll(pollId);
    
    // Create team name map
    const teamNameMap = new Map(teams.map(t => [t.team_id, t.team_name]));
    
    // Calculate results based on voting mode
    // Pass number of teams for ranked voting point calculation
    const teamResults = calculatePollResults(poll, votes, teams.length);
    
    // Add team names to results and include all fields
    const resultsWithNames = teamResults.map(result => ({
      teamId: result.teamId,
      teamName: teamNameMap.get(result.teamId) || 'Unknown',
      totalScore: result.totalScore,
      voterScore: result.voterPoints,
      judgeScore: result.judgePoints,
      voteCount: result.voterVotes + result.judgeVotes, // Total vote count for single/multiple modes
      rankedPoints: result.totalScore, // For ranked mode
      voterVotes: result.voterVotes,
      judgeVotes: result.judgeVotes,
      positionCounts: result.positionCounts, // Position statistics for ranked voting
    })).sort((a, b) => b.totalScore - a.totalScore);
    
    // Get votes with transaction hashes for blockchain verification
    const votesWithExplorer = votes
      .filter(v => v.tx_hash)
      .map(v => ({
        voteId: v.vote_id,
        voteType: v.vote_type,
        votingMode: poll.voting_mode,
        timestamp: v.timestamp,
        txHash: v.tx_hash,
        explorerUrl: v.tx_hash ? getExplorerUrl(v.tx_hash) : null,
        // Include vote details for reference
        teamIdTarget: v.team_id_target,
        teams: v.teams,
        rankings: v.rankings,
      }));
    
    // Separate voter and judge vote counts
    const voterVotes = votes.filter(v => v.vote_type === 'voter').length;
    const judgeVotes = votes.filter(v => v.vote_type === 'judge').length;
    
    // Check quorum requirements
    const quorumStatus = {
      voterQuorumMet: true,
      judgeQuorumMet: true,
      voterQuorumRequired: poll.min_voter_participation || null,
      judgeQuorumRequired: poll.min_judge_participation || null,
      voterQuorumActual: voterVotes,
      judgeQuorumActual: judgeVotes,
      quorumMet: true,
    };
    
    // Check voter quorum if required
    if (poll.min_voter_participation !== null && poll.min_voter_participation !== undefined) {
      quorumStatus.voterQuorumMet = voterVotes >= poll.min_voter_participation;
      if (!quorumStatus.voterQuorumMet) {
        quorumStatus.quorumMet = false;
      }
    }
    
    // Check judge quorum if required
    if (poll.min_judge_participation !== null && poll.min_judge_participation !== undefined) {
      quorumStatus.judgeQuorumMet = judgeVotes >= poll.min_judge_participation;
      if (!quorumStatus.judgeQuorumMet) {
        quorumStatus.quorumMet = false;
      }
    }
    
    return NextResponse.json({
      poll: {
        pollId: poll.poll_id,
        name: poll.name,
        votingMode: poll.voting_mode,
        votingPermissions: poll.voting_permissions,
        voterWeight: poll.voter_weight,
        judgeWeight: poll.judge_weight,
        startTime: poll.start_time,
        endTime: poll.end_time,
        isPublicResults: poll.is_public_results,
      },
      results: {
        teams: resultsWithNames,
        totalVotes: votes.length,
        voterVotes,
        judgeVotes,
        votes: votesWithExplorer,
        quorumStatus,
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

