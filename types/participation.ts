/**
 * Participation tracking type definitions
 */

/**
 * Participation role types
 */
export type ParticipationRole = 'organizer' | 'participant' | 'judge' | 'voter';

/**
 * User participation database record
 */
export interface UserParticipation {
  participationId: string;
  userIdentifier: string;
  hackathonId: string;
  participationRole: ParticipationRole;
  participatedAt: Date;
}

/**
 * Participation tracking request
 */
export interface TrackParticipationRequest {
  userIdentifier: string;
  hackathonId: string;
  role: ParticipationRole;
}

/**
 * Decision summary for dashboard
 */
export interface DecisionSummary {
  hackathonId: string;
  hackathonName: string;
  description: string | null;
  status: 'draft' | 'live' | 'closed' | 'finalized';
  governanceModel: string | null;
  templateName: string | null;
  role: ParticipationRole;
  participatedAt: Date;
  integrityStatus: 'verifiable' | 'pending' | 'unverified';
  lastActivity: Date;
  startDate: Date | null;
  endDate: Date | null;
}
