import { NextRequest, NextResponse } from 'next/server';
import { findTokenByPlainToken } from '@/lib/repositories/tokens';
import { getPollById } from '@/lib/repositories/polls';
import { getTeamById } from '@/lib/repositories/teams';
import { hashToken } from '@/lib/utils/token';
import { getVoteByTokenHash } from '@/lib/repositories/votes';
import { getExplorerUrl } from '@/lib/blockchain/avalanche';
import { getTeamsByPoll } from '@/lib/repositories/teams';

/**
 * Shared handler for validating a voting token.
 * Used by both /api/v1/vote/validate and /api/external/v1/vote/validate.
 */
export async function handleValidateVote(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const tokenRecord = await findTokenByPlainToken(token);
    if (!tokenRecord) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    const poll = await getPollById(tokenRecord.poll_id);
    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    if (tokenRecord.used && !poll.allow_vote_editing) {
      return NextResponse.json({ error: 'Token has already been used' }, { status: 400 });
    }

    if (tokenRecord.expires_at && new Date() > new Date(tokenRecord.expires_at)) {
      return NextResponse.json({ error: 'Token has expired' }, { status: 400 });
    }

    const now = new Date();
    const hasVoted = tokenRecord.used;
    if (!hasVoted && (now < poll.start_time || now > poll.end_time)) {
      return NextResponse.json({ error: 'Poll is not currently active' }, { status: 400 });
    }
    if (hasVoted && !poll.allow_vote_editing && (now < poll.start_time || now > poll.end_time)) {
      return NextResponse.json({ error: 'Poll is not currently active' }, { status: 400 });
    }

    const teams = await getTeamsByPoll(tokenRecord.poll_id);
    const voterTeam = await getTeamById(tokenRecord.team_id);
    const availableTeams = poll.allow_self_vote
      ? teams
      : teams.filter((t) => t.team_id !== tokenRecord.team_id);

    const tokenHash = hashToken(token);
    const existingVote = await getVoteByTokenHash(tokenHash);

    if (existingVote) {
      return NextResponse.json({
        valid: true,
        alreadyVoted: true,
        canEdit: poll.allow_vote_editing ?? false,
        poll: {
          pollId: poll.poll_id,
          name: poll.name,
          votingMode: poll.voting_mode,
          votingPermissions: poll.voting_permissions,
          requireTeamNameGate: poll.require_team_name_gate,
          allowSelfVote: poll.allow_self_vote,
          allowVoteEditing: poll.allow_vote_editing ?? false,
          rankPointsConfig: poll.rank_points_config,
        },
        voterTeam: voterTeam
          ? { teamId: voterTeam.team_id, teamName: voterTeam.team_name }
          : null,
        availableTeams: teams.map((t) => ({
          teamId: t.team_id,
          teamName: t.team_name,
          projectName: t.project_name,
          projectDescription: t.project_description,
          pitch: t.pitch,
          liveSiteUrl: t.live_site_url,
          githubUrl: t.github_url,
        })),
        existingVote: {
          voteId: existingVote.vote_id,
          voteType: existingVote.vote_type,
          votingMode: poll.voting_mode,
          teamIdTarget: existingVote.team_id_target,
          teams: existingVote.teams,
          rankings: existingVote.rankings,
          timestamp: existingVote.timestamp,
          txHash: existingVote.tx_hash,
          explorerUrl: existingVote.tx_hash ? getExplorerUrl(existingVote.tx_hash) : null,
        },
      });
    }

    return NextResponse.json({
      valid: true,
      alreadyVoted: false,
      poll: {
        pollId: poll.poll_id,
        name: poll.name,
        votingMode: poll.voting_mode,
        votingPermissions: poll.voting_permissions,
        requireTeamNameGate: poll.require_team_name_gate,
        allowSelfVote: poll.allow_self_vote,
        rankPointsConfig: poll.rank_points_config,
        maxRankedPositions: poll.max_ranked_positions,
        votingSequence: poll.voting_sequence,
      },
      voterTeam: voterTeam
        ? { teamId: voterTeam.team_id, teamName: voterTeam.team_name }
        : null,
      availableTeams: availableTeams.map((t) => ({
        teamId: t.team_id,
        teamName: t.team_name,
        projectName: t.project_name,
        projectDescription: t.project_description,
        pitch: t.pitch,
        liveSiteUrl: t.live_site_url,
        githubUrl: t.github_url,
      })),
    });
  } catch (error) {
    console.error('Validate token error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
