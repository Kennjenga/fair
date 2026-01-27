import { NextRequest, NextResponse } from 'next/server';
import { getFormFields } from '@/lib/repositories/form-fields';

/**
 * GET /api/v1/public/hackathons/:id/form
 * Get public form fields for a hackathon
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hackathonId: string }> }
) {
  try {
    // Resolve dynamic route params
    const { hackathonId } = await params;
    
    // Extract form_key from query parameter (e.g., ?form=team_formation)
    const url = new URL(request.url);
    const formKey = url.searchParams.get('form') || undefined;
    
    // Get form fields, optionally filtered by form_key
    const fields = await getFormFields(hackathonId, formKey);

    // Only return public fields
    const publicFields = fields.filter(field => field.visibility_scope === 'public');

    return NextResponse.json({ fields: publicFields }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching public form fields:', error);
    return NextResponse.json(
      { error: 'Failed to fetch form fields', details: error.message },
      { status: 500 }
    );
  }
}
