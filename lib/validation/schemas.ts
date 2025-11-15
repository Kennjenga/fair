import { z } from 'zod';

/**
 * Validation schemas using Zod
 */

/**
 * Login request schema
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Create poll schema
 */
export const createPollSchema = z.object({
  name: z.string().min(1, 'Poll name is required').max(255, 'Poll name too long'),
  startTime: z.string().refine(
    (val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: 'Invalid start time format' }
  ),
  endTime: z.string().refine(
    (val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: 'Invalid end time format' }
  ),
  allowSelfVote: z.boolean().optional().default(false),
  requireTeamNameGate: z.boolean().optional().default(true),
  isPublicResults: z.boolean().optional().default(false),
}).refine(
  (data) => {
    const startDate = new Date(data.startTime);
    const endDate = new Date(data.endTime);
    return endDate > startDate;
  },
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
);

/**
 * Update poll schema
 * Allows extending poll duration even after end time has passed
 */
export const updatePollSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  startTime: z.string().refine(
    (val) => {
      if (!val) return true;
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: 'Invalid start time format' }
  ).optional(),
  endTime: z.string().refine(
    (val) => {
      if (!val) return true;
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: 'Invalid end time format' }
  ).optional(),
  allowSelfVote: z.boolean().optional(),
  requireTeamNameGate: z.boolean().optional(),
  isPublicResults: z.boolean().optional(),
}).refine(
  (data) => {
    // Only validate if both times are provided
    if (data.startTime && data.endTime) {
      const startDate = new Date(data.startTime);
      const endDate = new Date(data.endTime);
      return endDate > startDate;
    }
    return true;
  },
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
);

/**
 * Team project metadata schema
 * Validates project details for teams
 */
export const teamProjectMetadataSchema = z.object({
  projectName: z.string().max(500, 'Project name too long').optional(),
  projectDescription: z.string().max(5000, 'Project description too long').optional(),
  pitch: z.string().max(5000, 'Pitch too long').optional(),
  liveSiteUrl: z.union([
    z.string().url('Invalid URL format').max(500, 'URL too long'),
    z.literal(''),
  ]).optional(),
  githubUrl: z.union([
    z.string().url('Invalid URL format').max(500, 'URL too long'),
    z.literal(''),
  ]).optional(),
}).passthrough(); // Allow additional fields

/**
 * Create team schema
 */
export const createTeamSchema = z.object({
  teamName: z.string().min(1, 'Team name is required').max(255, 'Team name too long'),
  metadata: teamProjectMetadataSchema.optional(),
});

/**
 * Update team schema
 */
export const updateTeamSchema = z.object({
  teamName: z.string().min(1, 'Team name is required').max(255, 'Team name too long').optional(),
  metadata: teamProjectMetadataSchema.optional(),
});

/**
 * Bulk team import schema
 */
export const bulkTeamImportSchema = z.object({
  teams: z.array(createTeamSchema).min(1, 'At least one team is required'),
});

/**
 * Register voters schema
 */
export const registerVotersSchema = z.object({
  voters: z.array(
    z.object({
      email: z.string().email('Invalid email address'),
      teamName: z.string().min(1, 'Team name is required'),
    })
  ).min(1, 'At least one voter is required'),
});

/**
 * Submit vote schema
 */
export const submitVoteSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  teamName: z.string().min(1, 'Team name is required'),
  teamIdTarget: z.string().uuid('Invalid team ID'),
});

/**
 * Create admin schema
 */
export const createAdminSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'super_admin']).default('admin'),
});

