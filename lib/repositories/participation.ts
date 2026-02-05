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
 * Integrity status is determined by integrity_commitments: verifiable if at least one row
 * exists for the hackathon_id, otherwise pending. Used consistently in getDecisionsCreated
 * and getDecisionsParticipated for dashboard metrics.
 */

/**
 * Get decisions created by a user (organizer role)
 * Includes ALL decision types: hackathons, polls, etc.
 *
 * Query Strategy:
 * 1. Get hackathons where created_by = adminId (direct ownership)
 * 2. Get polls where created_by = adminId (direct ownership)
 * 3. Get hackathons where user has organizer role in user_participation table
 *    (handles cases where participation was tracked by email or adminId)
 * 
 * Note: user_identifier in user_participation can be stored as either:
 * - The admin's email address (when tracked via email)
 * - The admin's adminId UUID (when tracked via adminId)
 * 
 * This function checks both to ensure all decisions are found.
 */
export async function getDecisionsCreated(adminId: string): Promise<DecisionSummary[]> {
  console.log('[getDecisionsCreated] Starting query for adminId:', adminId);
  
  // First, get the admin's email to check both adminId and email in user_participation
  // This ensures we find all participations regardless of how user_identifier was stored
  const adminResult = await query<{ email: string }>(
    'SELECT email FROM admins WHERE admin_id = $1',
    [adminId]
  );
  const adminEmail = adminResult.rows[0]?.email || null;
  console.log('[getDecisionsCreated] Admin email:', adminEmail);

  // First, let's verify the adminId exists and check what hackathons exist
  const testQuery = await query<any>(
    'SELECT COUNT(*) as total FROM hackathons WHERE created_by = $1',
    [adminId]
  );
  console.log('[getDecisionsCreated] Total hackathons with created_by = adminId:', testQuery.rows[0]?.total);

  // Get hackathons created by user (using created_by = adminId)
  const hackathonsResult = await query<any>(
    `SELECT 
       h.hackathon_id,
       h.name as hackathon_name,
       h.description,
       COALESCE(h.status, 'draft') as status,
       h.start_date,
       h.end_date,
       h.updated_at as last_activity,
       h.created_by,
       h.created_at,
       t.governance_model,
       t.name as template_name,
       'organizer' as role,
       h.created_at as participated_at,
       'hackathon' as decision_category,
       CASE 
         WHEN EXISTS (SELECT 1 FROM integrity_commitments ic WHERE ic.hackathon_id = h.hackathon_id) 
         THEN 'verifiable'
         ELSE 'pending'
       END as integrity_status,
       (SELECT COUNT(DISTINCT user_identifier) FROM user_participation WHERE hackathon_id = h.hackathon_id) as participation_count
     FROM hackathons h
     LEFT JOIN hackathon_templates t ON h.template_id = t.template_id
     WHERE h.created_by = $1
     ORDER BY h.updated_at DESC`,
    [adminId]
  );
  console.log('[getDecisionsCreated] Hackathons found:', hackathonsResult.rows.length);
  if (hackathonsResult.rows.length > 0) {
    console.log('[getDecisionsCreated] Sample hackathon:', JSON.stringify(hackathonsResult.rows[0], null, 2));
  }

  // Note: Polls are excluded from "My Decisions" - only hackathons (decision categories) are shown

  // Get hackathons where user has organizer role in user_participation (but didn't create)
  // Check both adminId and email in user_identifier
  // Note: We need to handle parameter indexing correctly
  let organizerQuery: string;
  let organizerParams: any[];
  
  if (adminEmail) {
    organizerQuery = `SELECT 
       h.hackathon_id,
       h.name as hackathon_name,
       h.description,
       COALESCE(h.status, 'draft') as status,
       h.start_date,
       h.end_date,
       h.updated_at as last_activity,
       h.created_by,
       h.created_at,
       t.governance_model,
       t.name as template_name,
       up.participation_role as role,
       up.participated_at,
       'hackathon' as decision_category,
       CASE 
         WHEN EXISTS (SELECT 1 FROM integrity_commitments ic WHERE ic.hackathon_id = h.hackathon_id) 
         THEN 'verifiable'
         ELSE 'pending'
       END as integrity_status,
       (SELECT COUNT(DISTINCT user_identifier) FROM user_participation WHERE hackathon_id = h.hackathon_id) as participation_count
     FROM hackathons h
     LEFT JOIN hackathon_templates t ON h.template_id = t.template_id
     INNER JOIN user_participation up ON h.hackathon_id = up.hackathon_id
     WHERE (up.user_identifier = $1 OR up.user_identifier = $2)
       AND up.participation_role = 'organizer'
       AND h.created_by::text != $1::text
     ORDER BY h.updated_at DESC`;
    organizerParams = [adminId, adminEmail];
  } else {
    organizerQuery = `SELECT 
       h.hackathon_id,
       h.name as hackathon_name,
       h.description,
       COALESCE(h.status, 'draft') as status,
       h.start_date,
       h.end_date,
       h.updated_at as last_activity,
       h.created_by,
       h.created_at,
       t.governance_model,
       t.name as template_name,
       up.participation_role as role,
       up.participated_at,
       'hackathon' as decision_category,
       CASE 
         WHEN EXISTS (SELECT 1 FROM integrity_commitments ic WHERE ic.hackathon_id = h.hackathon_id) 
         THEN 'verifiable'
         ELSE 'pending'
       END as integrity_status,
       (SELECT COUNT(DISTINCT user_identifier) FROM user_participation WHERE hackathon_id = h.hackathon_id) as participation_count
     FROM hackathons h
     LEFT JOIN hackathon_templates t ON h.template_id = t.template_id
     INNER JOIN user_participation up ON h.hackathon_id = up.hackathon_id
     WHERE up.user_identifier = $1
       AND up.participation_role = 'organizer'
       AND h.created_by::text != $1::text
     ORDER BY h.updated_at DESC`;
    organizerParams = [adminId];
  }
  
  const organizerResult = await query<any>(organizerQuery, organizerParams);
  console.log('[getDecisionsCreated] Organizer participations found:', organizerResult.rows.length);

  // Combine all results (excluding polls - only hackathons/decision categories)
  const allRows = [...hackathonsResult.rows, ...organizerResult.rows];
  console.log('[getDecisionsCreated] Total rows before deduplication:', allRows.length);
  
  // Remove duplicates by hackathon_id/poll_id
  const uniqueRows = Array.from(
    new Map(allRows.map(row => [row.hackathon_id, row])).values()
  );
  console.log('[getDecisionsCreated] Unique rows after deduplication:', uniqueRows.length);

  const mapped = uniqueRows.map((row) => {
    // integrity_status from SQL: verifiable if integrity_commitments has row(s) for this hackathon
    const hasCommitments = row.integrity_status === 'verifiable';
    const isFinalized = row.status === 'finalized';
    const canManage = row.created_by === adminId && !isFinalized;
    const canVerify = true; // Always available
    
    // Determine integrity state
    const integrityState: 'anchored' | 'pending' = hasCommitments ? 'anchored' : 'pending';
    
    // Map governance model to decision type
    const decisionTypeMap: Record<string, string> = {
      'centralized': 'Organizer-Led',
      'community_led': 'Community',
      'hybrid': 'Hybrid',
      'dao_managed': 'DAO',
      'sponsor_driven': 'Organizer-Led',
      'rolling': 'Community',
      'pilot': 'Hybrid',
    };
    const decisionType = decisionTypeMap[row.governance_model] || 'Organizer-Led';
    
    // Locked rules - check if hackathon is live/closed (rules are locked after launch)
    const lockedRules: string[] = [];
    if (row.status === 'live' || row.status === 'closed' || row.status === 'finalized') {
      lockedRules.push('governance_rules', 'voting_rules');
    }

    return {
      hackathonId: row.hackathon_id,
      hackathonName: row.hackathon_name,
      description: row.description,
      status: row.status || 'draft',
      governanceModel: row.governance_model,
      templateName: row.template_name,
      role: row.role || 'organizer',
      participatedAt: row.participated_at,
      integrityStatus: row.integrity_status,
      integrityState,
      lastActivity: row.last_activity,
      startDate: row.start_date,
      endDate: row.end_date,
      participationCount: parseInt(row.participation_count || '0', 10),
      canManage,
      canVerify,
      lockedRules,
      decisionType,
      category: row.decision_category === 'poll' ? 'Poll' : (row.template_name || 'Custom'),
    };
  });
  
  console.log('[getDecisionsCreated] Successfully mapped', mapped.length, 'decisions');
  return mapped;
}

