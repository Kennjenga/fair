import { NextRequest, NextResponse } from 'next/server';
import { readVoteFromBlockchain } from '@/lib/blockchain/avalanche';

/**
 * @swagger
 * /api/v1/vote/blockchain/{txHash}:
 *   get:
 *     summary: Read vote data from blockchain transaction
 *     tags: [Vote]
 *     parameters:
 *       - in: path
 *         name: txHash
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vote data from blockchain
 *       404:
 *         description: Transaction not found or invalid
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ txHash: string }> }
) {
  try {
    const { txHash } = await params;
    
    if (!txHash || typeof txHash !== 'string') {
      return NextResponse.json(
        { error: 'Transaction hash is required' },
        { status: 400 }
      );
    }
    
    // Read vote data from blockchain
    const voteData = await readVoteFromBlockchain(txHash);
    
    if (!voteData) {
      return NextResponse.json(
        { error: 'Transaction not found or is not a valid FAIR voting transaction' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      txHash,
      voteData,
      message: 'Vote data retrieved from blockchain',
    });
  } catch (error) {
    console.error('Read blockchain vote error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

