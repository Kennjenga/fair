import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import { getTemplateById, updateTemplate, deleteTemplate, isBuiltInTemplate } from '@/lib/repositories/templates';
import type { AuthenticatedRequest } from '@/lib/auth/middleware';
import type { UpdateTemplateRequest } from '@/types/template';

/**
 * GET /api/v1/admin/templates/:templateId
 * Get a specific template by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  return withAdmin(async (req: AuthenticatedRequest) => {
    try {
      const { templateId } = await params;
      const template = await getTemplateById(templateId);

      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }

      return NextResponse.json({ template }, { status: 200 });
    } catch (error: any) {
      console.error('Error fetching template:', error);
      return NextResponse.json(
        { error: 'Failed to fetch template', details: error.message },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * PATCH /api/v1/admin/templates/:templateId
 * Update a custom template (built-in templates cannot be updated)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  return withAdmin(async (req: AuthenticatedRequest) => {
    try {
      const { templateId } = await params;
      const body: UpdateTemplateRequest = await req.json();

      // Check if template is built-in
      const isBuiltIn = await isBuiltInTemplate(templateId);
      if (isBuiltIn) {
        return NextResponse.json(
          { error: 'Built-in templates cannot be modified' },
          { status: 403 }
        );
      }

      const template = await updateTemplate(templateId, body);
      return NextResponse.json({ template }, { status: 200 });
    } catch (error: any) {
      console.error('Error updating template:', error);
      return NextResponse.json(
        { error: 'Failed to update template', details: error.message },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * DELETE /api/v1/admin/templates/:templateId
 * Delete a custom template (built-in templates cannot be deleted)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  return withAdmin(async (req: AuthenticatedRequest) => {
    try {
      const { templateId } = await params;

      // Check if template is built-in
      const isBuiltIn = await isBuiltInTemplate(templateId);
      if (isBuiltIn) {
        return NextResponse.json(
          { error: 'Built-in templates cannot be deleted' },
          { status: 403 }
        );
      }

      await deleteTemplate(templateId);
      return NextResponse.json({ message: 'Template deleted successfully' }, { status: 200 });
    } catch (error: any) {
      console.error('Error deleting template:', error);
      return NextResponse.json(
        { error: 'Failed to delete template', details: error.message },
        { status: 500 }
      );
    }
  })(req);
}
