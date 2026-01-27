/**
 * Built-in hackathon template definitions
 * These templates provide pre-configured governance models for different hackathon types
 */

import type { TemplateConfig, FormFieldDefinition } from '@/types/template';

/**
 * Template 1: Centralized Hackathon (Integrity Overlay)
 * Organizer has full control with transparency overlay
 */
export const CENTRALIZED_TEMPLATE = {
  name: 'Centralized Hackathon',
  description: 'Traditional hackathon with organizer control and integrity overlay for transparency. Best for corporate hackathons and internal events.',
  governanceModel: 'centralized' as const,
  intendedUse: 'Corporate hackathons, internal innovation challenges, controlled environments',
  complexityLevel: 'beginner' as const,
  config: {
    roles: [
      { name: 'organizer', permissions: ['create', 'edit', 'delete', 'view_all', 'manage_judges', 'publish_results'], description: 'Full control over hackathon' },
      { name: 'judge', permissions: ['view_submissions', 'evaluate', 'view_results'], description: 'Evaluates submissions' },
      { name: 'participant', permissions: ['submit', 'view_own_submission'], description: 'Submits projects' },
    ],
    permissions: [],
    evaluationLogic: {
      method: 'score' as const,
      votingPermissions: 'judges_only' as const,
      judgeWeight: 1.0,
    },
    integrityRules: {
      immutableAfterLaunch: true,
      requireCommitments: true,
      publicAuditLog: false,
      allowVoteEditing: false,
    },
    outcomeLogic: {
      calculationMethod: 'weighted_average' as const,
      tieBreakingMethod: 'judge_decision' as const,
    },
  } as TemplateConfig,
  defaultFormFields: [
    { fieldName: 'project_name', fieldType: 'text' as const, fieldLabel: 'Project Name', isRequired: true, displayOrder: 1, visibilityScope: 'public' as const },
    { fieldName: 'project_description', fieldType: 'long_text' as const, fieldLabel: 'Project Description', isRequired: true, displayOrder: 2, visibilityScope: 'public' as const },
    { fieldName: 'demo_url', fieldType: 'url' as const, fieldLabel: 'Demo URL', isRequired: false, displayOrder: 3, visibilityScope: 'public' as const },
    { fieldName: 'team_members', fieldType: 'team_members' as const, fieldLabel: 'Team Members', isRequired: true, displayOrder: 4, visibilityScope: 'public' as const },
  ] as FormFieldDefinition[],
};

/**
 * Template 2: Community-Led Hackathon (Collective Integrity)
 * Community voting determines winners
 */
export const COMMUNITY_LED_TEMPLATE = {
  name: 'Community-Led Hackathon',
  description: 'Democratic hackathon where community voting determines winners. Ideal for open-source communities and grassroots events.',
  governanceModel: 'community_led' as const,
  intendedUse: 'Open-source communities, grassroots events, public hackathons',
  complexityLevel: 'intermediate' as const,
  config: {
    roles: [
      { name: 'organizer', permissions: ['create', 'edit', 'manage_participants'], description: 'Manages hackathon logistics' },
      { name: 'participant', permissions: ['submit', 'vote', 'view_submissions'], description: 'Submits and votes' },
      { name: 'voter', permissions: ['vote', 'view_submissions'], description: 'Community member who votes' },
    ],
    permissions: [],
    evaluationLogic: {
      method: 'vote' as const,
      votingMode: 'ranked' as const,
      votingPermissions: 'voters_and_judges' as const,
      voterWeight: 1.0,
      rankPointsConfig: { '1': 10, '2': 7, '3': 5, '4': 3, '5': 1 },
    },
    integrityRules: {
      immutableAfterLaunch: true,
      requireCommitments: true,
      publicAuditLog: true,
      allowVoteEditing: true,
      minVoterParticipation: 10,
    },
    outcomeLogic: {
      calculationMethod: 'ranked_choice' as const,
      tieBreakingMethod: 'revote' as const,
      quorumRequired: 10,
    },
  } as TemplateConfig,
  defaultFormFields: [
    { fieldName: 'project_name', fieldType: 'text' as const, fieldLabel: 'Project Name', isRequired: true, displayOrder: 1, visibilityScope: 'public' as const },
    { fieldName: 'project_description', fieldType: 'long_text' as const, fieldLabel: 'Project Description', isRequired: true, displayOrder: 2, visibilityScope: 'public' as const },
    { fieldName: 'github_url', fieldType: 'url' as const, fieldLabel: 'GitHub Repository', isRequired: true, displayOrder: 3, visibilityScope: 'public' as const },
    { fieldName: 'demo_url', fieldType: 'url' as const, fieldLabel: 'Live Demo URL', isRequired: false, displayOrder: 4, visibilityScope: 'public' as const },
    { fieldName: 'team_members', fieldType: 'team_members' as const, fieldLabel: 'Team Members', isRequired: true, displayOrder: 5, visibilityScope: 'public' as const },
  ] as FormFieldDefinition[],
};

