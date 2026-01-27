import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import {
  getFormFields,
  createFormField,
  updateFormField,
  deleteFormField,
  getFormFieldById,
  deleteFormFieldsByFormKey,
} from '@/lib/repositories/form-fields';
import type { CreateFormFieldRequest, UpdateFormFieldRequest } from '@/types/form';

/**
 * GET /api/v1/admin/hackathons/:id/form
 * Get form fields for a hackathon.
 *
 * This endpoint is used by the admin UI to render the current
 * participation / submission form configuration.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hackathonId: string }> },
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Resolve dynamic route params
    const { hackathonId } = await params;
    
    // Extract form_key from query parameter (optional filter)
    const url = new URL(request.url);
    const formKey = url.searchParams.get('form') || undefined;
    
    // Get form fields, optionally filtered by form_key
    const fields = await getFormFields(hackathonId, formKey);

    return NextResponse.json({ fields }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching form fields:', error);
    return NextResponse.json(
      { error: 'Failed to fetch form fields', details: error.message },
      { status: 500 },
    );
  }
}

/**
 * POST /api/v1/admin/hackathons/:id/form
 * Create a new form field for a hackathon.
 *
 * This powers the "form builder" experience, allowing admins to add
 * the team and participant fields they need without touching SQL.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ hackathonId: string }> },
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Resolve dynamic route params
    const { hackathonId } = await params;

    // Parse and validate minimal create request body
    const body: CreateFormFieldRequest = await request.json();

    if (!body.fieldName || !body.fieldType || !body.fieldLabel) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: fieldName, fieldType, fieldLabel are required',
        },
        { status: 400 },
      );
    }

    // Create the new form field using the repository helper
    // formKey defaults to 'default' if not provided for backward compatibility
    const created = await createFormField(
      hackathonId,
      body.fieldName,
      body.fieldType,
      body.fieldLabel,
      body.fieldDescription,
      body.isRequired ?? false,
      body.validationRules ?? {},
      body.fieldOptions ?? [],
      body.visibilityScope ?? 'public',
      body.displayOrder ?? 0,
      body.formKey ?? 'default',
    );

    return NextResponse.json({ field: created }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating form field:', error);
    return NextResponse.json(
      { error: 'Failed to create form field', details: error.message },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/v1/admin/hackathons/:id/form
 * Update an existing form field.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ hackathonId: string }> },
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Resolve dynamic route params
    const { hackathonId } = await params;

    // Parse request body
    const body: UpdateFormFieldRequest & { fieldId: string } = await request.json();

    if (!body.fieldId) {
      return NextResponse.json(
        { error: 'Missing required field: fieldId' },
        { status: 400 },
      );
    }

    // Verify the field belongs to this hackathon
    const existingField = await getFormFieldById(body.fieldId);
    if (!existingField) {
      return NextResponse.json(
        { error: 'Form field not found' },
        { status: 404 },
      );
    }

    if (existingField.hackathon_id !== hackathonId) {
      return NextResponse.json(
        { error: 'Form field does not belong to this hackathon' },
        { status: 403 },
      );
    }

    // Update the form field
    const updated = await updateFormField(body.fieldId, {
      fieldLabel: body.fieldLabel,
      fieldDescription: body.fieldDescription,
      isRequired: body.isRequired,
      validationRules: body.validationRules,
      fieldOptions: body.fieldOptions,
      visibilityScope: body.visibilityScope,
      displayOrder: body.displayOrder,
    });

    return NextResponse.json({ field: updated }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating form field:', error);
    return NextResponse.json(
      { error: 'Failed to update form field', details: error.message },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/v1/admin/hackathons/:id/form
 * Delete a form field.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ hackathonId: string }> },
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Resolve dynamic route params
    const { hackathonId } = await params;

    // Get parameters from query
    const url = new URL(request.url);
    const fieldId = url.searchParams.get('fieldId');
    const formKey = url.searchParams.get('formKey');

    // If formKey is provided, delete entire form
    if (formKey) {
      const deletedCount = await deleteFormFieldsByFormKey(hackathonId, formKey);
      return NextResponse.json(
        { message: `Form deleted successfully. ${deletedCount} field(s) removed.` },
        { status: 200 }
      );
    }

    // Otherwise, delete single field
    if (!fieldId) {
      return NextResponse.json(
        { error: 'Missing required parameter: fieldId or formKey' },
        { status: 400 },
      );
    }

    // Verify the field belongs to this hackathon
    const existingField = await getFormFieldById(fieldId);
    if (!existingField) {
      return NextResponse.json(
        { error: 'Form field not found' },
        { status: 404 },
      );
    }

    if (existingField.hackathon_id !== hackathonId) {
      return NextResponse.json(
        { error: 'Form field does not belong to this hackathon' },
        { status: 403 },
      );
    }

    // Delete the form field
    await deleteFormField(fieldId);

    return NextResponse.json({ message: 'Form field deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting form field:', error);
    return NextResponse.json(
      { error: 'Failed to delete form field', details: error.message },
      { status: 500 },
    );
  }
}
