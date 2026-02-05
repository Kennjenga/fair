import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import { getHackathonById } from '@/lib/repositories/hackathons';
import { getAllCommitments } from '@/lib/repositories/integrity';
import { canAccessResource } from '@/lib/repositories/admins';
import { getExplorerUrl } from '@/lib/blockchain/avalanche';
import type { AuthenticatedRequest } from '@/lib/auth/middleware';

/**
 * GET /api/v1/admin/hackathons/:hackathonId/integrity
 * Returns integrity commitments (blockchain records) for the hackathon.
 * Each commitment with tx_hash includes an explorerUrl for viewing on the blockchain.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ hackathonId: string }> }
) {
  return withAdmin(async (req: AuthenticatedRequest) => {
    try {
      const admin = req.admin!;
      const { hackathonId } = await params;

      const hackathon = await getHackathonById(hackathonId);
      if (!hackathon) {
        return NextResponse.json(
          { error: 'Hackathon not found' },
          { status: 404 }
        );
      }

      const allowed = await canAccessResource(admin, hackathon.created_by);
      if (!allowed) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      const commitments = await getAllCommitments(hackathonId);

      // Map to response shape with blockchain explorer URL for each tx_hash
      const records = commitments.map((c) => ({
        commitmentId: c.commitment_id,
        commitmentType: c.commitment_type,
        commitmentHash: c.commitment_hash,
        commitmentData: c.commitment_data,
        txHash: c.tx_hash,
        blockNumber: c.block_number,
        createdAt: c.created_at,
        explorerUrl: c.tx_hash ? getExplorerUrl(c.tx_hash) : null,
      }));

      return NextResponse.json({
        hackathonId,
        hackathonName: hackathon.name,
        commitments: records,
      });
    } catch (error) {
      console.error('Get hackathon integrity error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}
