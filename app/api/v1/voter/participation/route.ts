import { NextResponse } from 'next/server';
import { withVoter } from '@/lib/auth/middleware';
import { getTokensByEmail } from '@/lib/repositories/tokens';
import { getVoteByTokenHash } from '@/lib/repositories/votes';
import { getUserParticipation } from '@/lib/repositories/participation';
import { getPollById } from '@/lib/repositories/polls';
import { getHackathonById } from '@/lib/repositories/hackathons';
import { getTeamById } from '@/lib/repositories/teams';
import { getExplorerUrl } from '@/lib/blockchain/avalanche';
import type { VoterAuthenticatedRequest } from '@/lib/auth/middleware';

/**
 * GET /api/v1/voter/participation
 * Returns the logged-in voter's participations (hackathons) and voting activity with blockchain links.
 */
export async function GET(req: VoterAuthenticatedRequest) {
  return withVoter(async (req: VoterAuthenticatedRequest) => {
    try {
      const voter = req.voter!;
      const email = voter.email;

      // Participations (hackathons where user participated - e.g. submitted form)
      const participationRecords = await getUserParticipation(email);
      const participations = await Promise.all(
        participationRecords.map(async (p) => {
          const hackathon = await getHackathonById(p.hackathon_id);
          return {
            hackathonId: p.hackathon_id,
            hackathonName: hackathon?.name ?? 'Unknown',
            role: p.participation_role,
            participatedAt: p.participated_at,
          };
        })
      );

      // Voting tokens (polls where voter was registered)
      const tokens = await getTokensByEmail(email);
      const votesWithDetails: Array<{
        pollId: string;
        pollName: string;
        hackathonId: string | null;
        hackathonName: string;
        teamId: string;
        teamName: string;
        used: boolean;
        votedAt: string | null;
        txHash: string | null;
        explorerUrl: string | null;
      }> = [];

      for (const tokenRecord of tokens) {
        const poll = await getPollById(tokenRecord.poll_id);
        const hackathon = poll?.hackathon_id
          ? await getHackathonById(poll.hackathon_id)
          : null;
        const team = await getTeamById(tokenRecord.team_id);
        const vote = await getVoteByTokenHash(tokenRecord.token);
        votesWithDetails.push({
          pollId: tokenRecord.poll_id,
          pollName: poll?.name ?? 'Unknown poll',
          hackathonId: poll?.hackathon_id ?? null,
          hackathonName: hackathon?.name ?? '—',
          teamId: tokenRecord.team_id,
          teamName: team?.team_name ?? 'Unknown team',
          used: tokenRecord.used,
          votedAt: vote?.timestamp ? new Date(vote.timestamp).toISOString() : null,
          txHash: vote?.tx_hash ?? null,
          explorerUrl: vote?.tx_hash ? getExplorerUrl(vote.tx_hash) : null,
        });
      }

      return NextResponse.json({
        email: voter.email,
        participations,
        votes: votesWithDetails,
      });
    } catch (error) {
      console.error('Voter participation error:', error);
      return NextResponse.json(
        { error: 'Failed to load participation' },
        { status: 500 }
      );
    }
  })(req);
}