/**
 * Template 3: Sponsor-Driven Hackathon (Conflict-Aware Governance)
 * Sponsors vote with conflict tracking
 */
export const SPONSOR_DRIVEN_TEMPLATE = {
  name: 'Sponsor-Driven Hackathon',
  description: 'Hackathon where sponsors evaluate projects with conflict-of-interest tracking. Perfect for multi-sponsor events.',
  governanceModel: 'sponsor_driven' as const,
  intendedUse: 'Multi-sponsor events, prize-driven hackathons, corporate partnerships',
  complexityLevel: 'intermediate' as const,
  config: {
    roles: [
      { name: 'organizer', permissions: ['create', 'edit', 'manage_sponsors', 'publish_results'], description: 'Manages hackathon' },
      { name: 'sponsor', permissions: ['view_submissions', 'evaluate', 'award_prizes'], description: 'Evaluates and awards prizes' },
      { name: 'judge', permissions: ['view_submissions', 'evaluate'], description: 'Independent judge' },
      { name: 'participant', permissions: ['submit', 'view_own_submission'], description: 'Submits projects' },
    ],
    permissions: [],
    evaluationLogic: {
      method: 'score' as const,
      votingPermissions: 'judges_only' as const,
      voterWeight: 0.3,
      judgeWeight: 0.7,
    },
    integrityRules: {
      immutableAfterLaunch: true,
      requireCommitments: true,
      publicAuditLog: false,
      allowVoteEditing: false,
      minJudgeParticipation: 3,
    },
    outcomeLogic: {
      calculationMethod: 'weighted_average' as const,
      tieBreakingMethod: 'judge_decision' as const,
    },
  } as TemplateConfig,
  defaultFormFields: [
    { fieldName: 'project_name', fieldType: 'text' as const, fieldLabel: 'Project Name', isRequired: true, displayOrder: 1, visibilityScope: 'public' as const },
    { fieldName: 'project_description', fieldType: 'long_text' as const, fieldLabel: 'Project Description', isRequired: true, displayOrder: 2, visibilityScope: 'public' as const },
    { fieldName: 'sponsor_track', fieldType: 'select' as const, fieldLabel: 'Sponsor Track', isRequired: true, displayOrder: 3, visibilityScope: 'public' as const, fieldOptions: ['General', 'Sponsor A', 'Sponsor B', 'Sponsor C'] },
    { fieldName: 'demo_url', fieldType: 'url' as const, fieldLabel: 'Demo URL', isRequired: false, displayOrder: 4, visibilityScope: 'public' as const },
    { fieldName: 'pitch_deck', fieldType: 'file' as const, fieldLabel: 'Pitch Deck', isRequired: false, displayOrder: 5, visibilityScope: 'judges_only' as const },
    { fieldName: 'team_members', fieldType: 'team_members' as const, fieldLabel: 'Team Members', isRequired: true, displayOrder: 6, visibilityScope: 'public' as const },
  ] as FormFieldDefinition[],
};

/**
 * Template 4: DAO-Managed Hackathon (Native Governance)
 * DAO token holders vote
 */
export const DAO_MANAGED_TEMPLATE = {
  name: 'DAO-Managed Hackathon',
  description: 'Hackathon governed by DAO token holders with token-weighted voting. For Web3 communities and DAO grants.',
  governanceModel: 'dao_managed' as const,
  intendedUse: 'Web3 communities, DAO grants, decentralized organizations',
  complexityLevel: 'advanced' as const,
  config: {
    roles: [
      { name: 'organizer', permissions: ['create', 'edit', 'manage_participants'], description: 'Manages logistics' },
      { name: 'dao_member', permissions: ['vote', 'view_submissions', 'propose'], description: 'DAO token holder' },
      { name: 'participant', permissions: ['submit', 'view_own_submission'], description: 'Submits projects' },
    ],
    permissions: [],
    evaluationLogic: {
      method: 'vote' as const,
      votingMode: 'ranked' as const,
      votingPermissions: 'voters_only' as const,
      voterWeight: 1.0,
      rankPointsConfig: { '1': 10, '2': 7, '3': 5, '4': 3, '5': 1 },
    },
    integrityRules: {
      immutableAfterLaunch: true,
      requireCommitments: true,
      publicAuditLog: true,
      allowVoteEditing: true,
      minVoterParticipation: 5,
    },
    outcomeLogic: {
      calculationMethod: 'ranked_choice' as const,
      tieBreakingMethod: 'revote' as const,
      quorumRequired: 5,
    },
  } as TemplateConfig,
  defaultFormFields: [
    { fieldName: 'project_name', fieldType: 'text' as const, fieldLabel: 'Project Name', isRequired: true, displayOrder: 1, visibilityScope: 'public' as const },
    { fieldName: 'project_description', fieldType: 'long_text' as const, fieldLabel: 'Project Description', isRequired: true, displayOrder: 2, visibilityScope: 'public' as const },
    { fieldName: 'github_url', fieldType: 'url' as const, fieldLabel: 'GitHub Repository', isRequired: true, displayOrder: 3, visibilityScope: 'public' as const },
    { fieldName: 'wallet_address', fieldType: 'text' as const, fieldLabel: 'Wallet Address (for prize distribution)', isRequired: true, displayOrder: 4, visibilityScope: 'organizer_only' as const },
    { fieldName: 'demo_url', fieldType: 'url' as const, fieldLabel: 'Live Demo', isRequired: false, displayOrder: 5, visibilityScope: 'public' as const },
    { fieldName: 'team_members', fieldType: 'team_members' as const, fieldLabel: 'Team Members', isRequired: true, displayOrder: 6, visibilityScope: 'public' as const },
  ] as FormFieldDefinition[],
};

