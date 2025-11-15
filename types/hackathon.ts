/**
 * Hackathon-related type definitions
 */

/**
 * Hackathon creation request
 */
export interface CreateHackathonRequest {
  name: string;
  description?: string;
  startDate?: string; // ISO 8601 date string
  endDate?: string; // ISO 8601 date string
}

/**
 * Hackathon update request
 */
export interface UpdateHackathonRequest {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Hackathon database record
 */
export interface Hackathon {
  hackathonId: string;
  name: string;
  description: string | null;
  startDate: Date | null;
  endDate: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