/**
 * Get decisions a user participated in (any role except organizer)
 *
 * Query Strategy - Checks all participation methods so "Participated In" is complete:
 * 1. user_participation table (explicit participation tracking)
 * 2. tokens table (user received a voting token by email)
 * 3. votes table (user voted as judge via judge_email)
 * 4. submissions table (user submitted something via submitted_by email)
 * 5. poll_judges table (user is listed as judge on a poll, even if not yet voted)
 *
 * Note: user_identifier in user_participation can be stored as either:
 * - The user's email address (most common for participants)
 * - The admin's adminId UUID (if they participated as an admin)
 */
export async function getDecisionsParticipated(email: string): Promise<DecisionSummary[]> {
  console.log('[getDecisionsParticipated] Starting query for email:', email);

  // Get adminId if this email belongs to an admin (for user_participation lookup by email or adminId)
  const adminResult = await query<{ admin_id: string }>(
    'SELECT admin_id FROM admins WHERE email = $1',
    [email]
  );
  const adminId = adminResult.rows[0]?.admin_id || null;
  console.log('[getDecisionsParticipated] AdminId found:', adminId);

  const userIdentifiers = adminId ? [email, adminId] : [email];
  const userIdentifierCondition = adminId
    ? `(up.user_identifier = $1 OR up.user_identifier = $2)`
    : `up.user_identifier = $1`;

  // Query all participation methods so user can view every decision they participated in
  const result = await query<any>(
    `SELECT DISTINCT
       h.hackathon_id,
       h.name as hackathon_name,
       h.description,
       COALESCE(h.status, 'draft') as status,
       h.start_date,
       h.end_date,
       h.updated_at as last_activity,
       t.governance_model,
       t.name as template_name,
       COALESCE(
         up.participation_role,
         CASE
           WHEN tok.token_id IS NOT NULL THEN 'voter'
           WHEN v.judge_email IS NOT NULL OR pj.poll_id IS NOT NULL THEN 'judge'
           WHEN sub.submission_id IS NOT NULL THEN 'participant'
           ELSE 'participant'
         END
       ) as role,
       COALESCE(
         up.participated_at,
         tok.issued_at,
         v.timestamp,
         sub.submitted_at,
         pj.created_at
       ) as participated_at,
       CASE
         WHEN EXISTS (SELECT 1 FROM integrity_commitments ic WHERE ic.hackathon_id = h.hackathon_id)
         THEN 'verifiable'
         ELSE 'pending'
       END as integrity_status,
       (SELECT COUNT(DISTINCT user_identifier) FROM user_participation WHERE hackathon_id = h.hackathon_id) as participation_count
     FROM hackathons h
     LEFT JOIN hackathon_templates t ON h.template_id = t.template_id

     -- Method 1: user_participation table (explicit tracking)
     LEFT JOIN user_participation up ON h.hackathon_id = up.hackathon_id
       AND ${userIdentifierCondition}
       AND up.participation_role != 'organizer'

     -- Method 2: tokens table (voting tokens issued to email) - via polls
     LEFT JOIN polls p_tok ON p_tok.hackathon_id = h.hackathon_id
     LEFT JOIN tokens tok ON tok.poll_id = p_tok.poll_id AND tok.email = $1

     -- Method 3: votes table (judge votes via judge_email) - via polls
     LEFT JOIN polls p_vote ON p_vote.hackathon_id = h.hackathon_id
     LEFT JOIN votes v ON v.poll_id = p_vote.poll_id AND v.judge_email = $1

     -- Method 4: submissions table (submissions via submitted_by email)
     LEFT JOIN hackathon_submissions sub ON sub.hackathon_id = h.hackathon_id
       AND sub.submitted_by = $1

     -- Method 5: poll_judges table (listed as judge on a poll, even before voting)
     LEFT JOIN polls p_judge ON p_judge.hackathon_id = h.hackathon_id
     LEFT JOIN poll_judges pj ON pj.poll_id = p_judge.poll_id AND pj.email = $1

     WHERE (
       up.participation_id IS NOT NULL
       OR tok.token_id IS NOT NULL
       OR v.vote_id IS NOT NULL
       OR sub.submission_id IS NOT NULL
       OR pj.poll_id IS NOT NULL
     )
     ORDER BY h.updated_at DESC`,
    userIdentifiers
  );
  
  console.log('[getDecisionsParticipated] Raw rows before deduplication:', result.rows.length);

  // Deduplicate by hackathon_id: multiple participation methods (token, vote, submission)
  // can produce multiple rows per hackathon; we need one row per decision for accurate counts
  const uniqueRows = Array.from(
    new Map(result.rows.map((row) => [row.hackathon_id, row])).values()
  );
  console.log('[getDecisionsParticipated] Unique participations after deduplication:', uniqueRows.length);

  if (uniqueRows.length > 0) {
    console.log('[getDecisionsParticipated] Sample participation:', JSON.stringify(uniqueRows[0], null, 2));
  }

  const mapped = uniqueRows.map((row) => {
    // integrity_status comes from EXISTS on integrity_commitments (verifiable = has row(s), else pending)
    const hasCommitments = row.integrity_status === 'verifiable';
    const isFinalized = row.status === 'finalized';
    
    // Participants cannot manage
    const canManage = false;
    const canVerify = true; // Always available for verification
    
    // Determine outcome state
    const outcomeState: 'verified' | 'published' | undefined =
      isFinalized && hasCommitments ? 'verified' : isFinalized ? 'published' : undefined;
    
    // Determine integrity state
    const integrityState: 'anchored' | 'pending' = hasCommitments ? 'anchored' : 'pending';
    
    // Map governance model to decision type
    const decisionTypeMap: Record<string, string> = {
      'centralized': 'Organizer-Led',
      'community_led': 'Community',
      'hybrid': 'Hybrid',
      'dao_managed': 'DAO',
      'sponsor_driven': 'Organizer-Led',
      'rolling': 'Community',
      'pilot': 'Hybrid',
    };
    const decisionType = decisionTypeMap[row.governance_model] || 'Organizer-Led';

    return {
      hackathonId: row.hackathon_id,
      hackathonName: row.hackathon_name,
      description: row.description,
      status: row.status || 'draft',
      governanceModel: row.governance_model,
      templateName: row.template_name,
      role: row.role,
      participatedAt: row.participated_at,
      integrityStatus: row.integrity_status,
      integrityState,
      lastActivity: row.last_activity,
      startDate: row.start_date,
      endDate: row.end_date,
      participationCount: parseInt(row.participation_count || '0', 10),
      canManage,
      canVerify,
      lockedRules: [], // Participants don't see locked rules
      decisionType,
      category: row.template_name || 'Custom',
      outcomeState,
    };
  });
  
  console.log('[getDecisionsParticipated] Successfully mapped', mapped.length, 'decisions');
  return mapped;
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