/**
 * Template 5: Hybrid Hackathon (Multi-Stakeholder Governance)
 * Combination of judges, community, and sponsors
 */
export const HYBRID_TEMPLATE = {
  name: 'Hybrid Hackathon',
  description: 'Multi-stakeholder governance combining judges, community votes, and sponsor input. For large-scale diverse events.',
  governanceModel: 'hybrid' as const,
  intendedUse: 'Large-scale events, diverse stakeholders, complex evaluation criteria',
  complexityLevel: 'advanced' as const,
  config: {
    roles: [
      { name: 'organizer', permissions: ['create', 'edit', 'manage_all', 'publish_results'], description: 'Full control' },
      { name: 'judge', permissions: ['view_submissions', 'evaluate'], description: 'Expert judge' },
      { name: 'sponsor', permissions: ['view_submissions', 'evaluate'], description: 'Sponsor representative' },
      { name: 'voter', permissions: ['vote', 'view_submissions'], description: 'Community voter' },
      { name: 'participant', permissions: ['submit', 'view_own_submission'], description: 'Submits projects' },
    ],
    permissions: [],
    evaluationLogic: {
      method: 'score' as const,
      votingPermissions: 'voters_and_judges' as const,
      voterWeight: 0.3,
      judgeWeight: 0.7,
    },
    integrityRules: {
      immutableAfterLaunch: true,
      requireCommitments: true,
      publicAuditLog: true,
      allowVoteEditing: false,
      minVoterParticipation: 20,
      minJudgeParticipation: 5,
    },
    outcomeLogic: {
      calculationMethod: 'weighted_average' as const,
      tieBreakingMethod: 'judge_decision' as const,
      quorumRequired: 20,
    },
  } as TemplateConfig,
  defaultFormFields: [
    { fieldName: 'project_name', fieldType: 'text' as const, fieldLabel: 'Project Name', isRequired: true, displayOrder: 1, visibilityScope: 'public' as const },
    { fieldName: 'project_description', fieldType: 'long_text' as const, fieldLabel: 'Project Description', isRequired: true, displayOrder: 2, visibilityScope: 'public' as const },
    { fieldName: 'category', fieldType: 'select' as const, fieldLabel: 'Category', isRequired: true, displayOrder: 3, visibilityScope: 'public' as const, fieldOptions: ['AI/ML', 'Blockchain', 'IoT', 'Mobile', 'Web', 'Other'] },
    { fieldName: 'demo_url', fieldType: 'url' as const, fieldLabel: 'Demo URL', isRequired: false, displayOrder: 4, visibilityScope: 'public' as const },
    { fieldName: 'video_pitch', fieldType: 'file' as const, fieldLabel: 'Video Pitch', isRequired: false, displayOrder: 5, visibilityScope: 'public' as const },
    { fieldName: 'team_members', fieldType: 'team_members' as const, fieldLabel: 'Team Members', isRequired: true, displayOrder: 6, visibilityScope: 'public' as const },
  ] as FormFieldDefinition[],
};

/**
 * Template 6: Rolling/Continuous Hackathon (Long-Horizon Integrity)
 * Continuous submissions with periodic evaluations
 */
