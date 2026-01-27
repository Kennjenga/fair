import { query } from '@/lib/db';
import type { UserParticipation, ParticipationRole, DecisionSummary } from '@/types/participation';
import type { QueryRow } from '@/types/database';

/**
 * Participation database record
 */
export interface ParticipationRecord extends QueryRow {
  participation_id: string;
  user_identifier: string;
  hackathon_id: string;
  participation_role: ParticipationRole;
  participated_at: Date;
}

/**
 * Track user participation in a hackathon
 */
export async function trackParticipation(
  userIdentifier: string,
  hackathonId: string,
  role: ParticipationRole
): Promise<ParticipationRecord> {
  // Use INSERT ... ON CONFLICT to handle duplicates
  const result = await query<ParticipationRecord>(
    `INSERT INTO user_participation (user_identifier, hackathon_id, participation_role)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_identifier, hackathon_id, participation_role) 
     DO UPDATE SET participated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [userIdentifier, hackathonId, role]
  );

  return result.rows[0];
}

/**
 * Get all participation records for a user
 */
export async function getUserParticipation(userIdentifier: string): Promise<ParticipationRecord[]> {
  const result = await query<ParticipationRecord>(
    'SELECT * FROM user_participation WHERE user_identifier = $1 ORDER BY participated_at DESC',
    [userIdentifier]
  );

  return result.rows;
}

/**
 * Get decisions created by a user (organizer role)
 */
export async function getDecisionsCreated(userIdentifier: string): Promise<DecisionSummary[]> {
  const result = await query<any>(
    `SELECT 
       h.hackathon_id,
       h.name as hackathon_name,
       h.description,
       h.status,
       h.start_date,
       h.end_date,
       h.updated_at as last_activity,
       t.governance_model,
       t.name as template_name,
       up.participation_role as role,
       up.participated_at,
       CASE 
         WHEN EXISTS (SELECT 1 FROM integrity_commitments ic WHERE ic.hackathon_id = h.hackathon_id) 
         THEN 'verifiable'
         ELSE 'pending'
       END as integrity_status
     FROM hackathons h
     LEFT JOIN hackathon_templates t ON h.template_id = t.template_id
     INNER JOIN user_participation up ON h.hackathon_id = up.hackathon_id
     WHERE up.user_identifier = $1 AND up.participation_role = 'organizer'
     ORDER BY h.updated_at DESC`,
    [userIdentifier]
  );

  return result.rows.map((row) => ({
    hackathonId: row.hackathon_id,
    hackathonName: row.hackathon_name,
    description: row.description,
    status: row.status,
    governanceModel: row.governance_model,
    templateName: row.template_name,
    role: row.role,
    participatedAt: row.participated_at,
    integrityStatus: row.integrity_status,
    lastActivity: row.last_activity,
    startDate: row.start_date,
    endDate: row.end_date,
  }));
}

/**
 * Get decisions a user participated in (any role except organizer)
 */
export async function getDecisionsParticipated(userIdentifier: string): Promise<DecisionSummary[]> {
  const result = await query<any>(
    `SELECT 
       h.hackathon_id,
       h.name as hackathon_name,
       h.description,
       h.status,
       h.start_date,
       h.end_date,
       h.updated_at as last_activity,
       t.governance_model,
       t.name as template_name,
       up.participation_role as role,
       up.participated_at,
       CASE 
         WHEN EXISTS (SELECT 1 FROM integrity_commitments ic WHERE ic.hackathon_id = h.hackathon_id) 
         THEN 'verifiable'
         ELSE 'pending'
       END as integrity_status
     FROM hackathons h
     LEFT JOIN hackathon_templates t ON h.template_id = t.template_id
     INNER JOIN user_participation up ON h.hackathon_id = up.hackathon_id
     WHERE up.user_identifier = $1 AND up.participation_role != 'organizer'
     ORDER BY h.updated_at DESC`,
    [userIdentifier]
  );

  return result.rows.map((row) => ({
    hackathonId: row.hackathon_id,
    hackathonName: row.hackathon_name,
    description: row.description,
    status: row.status,
    governanceModel: row.governance_model,
    templateName: row.template_name,
    role: row.role,
    participatedAt: row.participated_at,
    integrityStatus: row.integrity_status,
    lastActivity: row.last_activity,
    startDate: row.start_date,
    endDate: row.end_date,
  }));
}

/**
 * Get user's role in a specific hackathon
 */
export async function getUserRole(
  userIdentifier: string,
  hackathonId: string
): Promise<ParticipationRole | null> {
  const result = await query<ParticipationRecord>(
    `SELECT * FROM user_participation 
     WHERE user_identifier = $1 AND hackathon_id = $2
     ORDER BY 
       CASE participation_role
         WHEN 'organizer' THEN 1
         WHEN 'judge' THEN 2
         WHEN 'participant' THEN 3
         WHEN 'voter' THEN 4
       END
     LIMIT 1`,
    [userIdentifier, hackathonId]
  );

  return result.rows[0]?.participation_role || null;
}

/**
 * Get all roles for a user in a hackathon
 */
export async function getUserRoles(
  userIdentifier: string,
  hackathonId: string
): Promise<ParticipationRole[]> {
  const result = await query<ParticipationRecord>(
    'SELECT participation_role FROM user_participation WHERE user_identifier = $1 AND hackathon_id = $2',
    [userIdentifier, hackathonId]
  );

  return result.rows.map((row) => row.participation_role);
}

/**
 * Check if user has a specific role in a hackathon
 */
export async function hasRole(
  userIdentifier: string,
  hackathonId: string,
  role: ParticipationRole
): Promise<boolean> {
  const result = await query<{ exists: boolean }>(
    `SELECT EXISTS(
       SELECT 1 FROM user_participation 
       WHERE user_identifier = $1 AND hackathon_id = $2 AND participation_role = $3
     ) as exists`,
    [userIdentifier, hackathonId, role]
  );

  return result.rows[0]?.exists || false;
}

/**
 * Get participation count for a hackathon by role
 */
export async function getParticipationCountByRole(
  hackathonId: string,
  role: ParticipationRole
): Promise<number> {
  const result = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM user_participation WHERE hackathon_id = $1 AND participation_role = $2',
    [hackathonId, role]
  );

  return parseInt(result.rows[0]?.count || '0', 10);
}

/**
 * Get total participation count for a hackathon
 */
export async function getTotalParticipationCount(hackathonId: string): Promise<number> {
  const result = await query<{ count: string }>(
    'SELECT COUNT(DISTINCT user_identifier) as count FROM user_participation WHERE hackathon_id = $1',
    [hackathonId]
  );

  return parseInt(result.rows[0]?.count || '0', 10);
}

/**
 * Remove participation record
 */
export async function removeParticipation(
  userIdentifier: string,
  hackathonId: string,
  role: ParticipationRole
): Promise<void> {
  await query(
    'DELETE FROM user_participation WHERE user_identifier = $1 AND hackathon_id = $2 AND participation_role = $3',
    [userIdentifier, hackathonId, role]
  );
}
