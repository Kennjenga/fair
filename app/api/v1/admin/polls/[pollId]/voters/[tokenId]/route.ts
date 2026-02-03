import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import { getPollById, hasPollAccessForAdmin } from '@/lib/repositories/polls';
import { getTokenById, deleteToken } from '@/lib/repositories/tokens';
import { query } from '@/lib/db';
import { logAudit, getClientIp } from '@/lib/utils/audit';
import type { AuthenticatedRequest } from '@/lib/auth/middleware';

/**
 * @swagger
 * /api/v1/admin/polls/{pollId}/voters/{tokenId}:
 *   delete:
 *     summary: Remove a voter (delete token and associated votes)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ pollId: string; tokenId: string }> }
) {
  return withAdmin(async (req: AuthenticatedRequest) => {
    try {
      const admin = req.admin!;
      const { pollId, tokenId } = await params;
      
      // Check poll exists and access
      const poll = await getPollById(pollId);
      if (!poll) {
        return NextResponse.json(
          { error: 'Poll not found' },
          { status: 404 }
        );
      }
      
      // Check access: admins can access polls they created OR polls in hackathons they created
      const hasAccess = await hasPollAccessForAdmin(poll, admin);
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
      
      // Check token exists and belongs to poll
      const token = await getTokenById(tokenId);
      if (!token || token.poll_id !== pollId) {
        return NextResponse.json(
          { error: 'Voter not found' },
          { status: 404 }
        );
      }
      
      // Delete votes associated with this token (if any)
      // Votes are linked via token_hash, so we need to hash the token to find votes
      // But we only have the hashed token in the database, so we'll delete by token_id reference
      // Actually, votes table has token_hash, not token_id, so we need to find votes by matching the token hash
      const tokenHash = token.token; // This is already hashed
      
      // Delete votes that match this token hash
      await query(
        'DELETE FROM votes WHERE poll_id = $1 AND token_hash = $2',
        [pollId, tokenHash]
      );
      
      // Delete the token (this invalidates it)
      await deleteToken(tokenId);
      
      // Log audit
      await logAudit(
        'voter_removed',
        admin.adminId,
        pollId,
        admin.role,
        {
          tokenId,
          email: token.email,
          teamId: token.team_id,
          hadVote: token.used,
        },
        getClientIp(req.headers)
      );
      
      return NextResponse.json({ message: 'Voter removed successfully. Token invalidated and votes deleted.' });
    } catch (error) {
      console.error('Remove voter error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}

