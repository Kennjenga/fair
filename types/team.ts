/**
 * Team-related type definitions
 */

/**
 * Team project metadata structure
 * Contains project details for hackathon/voting teams
 */
export interface TeamProjectMetadata {
  projectName?: string;
  projectDescription?: string;
  pitch?: string;
  liveSiteUrl?: string;
  githubUrl?: string;
  [key: string]: unknown; // Allow additional metadata fields
}

/**
 * Team metadata structure
 * Can contain project metadata and other custom fields
 */
export interface TeamMetadata extends TeamProjectMetadata {
  // Additional metadata fields can be added here
  // Currently extends TeamProjectMetadata
}

/**
 * Team creation request
 */
export interface CreateTeamRequest {
  teamName: string;
  metadata?: TeamMetadata;
}

/**
 * Bulk team import request
 */
export interface BulkTeamImportRequest {
  teams: Array<{
    teamName: string;
    metadata?: TeamMetadata;
  }>;
}

/**
 * Team database record
 */
export interface Team {
  teamId: string;
  teamName: string;
  pollId: string;
  metadata: TeamMetadata | null;
  projectName?: string | null;
  projectDescription?: string | null;
  pitch?: string | null;
  liveSiteUrl?: string | null;
  githubUrl?: string | null;
  createdAt: Date;
}

/**
 * Team update request
 */
export interface UpdateTeamRequest {
  teamName?: string;
  metadata?: Partial<TeamProjectMetadata>;
}

