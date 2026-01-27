import { query } from '@/lib/db';
import type { FormField, CreateFormFieldRequest, UpdateFormFieldRequest } from '@/types/form';
import type { QueryRow } from '@/types/database';

/**
 * Form field database record
 */
export interface FormFieldRecord extends QueryRow {
  field_id: string;
  hackathon_id: string;
  form_key: string;
  field_name: string;
  field_type: string;
  field_label: string;
  field_description: string | null;
  is_required: boolean;
  validation_rules: Record<string, any>;
  field_options: string[];
  visibility_scope: string;
  display_order: number;
  created_at: Date;
}

/**
 * Create a form field.
 * 
 * @param formKey - The form key (e.g., 'team_formation', 'project_details', 'default').
 *                  This allows multiple forms per hackathon.
 */
export async function createFormField(
  hackathonId: string,
  fieldName: string,
  fieldType: string,
  fieldLabel: string,
  fieldDescription?: string,
  isRequired: boolean = false,
  validationRules: Record<string, any> = {},
  fieldOptions: string[] = [],
  visibilityScope: string = 'public',
  displayOrder: number = 0,
  formKey: string = 'default'
): Promise<FormFieldRecord> {
  const result = await query<FormFieldRecord>(
    `INSERT INTO hackathon_form_fields 
     (hackathon_id, form_key, field_name, field_type, field_label, field_description, is_required, validation_rules, field_options, visibility_scope, display_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      hackathonId,
      formKey,
      fieldName,
      fieldType,
      fieldLabel,
      fieldDescription || null,
      isRequired,
      JSON.stringify(validationRules),
      JSON.stringify(fieldOptions),
      visibilityScope,
      displayOrder,
    ]
  );

  return parseFormField(result.rows[0]);
}

/**
 * Get form fields for a hackathon, optionally filtered by form_key.
 * 
 * @param hackathonId - The hackathon ID
 * @param formKey - Optional form key filter (e.g., 'team_formation', 'project_details').
 *                  If not provided, returns all form fields for the hackathon.
 */
export async function getFormFields(
  hackathonId: string,
  formKey?: string
): Promise<FormFieldRecord[]> {
  let queryText = 'SELECT * FROM hackathon_form_fields WHERE hackathon_id = $1';
  const params: unknown[] = [hackathonId];

  if (formKey) {
    queryText += ' AND form_key = $2';
    params.push(formKey);
  }

  queryText += ' ORDER BY display_order ASC, created_at ASC';

  const result = await query<FormFieldRecord>(queryText, params);

  return result.rows.map(parseFormField);
}

/**
 * Get form field by ID
 */
export async function getFormFieldById(fieldId: string): Promise<FormFieldRecord | null> {
  const result = await query<FormFieldRecord>(
    'SELECT * FROM hackathon_form_fields WHERE field_id = $1',
    [fieldId]
  );

  return result.rows[0] ? parseFormField(result.rows[0]) : null;
}

/**
 * Get form field by name
 */
export async function getFormFieldByName(
  hackathonId: string,
  fieldName: string
): Promise<FormFieldRecord | null> {
  const result = await query<FormFieldRecord>(
    'SELECT * FROM hackathon_form_fields WHERE hackathon_id = $1 AND field_name = $2',
    [hackathonId, fieldName]
  );

  return result.rows[0] ? parseFormField(result.rows[0]) : null;
}

/**
 * Update a form field
 */
export async function updateFormField(
  fieldId: string,
  updates: UpdateFormFieldRequest
): Promise<FormFieldRecord> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (updates.fieldLabel !== undefined) {
    fields.push(`field_label = $${paramIndex++}`);
    values.push(updates.fieldLabel);
  }
  if (updates.fieldDescription !== undefined) {
    fields.push(`field_description = $${paramIndex++}`);
    values.push(updates.fieldDescription);
  }
  if (updates.isRequired !== undefined) {
    fields.push(`is_required = $${paramIndex++}`);
    values.push(updates.isRequired);
  }
  if (updates.validationRules !== undefined) {
    fields.push(`validation_rules = $${paramIndex++}`);
    values.push(JSON.stringify(updates.validationRules));
  }
  if (updates.fieldOptions !== undefined) {
    fields.push(`field_options = $${paramIndex++}`);
    values.push(JSON.stringify(updates.fieldOptions));
  }
  if (updates.visibilityScope !== undefined) {
    fields.push(`visibility_scope = $${paramIndex++}`);
    values.push(updates.visibilityScope);
  }
  if (updates.displayOrder !== undefined) {
    fields.push(`display_order = $${paramIndex++}`);
    values.push(updates.displayOrder);
  }

  if (fields.length === 0) {
    const field = await getFormFieldById(fieldId);
    if (!field) {
      throw new Error('Form field not found');
    }
    return field;
  }

  values.push(fieldId);

  const result = await query<FormFieldRecord>(
    `UPDATE hackathon_form_fields 
     SET ${fields.join(', ')} 
     WHERE field_id = $${paramIndex}
     RETURNING *`,
    values
  );

  if (!result.rows[0]) {
    throw new Error('Form field not found');
  }

  return parseFormField(result.rows[0]);
}

/**
 * Delete a form field
 */
export async function deleteFormField(fieldId: string): Promise<void> {
  const result = await query(
    'DELETE FROM hackathon_form_fields WHERE field_id = $1',
    [fieldId]
  );

  if (result.rowCount === 0) {
    throw new Error('Form field not found');
  }
}

/**
 * Reorder form fields
 */
export async function reorderFormFields(
  fieldOrders: Array<{ fieldId: string; displayOrder: number }>
): Promise<void> {
  // Use a transaction to update all fields atomically
  const client = await query('BEGIN');

  try {
    for (const { fieldId, displayOrder } of fieldOrders) {
      await query(
        'UPDATE hackathon_form_fields SET display_order = $1 WHERE field_id = $2',
        [displayOrder, fieldId]
      );
    }

    await query('COMMIT');
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
}

/**
 * Bulk create form fields (used when creating hackathon from template)
 */
export async function bulkCreateFormFields(
  hackathonId: string,
  fields: Omit<CreateFormFieldRequest, 'hackathonId'>[]
): Promise<FormFieldRecord[]> {
  const createdFields: FormFieldRecord[] = [];

  for (const field of fields) {
    const created = await createFormField(
      hackathonId,
      field.fieldName,
      field.fieldType,
      field.fieldLabel,
      field.fieldDescription,
      field.isRequired,
      field.validationRules,
      field.fieldOptions,
      field.visibilityScope,
      field.displayOrder
    );
    createdFields.push(created);
  }

  return createdFields;
}

/**
 * Delete all form fields for a hackathon
 */
export async function deleteAllFormFields(hackathonId: string): Promise<number> {
  const result = await query(
    'DELETE FROM hackathon_form_fields WHERE hackathon_id = $1',
    [hackathonId]
  );

  return result.rowCount || 0;
}

/**
 * Delete all form fields for a specific form_key in a hackathon
 */
export async function deleteFormFieldsByFormKey(
  hackathonId: string,
  formKey: string
): Promise<number> {
  const result = await query(
    'DELETE FROM hackathon_form_fields WHERE hackathon_id = $1 AND form_key = $2',
    [hackathonId, formKey]
  );

  return result.rowCount || 0;
}

/**
 * Get form field count for a hackathon
 */
export async function getFormFieldCount(hackathonId: string): Promise<number> {
  const result = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM hackathon_form_fields WHERE hackathon_id = $1',
    [hackathonId]
  );

  return parseInt(result.rows[0]?.count || '0', 10);
}

/**
 * Parse form field record (handle JSONB fields)
 */
function parseFormField(record: FormFieldRecord): FormFieldRecord {
  if (typeof record.validation_rules === 'string') {
    record.validation_rules = JSON.parse(record.validation_rules);
  }
  if (typeof record.field_options === 'string') {
    record.field_options = JSON.parse(record.field_options);
  }
  return record;
}
