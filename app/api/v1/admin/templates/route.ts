import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import { getAllTemplatesForAdmin, getBuiltInTemplates, getPublicTemplates, createTemplate } from '@/lib/repositories/templates';
import type { AuthenticatedRequest } from '@/lib/auth/middleware';
import type { CreateTemplateRequest } from '@/types/template';

/**
 * GET /api/v1/admin/templates
 * Get all templates accessible to the admin
 * Query params:
 *   - filter: 'built-in' | 'public' | 'custom' | undefined (all)
 *   - governanceModel: filter by governance model
 *   - complexityLevel: filter by complexity level
 */
export async function GET(req: NextRequest) {
  return withAdmin(async (req: AuthenticatedRequest) => {
    try {
      const admin = req.admin!;
      const { searchParams } = new URL(req.url);
      
      const filter = searchParams.get('filter');
      const governanceModel = searchParams.get('governanceModel');
      const complexityLevel = searchParams.get('complexityLevel');

      let templates;

      if (filter === 'built-in') {
        templates = await getBuiltInTemplates();
      } else if (filter === 'public') {
        templates = await getPublicTemplates();
      } else {
        templates = await getAllTemplatesForAdmin(admin.adminId);
      }

      // Apply additional filters
      if (governanceModel) {
        templates = templates.filter(t => t.governance_model === governanceModel);
      }

      if (complexityLevel) {
        templates = templates.filter(t => t.complexity_level === complexityLevel);
      }

      // Format response
      const formattedTemplates = templates.map(t => ({
        templateId: t.template_id,
        name: t.name,
        description: t.description,
        governanceModel: t.governance_model,
        intendedUse: t.intended_use,
        complexityLevel: t.complexity_level,
        config: t.config,
        defaultFormFields: t.default_form_fields,
        isBuiltIn: t.is_built_in,
        isPublic: t.is_public,
        createdBy: t.created_by,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      }));

      return NextResponse.json({ templates: formattedTemplates }, { status: 200 });
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      return NextResponse.json(
        { error: 'Failed to fetch templates', details: error.message },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * POST /api/v1/admin/templates
 * Create a new custom template
 */
export async function POST(req: NextRequest) {
  return withAdmin(async (req: AuthenticatedRequest) => {
    try {
      const admin = req.admin!;
      const body: CreateTemplateRequest = await req.json();

      // Validate required fields
      if (!body.name || !body.governanceModel || !body.config) {
        return NextResponse.json(
          { error: 'Missing required fields: name, governanceModel, config' },
          { status: 400 }
        );
      }

      const template = await createTemplate(
        body.name,
        body.governanceModel,
        body.config,
        admin.adminId,
        body.description,
        body.intendedUse,
        body.complexityLevel || 'intermediate',
        body.defaultFormFields || [],
        body.isPublic || false
      );

      return NextResponse.json({ template }, { status: 201 });
    } catch (error: any) {
      console.error('Error creating template:', error);
      return NextResponse.json(
        { error: 'Failed to create template', details: error.message },
        { status: 500 }
      );
    }
  })(req);
}
