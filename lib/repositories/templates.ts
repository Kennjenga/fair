import { query } from '@/lib/db';
import type { HackathonTemplate, CreateTemplateRequest, UpdateTemplateRequest, FormFieldDefinition, TemplateConfig } from '@/types/template';
import type { QueryRow } from '@/types/database';
import { BUILT_IN_TEMPLATES } from '@/lib/templates/built-in-templates';

/**
 * Template database record
 */
export interface TemplateRecord extends QueryRow {
  template_id: string;
  name: string;
  description: string | null;
  governance_model: string;
  intended_use: string | null;
  complexity_level: string;
  config: TemplateConfig;
  default_form_fields: FormFieldDefinition[];
  is_built_in: boolean;
  is_public: boolean;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Create a new hackathon template
 */
export async function createTemplate(
  name: string,
  governanceModel: string,
  config: TemplateConfig,
  createdBy: string,
  description?: string,
  intendedUse?: string,
  complexityLevel: string = 'intermediate',
  defaultFormFields: FormFieldDefinition[] = [],
  isPublic: boolean = false
): Promise<TemplateRecord> {
  const result = await query<TemplateRecord>(
    `INSERT INTO hackathon_templates 
     (name, description, governance_model, intended_use, complexity_level, config, default_form_fields, is_built_in, is_public, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      name,
      description || null,
      governanceModel,
      intendedUse || null,
      complexityLevel,
      JSON.stringify(config),
      JSON.stringify(defaultFormFields),
      false, // Custom templates are never built-in
      isPublic,
      createdBy,
    ]
  );

  return parseTemplate(result.rows[0]);
}

/**
 * Create a built-in template (used by seed script)
 */
export async function createBuiltInTemplate(
  name: string,
  governanceModel: string,
  config: TemplateConfig,
  description?: string,
  intendedUse?: string,
  complexityLevel: string = 'intermediate',
  defaultFormFields: FormFieldDefinition[] = []
): Promise<TemplateRecord> {
  const result = await query<TemplateRecord>(
    `INSERT INTO hackathon_templates 
     (name, description, governance_model, intended_use, complexity_level, config, default_form_fields, is_built_in, is_public, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      name,
      description || null,
      governanceModel,
      intendedUse || null,
      complexityLevel,
      JSON.stringify(config),
      JSON.stringify(defaultFormFields),
      true, // Built-in template
      true, // Built-in templates are always public
      null, // No creator for built-in templates
    ]
  );

  return parseTemplate(result.rows[0]);
}

/**
 * Get template by ID
 */
export async function getTemplateById(templateId: string): Promise<TemplateRecord | null> {
  const result = await query<TemplateRecord>(
    'SELECT * FROM hackathon_templates WHERE template_id = $1',
    [templateId]
  );

  return result.rows[0] ? parseTemplate(result.rows[0]) : null;
}

/**
 * Get all built-in templates
 */
export async function getBuiltInTemplates(): Promise<TemplateRecord[]> {
  const result = await query<TemplateRecord>(
    'SELECT * FROM hackathon_templates WHERE is_built_in = true ORDER BY name ASC'
  );

  return result.rows.map(parseTemplate);
}

/**
 * Get a single built-in template by governance model (for idempotent seeding).
 */
export async function getBuiltInTemplateByGovernanceModel(governanceModel: string): Promise<TemplateRecord | null> {
  const result = await query<TemplateRecord>(
    'SELECT * FROM hackathon_templates WHERE is_built_in = true AND governance_model = $1 LIMIT 1',
    [governanceModel]
  );
  return result.rows[0] ? parseTemplate(result.rows[0]) : null;
}

/**
 * Get public custom templates
 */
export async function getPublicTemplates(): Promise<TemplateRecord[]> {
  const result = await query<TemplateRecord>(
    'SELECT * FROM hackathon_templates WHERE is_built_in = false AND is_public = true ORDER BY created_at DESC'
  );

  return result.rows.map(parseTemplate);
}

/**
 * Get templates created by a specific admin
 */
export async function getTemplatesByCreator(adminId: string): Promise<TemplateRecord[]> {
  const result = await query<TemplateRecord>(
    'SELECT * FROM hackathon_templates WHERE created_by = $1 ORDER BY created_at DESC',
    [adminId]
  );

  return result.rows.map(parseTemplate);
}

/**
 * Get all templates accessible to an admin (built-in + public + own)
 */
export async function getAllTemplatesForAdmin(adminId: string): Promise<TemplateRecord[]> {
  const result = await query<TemplateRecord>(
    `SELECT * FROM hackathon_templates 
     WHERE is_built_in = true 
        OR is_public = true 
        OR created_by = $1
     ORDER BY is_built_in DESC, created_at DESC`,
    [adminId]
  );

  return result.rows.map(parseTemplate);
}

/**
 * Get templates by governance model
 */
export async function getTemplatesByGovernanceModel(
  governanceModel: string,
  adminId?: string
): Promise<TemplateRecord[]> {
  let queryText = `
    SELECT * FROM hackathon_templates 
    WHERE governance_model = $1 
      AND (is_built_in = true OR is_public = true`;
  
  const params: any[] = [governanceModel];
  
  if (adminId) {
    queryText += ` OR created_by = $2`;
    params.push(adminId);
  }
  
  queryText += `) ORDER BY is_built_in DESC, created_at DESC`;

  const result = await query<TemplateRecord>(queryText, params);

  return result.rows.map(parseTemplate);
}

/**
 * Update a custom template
 */
export async function updateTemplate(
  templateId: string,
  updates: UpdateTemplateRequest
): Promise<TemplateRecord> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(updates.description);
  }
  if (updates.intendedUse !== undefined) {
    fields.push(`intended_use = $${paramIndex++}`);
    values.push(updates.intendedUse);
  }
  if (updates.complexityLevel !== undefined) {
    fields.push(`complexity_level = $${paramIndex++}`);
    values.push(updates.complexityLevel);
  }
  if (updates.config !== undefined) {
    fields.push(`config = $${paramIndex++}`);
    values.push(JSON.stringify(updates.config));
  }
  if (updates.defaultFormFields !== undefined) {
    fields.push(`default_form_fields = $${paramIndex++}`);
    values.push(JSON.stringify(updates.defaultFormFields));
  }
  if (updates.isPublic !== undefined) {
    fields.push(`is_public = $${paramIndex++}`);
    values.push(updates.isPublic);
  }

  if (fields.length === 0) {
    const template = await getTemplateById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }
    return template;
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(templateId);

  const result = await query<TemplateRecord>(
    `UPDATE hackathon_templates 
     SET ${fields.join(', ')} 
     WHERE template_id = $${paramIndex} AND is_built_in = false
     RETURNING *`,
    values
  );

  if (!result.rows[0]) {
    throw new Error('Template not found or cannot be updated (built-in templates cannot be modified)');
  }

  return parseTemplate(result.rows[0]);
}

