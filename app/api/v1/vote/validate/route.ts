import { NextRequest, NextResponse } from 'next/server';
import { handleValidateVote } from '@/lib/vote/validate-handler';

/**
 * @swagger
 * /api/v1/vote/validate:
 *   post:
 *     summary: Validate voting token and get available teams
 *     tags: [Vote]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token is valid
 *       400:
 *         description: Invalid token or already used
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  return handleValidateVote(req);
}

