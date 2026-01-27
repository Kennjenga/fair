/**
 * Submission-related type definitions
 */

/**
 * File reference for Cloudinary uploads
 */
export interface FileReference {
  fieldName: string;
  publicId: string; // Cloudinary public ID
  url: string; // Cloudinary URL
  secureUrl: string; // Cloudinary secure URL
  fileName: string;
  fileSize: number;
  mimeType: string;
  format: string;
  uploadedAt: Date;
}

/**
 * Submission data (flexible structure based on form fields)
 */
export type SubmissionData = Record<string, any>;

/**
 * Hackathon submission database record
 */
export interface HackathonSubmission {
  submissionId: string;
  hackathonId: string;
  teamId: string | null;
  submissionData: SubmissionData;
  fileReferences: FileReference[];
  submissionHash: string;
  submittedBy: string | null;
  submittedAt: Date;
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Submission creation request
 */
export interface CreateSubmissionRequest {
  hackathonId: string;
  submissionData: SubmissionData;
  teamId?: string;
  submittedBy?: string;
}

/**
 * Submission with team details
 */
export interface SubmissionWithTeam extends HackathonSubmission {
  teamName?: string;
  teamMetadata?: Record<string, any>;
}
