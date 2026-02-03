import { NextRequest, NextResponse } from 'next/server';
import { createVoter, findVoterByEmail } from '@/lib/repositories/voters';
import { loginSchema } from '@/lib/validation/schemas';

/**
 * POST /api/v1/voter/auth/register
 * Register a voter account (email + password) so they can log in and view participation.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = loginSchema.parse(body);
    const email = validated.email.toLowerCase().trim();

    const existing = await findVoterByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please log in.' },
        { status: 400 }
      );
    }

    const voter = await createVoter(email, validated.password);
    return NextResponse.json({
      message: 'Registration successful',
      voter: {
        voterId: voter.voter_id,
        email: voter.email,
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error },
        { status: 400 }
      );
    }
    console.error('Voter register error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
