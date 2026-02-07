import { NextRequest, NextResponse } from 'next/server';
import { handleSubmitVote } from '@/lib/vote/submit-handler';

/**
 * @swagger
 * /api/v1/vote/submit:
 *   post:
 *     summary: Submit a vote
 *     tags: [Vote]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubmitVoteRequest'
 *     responses:
 *       200:
 *         description: Vote submitted successfully
 *       400:
 *         description: Invalid vote or validation failed
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  return handleSubmitVote(req);
}
