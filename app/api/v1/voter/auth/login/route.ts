import { NextRequest, NextResponse } from 'next/server';
import { verifyVoterCredentials, findVoterByEmail, createVoter } from '@/lib/repositories/voters';
import { verifyAdminCredentials } from '@/lib/repositories/admins';
import { generateVoterToken } from '@/lib/auth/jwt';
import { loginSchema } from '@/lib/validation/schemas';

/**
 * POST /api/v1/voter/auth/login
 * Authenticate a voter (email + password) and return JWT for voter dashboard.
 * If no voter account exists but the same email/password match an admin account
 * (e.g. user has participated or voted as admin), a voter account is created
 * so they can log in with the same credentials and view their participation.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = loginSchema.parse(body);
    const emailNormalized = validated.email.trim().toLowerCase();

    // 1. Try voter table first (voter lookup is case-insensitive)
    let voter = await verifyVoterCredentials(emailNormalized, validated.password);

    // 2. If no voter account, allow login with admin credentials and auto-create voter
    if (!voter) {
      const admin = await verifyAdminCredentials(validated.email, validated.password);
      if (admin) {
        // Only create voter if no voter record exists (voter may have different password)
        const existingVoter = await findVoterByEmail(emailNormalized);
        if (!existingVoter) {
          voter = await createVoter(emailNormalized, validated.password);
        }
      }
    }

    if (!voter) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const token = generateVoterToken({
      voterId: voter.voter_id,
      email: voter.email,
      type: 'voter',
    });

    return NextResponse.json({
      token,
      voter: {
        voterId: voter.voter_id,
        email: voter.email,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error },
        { status: 400 }
      );
    }
    console.error('Voter login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
