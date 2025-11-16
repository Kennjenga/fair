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
 * Create hackathon schema
 */
export const createHackathonSchema = z.object({
  name: z.string().min(1, 'Hackathon name is required').max(255, 'Hackathon name too long'),
  description: z.string().max(5000, 'Description too long').optional(),
  startDate: z.string().refine(
    (val) => {
      if (!val) return true;
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: 'Invalid start date format' }
  ).optional(),
  endDate: z.string().refine(
    (val) => {
      if (!val) return true;
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: 'Invalid end date format' }
  ).optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      return endDate > startDate;
    }
    return true;
  },
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
);

/**
 * Update hackathon schema
 */
export const updateHackathonSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional(),
  startDate: z.string().refine(
    (val) => {
      if (!val) return true;
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: 'Invalid start date format' }
  ).optional(),
  endDate: z.string().refine(
    (val) => {
      if (!val) return true;
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: 'Invalid end date format' }
  ).optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      return endDate > startDate;
    }
    return true;
  },
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
);

/**
 * Create poll schema
 */
export const createPollSchema = z.object({
  hackathonId: z.string().uuid('Invalid hackathon ID'),
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
  votingMode: z.enum(['single', 'multiple', 'ranked']).optional().default('single'),
  votingPermissions: z.enum(['voters_only', 'judges_only', 'voters_and_judges']).optional().default('voters_and_judges'),
  voterWeight: z.number().min(0).optional().default(1.0),
  judgeWeight: z.number().min(0).optional().default(1.0),
  rankPointsConfig: z.record(z.string(), z.number()).optional(),
  allowSelfVote: z.boolean().optional().default(false),
  requireTeamNameGate: z.boolean().optional().default(true),
  isPublicResults: z.boolean().optional().default(false),
  maxRankedPositions: z.number().int().positive().nullable().optional(), // Maximum positions to rank (null = unlimited)
  votingSequence: z.enum(['simultaneous', 'voters_first']).optional().default('simultaneous'),
  parentPollId: z.string().uuid('Invalid parent poll ID').nullable().optional(), // For tie-breaker polls
  isTieBreaker: z.boolean().optional().default(false),
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
).refine(
  (data) => {
    // maxRankedPositions only makes sense for ranked voting mode
    if (data.maxRankedPositions !== null && data.maxRankedPositions !== undefined && data.votingMode !== 'ranked') {
      return false;
    }
    return true;
  },
  {
    message: 'maxRankedPositions can only be set for ranked voting mode',
    path: ['maxRankedPositions'],
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
  votingMode: z.enum(['single', 'multiple', 'ranked']).optional(),
  votingPermissions: z.enum(['voters_only', 'judges_only', 'voters_and_judges']).optional(),
  voterWeight: z.number().min(0).optional(),
  judgeWeight: z.number().min(0).optional(),
  rankPointsConfig: z.record(z.string(), z.number()).optional(),
  allowSelfVote: z.boolean().optional(),
  requireTeamNameGate: z.boolean().optional(),
  isPublicResults: z.boolean().optional(),
  maxRankedPositions: z.number().int().positive().nullable().optional(),
  votingSequence: z.enum(['simultaneous', 'voters_first']).optional(),
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
).refine(
  (data) => {
    // maxRankedPositions only makes sense for ranked voting mode
    if (data.maxRankedPositions !== null && data.maxRankedPositions !== undefined && data.votingMode && data.votingMode !== 'ranked') {
      return false;
    }
    return true;
  },
  {
    message: 'maxRankedPositions can only be set for ranked voting mode',
    path: ['maxRankedPositions'],
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
 * Vote ranking schema
 */
export const voteRankingSchema = z.object({
  teamId: z.string().uuid('Invalid team ID'),
  rank: z.number().int().min(1, 'Rank must be at least 1'),
  points: z.number().optional(), // Will be calculated server-side
  reason: z.string().max(1000, 'Reason too long').optional(),
});

/**
 * Submit vote schema
 * Supports three voting modes: single, multiple, ranked
 */
export const submitVoteSchema = z.object({
  token: z.string().optional(), // Required for voter votes
  judgeEmail: z.string().email('Invalid email address').optional(), // Required for judge votes
  pollId: z.string().uuid('Invalid poll ID').optional(), // Required for judge votes
  teamName: z.string().optional(), // Required if requireTeamNameGate is true
  // Single vote mode
  teamIdTarget: z.string().uuid('Invalid team ID').optional(),
  // Multiple vote mode
  teams: z.array(z.string().uuid('Invalid team ID')).optional(),
  // Ranked vote mode
  rankings: z.array(voteRankingSchema).optional(),
}).refine(
  (data) => {
    // Must have either token (voter) or judgeEmail (judge)
    return !!(data.token || data.judgeEmail);
  },
  {
    message: 'Either token (for voters) or judgeEmail (for judges) is required',
    path: ['token'],
  }
).refine(
  (data) => {
    // If judgeEmail is provided, pollId is required
    if (data.judgeEmail && !data.pollId) {
      return false;
    }
    return true;
  },
  {
    message: 'pollId is required when judgeEmail is provided',
    path: ['pollId'],
  }
).refine(
  (data) => {
    // Must have exactly one voting method
    const hasSingle = !!data.teamIdTarget;
    const hasMultiple = !!data.teams && data.teams.length > 0;
    const hasRanked = !!data.rankings && data.rankings.length > 0;
    const count = [hasSingle, hasMultiple, hasRanked].filter(Boolean).length;
    return count === 1;
  },
  {
    message: 'Must provide exactly one: teamIdTarget (single), teams (multiple), or rankings (ranked)',
  }
);

/**
 * Create judge schema
 */
export const createJudgeSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().max(255, 'Name too long').optional(),
});

/**
 * Create admin schema
 */
export const createAdminSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'super_admin']).default('admin'),
});

