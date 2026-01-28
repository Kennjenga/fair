import { NextRequest, NextResponse } from 'next/server';
import { getBuiltInTemplates, getPublicTemplates } from '@/lib/repositories/templates';

/**
 * GET /api/v1/public/templates
 * Get all public templates (built-in templates and public custom templates)
 * Query params:
 *   - governanceModel: filter by governance model
 *   - complexityLevel: filter by complexity level
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    const governanceModel = searchParams.get('governanceModel');
    const complexityLevel = searchParams.get('complexityLevel');

    // Get built-in templates (always public)
    const builtInTemplates = await getBuiltInTemplates();
    
    // Get public custom templates
    const publicTemplates = await getPublicTemplates();
    
    // Combine templates
    let templates = [...builtInTemplates, ...publicTemplates];

    // Apply filters
    if (governanceModel) {
      templates = templates.filter(t => t.governance_model === governanceModel);
    }

    if (complexityLevel) {
      templates = templates.filter(t => t.complexity_level === complexityLevel);
    }

    // Format response for public consumption
    const formattedTemplates = templates.map(t => ({
      templateId: t.template_id,
      name: t.name,
      description: t.description,
      governanceModel: t.governance_model,
      intendedUse: t.intended_use,
      complexityLevel: t.complexity_level,
      // Include config for public viewing (governance rules, roles, etc.)
      config: {
        roles: t.config.roles,
        evaluationLogic: t.config.evaluationLogic,
        integrityRules: t.config.integrityRules,
        outcomeLogic: t.config.outcomeLogic,
      },
      // Include form fields preview
      defaultFormFields: t.default_form_fields,
      isBuiltIn: t.is_built_in,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }));

    return NextResponse.json({ templates: formattedTemplates }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching public templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates', details: error.message },
      { status: 500 }
    );
  }
}