export const ROLLING_TEMPLATE = {
  name: 'Rolling Hackathon',
  description: 'Continuous hackathon with ongoing submissions and periodic batch evaluations. For long-term innovation programs.',
  governanceModel: 'rolling' as const,
  intendedUse: 'Ongoing innovation programs, continuous improvement initiatives, grant programs',
  complexityLevel: 'intermediate' as const,
  config: {
    roles: [
      { name: 'organizer', permissions: ['create', 'edit', 'manage_all', 'schedule_evaluations'], description: 'Manages program' },
      { name: 'judge', permissions: ['view_submissions', 'evaluate'], description: 'Evaluates batches' },
      { name: 'participant', permissions: ['submit', 'view_own_submission', 'resubmit'], description: 'Can submit multiple times' },
    ],
    permissions: [],
    evaluationLogic: {
      method: 'score' as const,
      votingPermissions: 'judges_only' as const,
      judgeWeight: 1.0,
    },
    integrityRules: {
      immutableAfterLaunch: false,
      requireCommitments: true,
      publicAuditLog: true,
      allowVoteEditing: true,
    },
    outcomeLogic: {
      calculationMethod: 'weighted_average' as const,
      tieBreakingMethod: 'judge_decision' as const,
    },
  } as TemplateConfig,
  defaultFormFields: [
    { fieldName: 'project_name', fieldType: 'text' as const, fieldLabel: 'Project Name', isRequired: true, displayOrder: 1, visibilityScope: 'public' as const },
    { fieldName: 'project_description', fieldType: 'long_text' as const, fieldLabel: 'Project Description', isRequired: true, displayOrder: 2, visibilityScope: 'public' as const },
    { fieldName: 'milestone', fieldType: 'select' as const, fieldLabel: 'Milestone', isRequired: true, displayOrder: 3, visibilityScope: 'public' as const, fieldOptions: ['Prototype', 'MVP', 'Beta', 'Production'] },
    { fieldName: 'demo_url', fieldType: 'url' as const, fieldLabel: 'Demo URL', isRequired: false, displayOrder: 4, visibilityScope: 'public' as const },
    { fieldName: 'team_members', fieldType: 'team_members' as const, fieldLabel: 'Team Members', isRequired: true, displayOrder: 5, visibilityScope: 'public' as const },
  ] as FormFieldDefinition[],
};

/**
 * Template 7: Pilot/Trust-Building Hackathon (Proof-of-Integrity)
 * Maximum transparency for first-time organizers
 */
export const PILOT_TEMPLATE = {
  name: 'Pilot Hackathon',
  description: 'Maximum transparency hackathon for building trust. All data public, perfect for first-time organizers.',
  governanceModel: 'pilot' as const,
  intendedUse: 'First-time organizers, trust-building events, proof-of-concept hackathons',
  complexityLevel: 'beginner' as const,
  config: {
    roles: [
      { name: 'organizer', permissions: ['create', 'edit', 'manage_participants'], description: 'Manages hackathon' },
      { name: 'judge', permissions: ['view_submissions', 'evaluate'], description: 'Evaluates submissions' },
      { name: 'voter', permissions: ['vote', 'view_submissions'], description: 'Public voter' },
      { name: 'participant', permissions: ['submit', 'view_all_submissions'], description: 'Submits and views all' },
    ],
    permissions: [],
    evaluationLogic: {
      method: 'vote' as const,
      votingMode: 'single' as const,
      votingPermissions: 'voters_and_judges' as const,
      voterWeight: 0.5,
      judgeWeight: 0.5,
    },
    integrityRules: {
      immutableAfterLaunch: true,
      requireCommitments: true,
      publicAuditLog: true,
      allowVoteEditing: false,
      minVoterParticipation: 5,
    },
    outcomeLogic: {
      calculationMethod: 'simple_majority' as const,
      tieBreakingMethod: 'random' as const,
      quorumRequired: 5,
    },
  } as TemplateConfig,
  defaultFormFields: [
    { fieldName: 'project_name', fieldType: 'text' as const, fieldLabel: 'Project Name', isRequired: true, displayOrder: 1, visibilityScope: 'public' as const },
    { fieldName: 'project_description', fieldType: 'long_text' as const, fieldLabel: 'Project Description', isRequired: true, displayOrder: 2, visibilityScope: 'public' as const },
    { fieldName: 'demo_url', fieldType: 'url' as const, fieldLabel: 'Demo URL', isRequired: false, displayOrder: 3, visibilityScope: 'public' as const },
    { fieldName: 'team_members', fieldType: 'team_members' as const, fieldLabel: 'Team Members', isRequired: true, displayOrder: 4, visibilityScope: 'public' as const },
  ] as FormFieldDefinition[],
};

/**
 * All built-in templates
 */
export const BUILT_IN_TEMPLATES = [
  CENTRALIZED_TEMPLATE,
  COMMUNITY_LED_TEMPLATE,
  SPONSOR_DRIVEN_TEMPLATE,
  DAO_MANAGED_TEMPLATE,
  HYBRID_TEMPLATE,
  ROLLING_TEMPLATE,
  PILOT_TEMPLATE,
];
