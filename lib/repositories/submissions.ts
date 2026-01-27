import { query } from '@/lib/db';
import type { HackathonSubmission, SubmissionData, FileReference } from '@/types/submission';
import type { QueryRow } from '@/types/database';
import crypto from 'crypto';

/**
 * Submission database record
 */
export interface SubmissionRecord extends QueryRow {
  submission_id: string;
  hackathon_id: string;
  team_id: string | null;
  poll_id: string | null;
  submission_data: SubmissionData;
  file_references: FileReference[];
  submission_hash: string;
  submitted_by: string | null;
  submitted_at: Date;
  is_locked: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Create a submission hash from submission data
 */
function createSubmissionHash(submissionData: SubmissionData): string {
  const dataString = JSON.stringify(submissionData, Object.keys(submissionData).sort());
  return crypto.createHash('sha256').update(dataString).digest('hex');
}

/**
 * Create a new hackathon submission.
 * 
 * @param hackathonId - The hackathon this submission belongs to
 * @param submissionData - The actual submission data (JSONB)
 * @param submittedBy - Optional identifier for who submitted (email, user ID, etc.)
 * @param teamId - Optional team ID if this submission is associated with a team
 * @param fileReferences - Optional array of file references (Cloudinary URLs, etc.)
 * @param pollId - Optional poll ID if this is a project submission for a specific poll
 */
export async function createSubmission(
  hackathonId: string,
  submissionData: SubmissionData,
  submittedBy?: string,
  teamId?: string,
  fileReferences: FileReference[] = [],
  pollId?: string | null
): Promise<SubmissionRecord> {
  const submissionHash = createSubmissionHash(submissionData);

  const result = await query<SubmissionRecord>(
    `INSERT INTO hackathon_submissions 
     (hackathon_id, team_id, poll_id, submission_data, file_references, submission_hash, submitted_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      hackathonId,
      teamId || null,
      pollId || null,
      JSON.stringify(submissionData),
      JSON.stringify(fileReferences),
      submissionHash,
      submittedBy || null,
    ]
  );

  return parseSubmission(result.rows[0]);
}

/**
 * Get submission by ID
 */
export async function getSubmissionById(submissionId: string): Promise<SubmissionRecord | null> {
  const result = await query<SubmissionRecord>(
    'SELECT * FROM hackathon_submissions WHERE submission_id = $1',
    [submissionId]
  );

  return result.rows[0] ? parseSubmission(result.rows[0]) : null;
}

/**
 * Options for fetching submissions, used for pagination and filtering.
 */
export interface SubmissionQueryOptions {
  /**
   * 1-based page number. If not provided, defaults to page 1.
   */
  page?: number;
  /**
   * Page size for pagination. Defaults to 10 as per global guidelines.
   */
  pageSize?: number;
  /**
   * Optional free-text search applied against common submission fields
   * such as team_name or project_name contained within submission_data.
   */
  search?: string;
  /**
   * Optional poll filter so that admins can view submissions for a
   * specific poll only.
   */
  pollId?: string;
}

/**
 * Get submissions for a hackathon with optional pagination, search, and poll filter.
 * This powers the admin Submissions tab and is intentionally generic so it can
 * be reused by future analytics or exports.
 */
export async function getSubmissionsByHackathon(
  hackathonId: string,
  options: SubmissionQueryOptions = {},
): Promise<{
  submissions: Array<SubmissionRecord & { poll_name?: string | null }>;
  total: number;
  page: number;
  pageSize: number;
}> {
  const page = options.page && options.page > 0 ? options.page : 1;
  const pageSize = options.pageSize && options.pageSize > 0 ? options.pageSize : 10;
  const offset = (page - 1) * pageSize;

  // Build WHERE clause dynamically based on filters.
  const whereClauses: string[] = ['s.hackathon_id = $1'];
  const params: unknown[] = [hackathonId];
  let paramIndex = params.length + 1;

  if (options.pollId) {
    whereClauses.push(`s.poll_id = $${paramIndex++}`);
    params.push(options.pollId);
  }

  if (options.search) {
    // Use a basic ILIKE search against common JSON fields.
    whereClauses.push(
      `(s.submission_data->>'team_name' ILIKE $${paramIndex} OR s.submission_data->>'project_name' ILIKE $${paramIndex})`,
    );
    params.push(`%${options.search}%`);
    paramIndex += 1;
  }

  const whereSql = whereClauses.join(' AND ');

  // Fetch paginated rows with poll name.
  const result = await query<(SubmissionRecord & { poll_name?: string | null })>(
    `SELECT 
       s.*,
       p.name as poll_name
     FROM hackathon_submissions s
     LEFT JOIN polls p ON s.poll_id = p.poll_id
     WHERE ${whereSql}
     ORDER BY s.submitted_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, pageSize, offset],
  );