/**
 * Delete a custom template
 */
export async function deleteTemplate(templateId: string): Promise<void> {
  const result = await query(
    'DELETE FROM hackathon_templates WHERE template_id = $1 AND is_built_in = false',
    [templateId]
  );

  if (result.rowCount === 0) {
    throw new Error('Template not found or cannot be deleted (built-in templates cannot be deleted)');
  }
}

/**
 * Check if a template is built-in
 */
export async function isBuiltInTemplate(templateId: string): Promise<boolean> {
  const result = await query<{ is_built_in: boolean }>(
    'SELECT is_built_in FROM hackathon_templates WHERE template_id = $1',
    [templateId]
  );

  return result.rows[0]?.is_built_in || false;
}

/**
 * Parse template record (handle JSONB fields)
 */
function parseTemplate(record: TemplateRecord): TemplateRecord {
  if (typeof record.config === 'string') {
    record.config = JSON.parse(record.config);
  }
  if (typeof record.default_form_fields === 'string') {
    record.default_form_fields = JSON.parse(record.default_form_fields);
  }
  return record;
}

/**
 * Seed built-in templates into the database only if they do not already exist (idempotent).
 * Inserts by governance_model so Centralized, Community-Led, Sponsor-Driven, etc. all appear.
 * Returns counts of seeded and skipped templates.
 */
export async function seedBuiltInTemplatesIfMissing(): Promise<{ seeded: number; skipped: number }> {
  let seeded = 0;
  let skipped = 0;
  for (const template of BUILT_IN_TEMPLATES) {
    const existing = await getBuiltInTemplateByGovernanceModel(template.governanceModel);
    if (existing) {
      skipped++;
      continue;
    }
    await createBuiltInTemplate(
      template.name,
      template.governanceModel,
      template.config,
      template.description,
      template.intendedUse,
      template.complexityLevel,
      template.defaultFormFields
    );
    seeded++;
  }
  return { seeded, skipped };
}
