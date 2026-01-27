/**
 * Form field type definitions
 */

import type { ValidationRules } from './template';

/**
 * Field type enum
 */
export type FieldType = 'text' | 'long_text' | 'url' | 'file' | 'select' | 'multi_select' | 'team_members';

/**
 * Visibility scope enum
 */
export type VisibilityScope = 'public' | 'judges_only' | 'organizer_only';

/**
 * Form key types - defines which form a field belongs to
 */
export type FormKey = 'team_formation' | 'project_details' | 'default';

/**
 * Form field database record
 */
export interface FormField {
  fieldId: string;
  hackathonId: string;
  formKey: FormKey;
  fieldName: string;
  fieldType: FieldType;
  fieldLabel: string;
  fieldDescription: string | null;
  isRequired: boolean;
  validationRules: ValidationRules;
  fieldOptions: string[];
  visibilityScope: VisibilityScope;
  displayOrder: number;
  createdAt: Date;
}

/**
 * Form field creation request
 */
export interface CreateFormFieldRequest {
  hackathonId: string;
  formKey?: FormKey; // Optional, defaults to 'default' if not provided
  fieldName: string;
  fieldType: FieldType;
  fieldLabel: string;
  fieldDescription?: string;
  isRequired?: boolean;
  validationRules?: ValidationRules;
  fieldOptions?: string[];
  visibilityScope?: VisibilityScope;
  displayOrder?: number;
}

/**
 * Form field update request
 */
export interface UpdateFormFieldRequest {
  fieldLabel?: string;
  fieldDescription?: string;
  isRequired?: boolean;
  validationRules?: ValidationRules;
  fieldOptions?: string[];
  visibilityScope?: VisibilityScope;
  displayOrder?: number;
}

/**
 * Bulk form field creation request
 */
export interface BulkCreateFormFieldsRequest {
  hackathonId: string;
  fields: Omit<CreateFormFieldRequest, 'hackathonId'>[];
}

/**
 * Form field reorder request
 */
export interface ReorderFormFieldsRequest {
  hackathonId: string;
  fieldOrders: Array<{
    fieldId: string;
    displayOrder: number;
  }>;
}
