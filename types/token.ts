/**
 * Token-related type definitions
 */

/**
 * Token delivery status
 */
export type TokenDeliveryStatus = 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed';

/**
 * Token database record
 */
export interface Token {
  tokenId: string;
  token: string;
  pollId: string;
  teamId: string;
  email: string;
  used: boolean;
  issuedAt: Date;
  expiresAt: Date | null;
  deliveryStatus: TokenDeliveryStatus;
  deliveryLog: Array<{
    timestamp: Date;
    status: TokenDeliveryStatus;
    message?: string;
  }>;
  createdAt: Date;
}

/**
 * Voter registration request
 */
export interface RegisterVotersRequest {
  voters: Array<{
    email: string;
    teamName: string;
  }>;
}

/**
 * Email dispatch request
 */
export interface DispatchEmailsRequest {
  pollId: string;
  resend?: boolean; // If true, resend to all voters
}

