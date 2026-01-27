import { query } from '@/lib/db';
import type { Hackathon } from '@/types/hackathon';
import type { QueryRow } from '@/types/database';
import { getTemplateById } from './templates';
import { bulkCreateFormFields } from './form-fields';
import { createCommitment } from './integrity';
import { trackParticipation } from './participation';

/**
 * Hackathon database record (extended)
 */
export interface HackathonRecordExtended extends QueryRow {
  hackathon_id: string;
  name: string;
  description: string | null;
  start_date: Date | null;
  end_date: Date | null;
  template_id: string | null;
  status: 'draft' | 'live' | 'closed' | 'finalized';
  governance_config: Record<string, any>;
  submission_deadline: Date | null;
  evaluation_deadline: Date | null;
  results_published_at: Date | null;
  voting_closes_at: Date | null; // When voting closes, status should change to 'closed'
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Create hackathon from template
 */
export async function createHackathonFromTemplate(
  templateId: string,
  name: string,
  createdBy: string,
  description?: string,
  startDate?: Date,
  endDate?: Date,
  submissionDeadline?: Date,
  evaluationDeadline?: Date,
  customConfig?: Record<string, any>,
  votingClosesAt?: Date
): Promise<HackathonRecordExtended> {
  // Get template
  const template = await getTemplateById(templateId);
  if (!template) {
    throw new Error('Template not found');
  }

  // Use template config or custom config
  const governanceConfig = customConfig || template.config;

  // Create hackathon
  const result = await query<HackathonRecordExtended>(
    `INSERT INTO hackathons 
     (name, description, start_date, end_date, template_id, status, governance_config, submission_deadline, evaluation_deadline, voting_closes_at, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      name,
      description || null,
      startDate || null,
      endDate || null,
      templateId,
      'draft', // Always start as draft
      JSON.stringify(governanceConfig),
      submissionDeadline || null,
      evaluationDeadline || null,
      votingClosesAt || null, // When voting closes, status changes to 'closed'
      createdBy,
    ]
  );

  const hackathon = parseHackathon(result.rows[0]);

  // Create default form fields from template
  if (template.default_form_fields && template.default_form_fields.length > 0) {
    await bulkCreateFormFields(hackathon.hackathon_id, template.default_form_fields);
  }

  // Create integrity commitment for rules
  await createCommitment(hackathon.hackathon_id, 'rules', {
    governanceConfig,
    templateId,
    createdAt: new Date().toISOString(),
  });

  // Track participation (organizer role)
  await trackParticipation(createdBy, hackathon.hackathon_id, 'organizer');

  return hackathon;
}

/**
 * Get hackathon by ID (extended version with all fields)
 */
export async function getHackathonByIdExtended(hackathonId: string): Promise<HackathonRecordExtended | null> {
  const result = await query<HackathonRecordExtended>(
    'SELECT * FROM hackathons WHERE hackathon_id = $1',
    [hackathonId]
  );

  if (!result.rows[0]) {
    return null;
  }

  return parseHackathon(result.rows[0]);
}

/**
 * Check if a status change is allowed based on hackathon dates.
 * 
 * Rules:
 * - Cannot change to 'live' if voting_closes_at has passed (must be 'closed')
 * - Cannot change to 'closed' if end_date has passed (must be 'finalized')
 * - Cannot change from 'closed' to 'live' if voting_closes_at has passed
 * - Cannot change from 'finalized' to any other status
 * 
 * @param hackathon - The hackathon record
 * @param newStatus - The desired new status
 * @returns Object with allowed boolean and reason string if not allowed
 */
export function canChangeStatus(
  hackathon: HackathonRecordExtended,
  newStatus: 'draft' | 'live' | 'closed' | 'finalized'
): { allowed: boolean; reason?: string } {
  const now = new Date();
  const currentStatus = hackathon.status;

  // Cannot change from finalized
  if (currentStatus === 'finalized') {
    return {
      allowed: false,
      reason: 'Cannot change status from finalized. The hackathon has ended.',
    };
  }

  // Check voting_closes_at constraint
  if (hackathon.voting_closes_at) {
    const votingClosesAt = new Date(hackathon.voting_closes_at);
    
    // If voting has closed, cannot go back to 'live' or 'draft'
    if (now >= votingClosesAt) {
      if (newStatus === 'live' || newStatus === 'draft') {
        return {
          allowed: false,
          reason: `Cannot change to '${newStatus}' because voting closed at ${votingClosesAt.toLocaleString()}. Status must be 'closed' or 'finalized'.`,
        };
      }
    }
  }

  // Check end_date constraint
  if (hackathon.end_date) {
    const endDate = new Date(hackathon.end_date);
    
    // If end date has passed, cannot go back to any status except 'finalized'
    if (now >= endDate) {
      if (newStatus !== 'finalized') {
        return {
          allowed: false,
          reason: `Cannot change to '${newStatus}' because the hackathon ended at ${endDate.toLocaleString()}. Status must be 'finalized'.`,
        };
      }
    }
  }

  return { allowed: true };
}

/**
 * Automatically update hackathon status based on dates.
 * 
 * This function should be called periodically (e.g., via cron job or scheduled task)
 * to automatically transition hackathon statuses:
 * - If voting_closes_at has passed and status is 'live', change to 'closed'
 * - If end_date has passed and status is not 'finalized', change to 'finalized'
 * 
 * @param hackathonId - Optional hackathon ID. If not provided, checks all hackathons.
 * @returns Array of updated hackathons
 */
export async function autoUpdateHackathonStatus(
  hackathonId?: string
): Promise<HackathonRecordExtended[]> {
  const now = new Date();
  const updated: HackathonRecordExtended[] = [];

  // Build query to find hackathons that need status updates
  let queryText = `
    SELECT * FROM hackathons 
    WHERE status IN ('live', 'closed')
  `;
  const params: unknown[] = [];

  if (hackathonId) {
    queryText += ' AND hackathon_id = $1';
    params.push(hackathonId);
  }

  const result = await query<HackathonRecordExtended>(queryText, params);

  for (const hackathon of result.rows) {
    const parsed = parseHackathon(hackathon);
    let newStatus: 'closed' | 'finalized' | null = null;

    // Check if end_date has passed -> should be 'finalized'
    if (parsed.end_date) {
      const endDate = new Date(parsed.end_date);
      if (now >= endDate && parsed.status !== 'finalized') {
        newStatus = 'finalized';
      }
    }

    // Check if voting_closes_at has passed -> should be 'closed' (unless already finalized)
    if (!newStatus && parsed.voting_closes_at) {
      const votingClosesAt = new Date(parsed.voting_closes_at);
      if (now >= votingClosesAt && parsed.status === 'live') {
        newStatus = 'closed';
      }
    }

    // Update status if needed (bypass validation since we're auto-updating based on dates)
    if (newStatus) {
      // Directly update status without validation (since we've already checked dates)
      const result = await query<HackathonRecordExtended>(
        `UPDATE hackathons 
         SET status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE hackathon_id = $2
         RETURNING *`,
        [newStatus, parsed.hackathon_id]
      );

      if (result.rows[0]) {
        const updatedHackathon = parseHackathon(result.rows[0]);
        
        // Lock submissions if moving to 'closed'
        if (newStatus === 'closed') {
          const { lockSubmissions } = await import('@/lib/repositories/submissions');
          await lockSubmissions(parsed.hackathon_id);
        }
        
        updated.push(updatedHackathon);
      }
    }
  }

  return updated;
}

/**
 * Update hackathon status with date validation.
 * 
 * This function validates that the status change is allowed based on dates
 * before updating the status.
 */
export async function updateHackathonStatus(
  hackathonId: string,
  status: 'draft' | 'live' | 'closed' | 'finalized'
): Promise<HackathonRecordExtended> {
  // First, get the current hackathon to check dates
  const hackathon = await getHackathonByIdExtended(hackathonId);
  if (!hackathon) {
    throw new Error('Hackathon not found');
  }

  // Check if status change is allowed
  const validation = canChangeStatus(hackathon, status);
  if (!validation.allowed) {
    throw new Error(validation.reason || 'Status change not allowed');
  }

  // Update status
  const result = await query<HackathonRecordExtended>(
    `UPDATE hackathons 
     SET status = $1, updated_at = CURRENT_TIMESTAMP
     WHERE hackathon_id = $2
     RETURNING *`,
    [status, hackathonId]
  );

  if (!result.rows[0]) {
    throw new Error('Hackathon not found');
  }

  return parseHackathon(result.rows[0]);
}

/**
 * Get hackathon with template details
 */
export async function getHackathonWithTemplate(hackathonId: string): Promise<any> {
  const result = await query<any>(
    `SELECT 
       h.*,
       t.name as template_name,
       t.governance_model,
       t.complexity_level
     FROM hackathons h
     LEFT JOIN hackathon_templates t ON h.template_id = t.template_id
     WHERE h.hackathon_id = $1`,
    [hackathonId]
  );

  if (!result.rows[0]) {
    return null;
  }

  return parseHackathon(result.rows[0]);
}

/**
 * Get hackathons by status
 */
export async function getHackathonsByStatus(
  status: 'draft' | 'live' | 'closed' | 'finalized'
): Promise<HackathonRecordExtended[]> {
  const result = await query<HackathonRecordExtended>(
    'SELECT * FROM hackathons WHERE status = $1 ORDER BY created_at DESC',
    [status]
  );

  return result.rows.map(parseHackathon);
}

/**
 * Parse hackathon record (handle JSONB fields)
 */
function parseHackathon(record: HackathonRecordExtended): HackathonRecordExtended {
  if (typeof record.governance_config === 'string') {
    record.governance_config = JSON.parse(record.governance_config);
  }
  return record;
}
