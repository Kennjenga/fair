/**
 * Hackathon template type definitions
 */

/**
 * Governance model types
 */
export type GovernanceModel =
  | 'centralized'
  | 'community_led'
  | 'sponsor_driven'
  | 'dao_managed'
  | 'hybrid'
  | 'rolling'
  | 'pilot';

/**
 * Complexity level types
 */
export type ComplexityLevel = 'beginner' | 'intermediate' | 'advanced';

/**
 * Role definition
 */
export interface Role {
  name: string;
  permissions: string[];
  description?: string;
}

/**
 * Permission definition
 */
export interface Permission {
  action: string;
  resource: string;
  conditions?: Record<string, any>;
}

/**
 * Evaluation logic configuration
 */
export interface EvaluationLogic {
  method: 'vote' | 'score' | 'rank';
  votingMode?: 'single' | 'multiple' | 'ranked';
  votingPermissions?: 'voters_only' | 'judges_only' | 'voters_and_judges';
  voterWeight?: number;
  judgeWeight?: number;
  rankPointsConfig?: Record<string, number>;
}

/**
 * Integrity rules configuration
 */
export interface IntegrityRules {
  immutableAfterLaunch: boolean;
  requireCommitments: boolean;
  publicAuditLog: boolean;
  allowVoteEditing: boolean;
  minVoterParticipation?: number;
  minJudgeParticipation?: number;
}

/**
 * Outcome logic configuration
 */
export interface OutcomeLogic {
  calculationMethod: 'simple_majority' | 'weighted_average' | 'ranked_choice' | 'custom';
  tieBreakingMethod?: 'random' | 'judge_decision' | 'revote';
  quorumRequired?: number;
}

/**
 * Template configuration
 */
export interface TemplateConfig {
  roles: Role[];
  permissions: Permission[];
  evaluationLogic: EvaluationLogic;
  integrityRules: IntegrityRules;
  outcomeLogic: OutcomeLogic;
}

/**
 * Hackathon template database record
 */
export interface HackathonTemplate {
  templateId: string;
  name: string;
  description: string | null;
  governanceModel: GovernanceModel;
  intendedUse: string | null;
  complexityLevel: ComplexityLevel;
  config: TemplateConfig;
  defaultFormFields: FormFieldDefinition[];
  isBuiltIn: boolean;
  isPublic: boolean;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Form field definition (used in templates)
 */
export interface FormFieldDefinition {
  fieldName: string;
  fieldType: 'text' | 'long_text' | 'url' | 'file' | 'select' | 'multi_select' | 'team_members';
  fieldLabel: string;
  fieldDescription?: string;
  isRequired: boolean;
  validationRules?: ValidationRules;
  fieldOptions?: string[];
  visibilityScope?: 'public' | 'judges_only' | 'organizer_only';
  displayOrder: number;
}

/**
 * Validation rules for form fields
 */
export interface ValidationRules {
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  allowedTypes?: string[]; // For file uploads
  maxSize?: number; // For file uploads (in bytes)
  min?: number; // For numeric fields
  max?: number; // For numeric fields
}

/**
 * Template creation request
 */
export interface CreateTemplateRequest {
  name: string;
  description?: string;
  governanceModel: GovernanceModel;
  intendedUse?: string;
  complexityLevel: ComplexityLevel;
  config: TemplateConfig;
  defaultFormFields?: FormFieldDefinition[];
  isPublic?: boolean;
}

/**
 * Template update request
 */
export interface UpdateTemplateRequest {
  name?: string;
  description?: string;
  intendedUse?: string;
  complexityLevel?: ComplexityLevel;
  config?: TemplateConfig;
  defaultFormFields?: FormFieldDefinition[];
  isPublic?: boolean;
}