  // Fetch total count for the same filter set.
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count
     FROM hackathon_submissions s
     WHERE ${whereSql}`,
    params,
  );

  const total = parseInt(countResult.rows[0]?.count || '0', 10);

  const submissions = result.rows.map(row => {
    const parsed = parseSubmission(row);
    return { ...parsed, poll_name: row.poll_name || null };
  });

  return { submissions, total, page, pageSize };
}

/**
 * Get submission by team
 */
export async function getSubmissionByTeam(
  hackathonId: string,
  teamId: string
): Promise<SubmissionRecord | null> {
  const result = await query<SubmissionRecord>(
    'SELECT * FROM hackathon_submissions WHERE hackathon_id = $1 AND team_id = $2',
    [hackathonId, teamId]
  );

  return result.rows[0] ? parseSubmission(result.rows[0]) : null;
}

/**
 * Get submission by submitted_by identifier
 */
export async function getSubmissionByUser(
  hackathonId: string,
  submittedBy: string
): Promise<SubmissionRecord | null> {
  const result = await query<SubmissionRecord>(
    'SELECT * FROM hackathon_submissions WHERE hackathon_id = $1 AND submitted_by = $2',
    [hackathonId, submittedBy]
  );

  return result.rows[0] ? parseSubmission(result.rows[0]) : null;
}

/**
 * Update a submission (only if not locked)
 */
export async function updateSubmission(
  submissionId: string,
  submissionData: SubmissionData,
  fileReferences?: FileReference[]
): Promise<SubmissionRecord> {
  const submissionHash = createSubmissionHash(submissionData);

  const fields: string[] = [
    'submission_data = $1',
    'submission_hash = $2',
    'updated_at = CURRENT_TIMESTAMP',
  ];
  const values: any[] = [JSON.stringify(submissionData), submissionHash];
  let paramIndex = 3;

  if (fileReferences !== undefined) {
    fields.push(`file_references = $${paramIndex++}`);
    values.push(JSON.stringify(fileReferences));
  }

  values.push(submissionId);

  const result = await query<SubmissionRecord>(
    `UPDATE hackathon_submissions 
     SET ${fields.join(', ')} 
     WHERE submission_id = $${paramIndex} AND is_locked = false
     RETURNING *`,
    values
  );

  if (!result.rows[0]) {
    throw new Error('Submission not found or is locked');
  }

  return parseSubmission(result.rows[0]);
}

/**
 * Lock all submissions for a hackathon (after deadline)
 */
export async function lockSubmissions(hackathonId: string): Promise<number> {
  const result = await query(
    'UPDATE hackathon_submissions SET is_locked = true WHERE hackathon_id = $1 AND is_locked = false',
    [hackathonId]
  );

  return result.rowCount || 0;
}

/**
 * Lock a specific submission
 */
export async function lockSubmission(submissionId: string): Promise<void> {
  await query(
    'UPDATE hackathon_submissions SET is_locked = true WHERE submission_id = $1',
    [submissionId]
  );
}

/**
 * Verify submission hash integrity
 */
export async function verifySubmissionHash(submissionId: string): Promise<boolean> {
  const submission = await getSubmissionById(submissionId);
  if (!submission) {
    return false;
  }

  const recomputedHash = createSubmissionHash(submission.submission_data);
  return recomputedHash === submission.submission_hash;
}

/**
 * Get submission count for a hackathon
 */
export async function getSubmissionCount(hackathonId: string): Promise<number> {
  const result = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM hackathon_submissions WHERE hackathon_id = $1',
    [hackathonId]
  );

  return parseInt(result.rows[0]?.count || '0', 10);
}

/**
 * Get locked submission count for a hackathon
 */
export async function getLockedSubmissionCount(hackathonId: string): Promise<number> {
  const result = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM hackathon_submissions WHERE hackathon_id = $1 AND is_locked = true',
    [hackathonId]
  );

  return parseInt(result.rows[0]?.count || '0', 10);
}

/**
 * Delete a submission (only if not locked)
 */
export async function deleteSubmission(submissionId: string): Promise<void> {
  const result = await query(
    'DELETE FROM hackathon_submissions WHERE submission_id = $1 AND is_locked = false',
    [submissionId]
  );

  if (result.rowCount === 0) {
    throw new Error('Submission not found or is locked');
  }
}

/**
 * Find team by team lead email from team_formation submissions
 * This function searches for a team where the given email is the team lead
 * 
 * @param hackathonId - The hackathon ID
 * @param teamLeadEmail - The email of the team lead
 * @returns The team name if found, null otherwise
 */
export async function findTeamByTeamLead(
  hackathonId: string,
  teamLeadEmail: string
): Promise<{ teamName: string; submissionId: string } | null> {
  // Query team_formation submissions to find the team where this email is the team lead
  const result = await query<{
    team_name: string;
    submission_id: string;
  }>(
    `SELECT 
       s.submission_data->>'team_name' as team_name,
       s.submission_id
     FROM hackathon_submissions s
     WHERE s.hackathon_id = $1
       AND s.submission_data->>'team_name' IS NOT NULL
       AND EXISTS (
         SELECT 1
         FROM jsonb_array_elements(s.submission_data->'team_members') AS member
         WHERE member->>'email' = $2
           AND (member->>'isLead')::boolean = true
       )
     ORDER BY s.submitted_at DESC
     LIMIT 1`,
    [hackathonId, teamLeadEmail]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return {
    teamName: result.rows[0].team_name,
    submissionId: result.rows[0].submission_id,
  };
}

/**
 * Verify if a user is a team lead for any team in the hackathon
 * 
 * @param hackathonId - The hackathon ID
 * @param userEmail - The email of the user to check
 * @returns True if the user is a team lead, false otherwise
 */
export async function isTeamLead(
  hackathonId: string,
  userEmail: string
): Promise<boolean> {
  const team = await findTeamByTeamLead(hackathonId, userEmail);
  return team !== null;
}

/**
 * Parse submission record (handle JSONB fields)
 */
function parseSubmission(record: SubmissionRecord): SubmissionRecord {
  if (typeof record.submission_data === 'string') {
    record.submission_data = JSON.parse(record.submission_data);
  }
  if (typeof record.file_references === 'string') {
    record.file_references = JSON.parse(record.file_references);
  }
  return record;
}
