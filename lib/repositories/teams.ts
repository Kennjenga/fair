import { query } from '@/lib/db';
import type { Team, TeamMetadata } from '@/types/team';
import type { QueryRow } from '@/types/database';

/**
 * Team database record
 */
export interface TeamRecord extends QueryRow {
  team_id: string;
  team_name: string;
  poll_id: string;
  metadata: TeamMetadata | null;
  project_name: string | null;
  project_description: string | null;
  pitch: string | null;
  live_site_url: string | null;
  github_url: string | null;
  created_at: Date;
}

/**
 * Create a team
 */
export async function createTeam(
  pollId: string,
  teamName: string,
  metadata?: TeamMetadata,
  projectInfo?: {
    projectName?: string;
    projectDescription?: string;
    pitch?: string;
    liveSiteUrl?: string;
    githubUrl?: string;
  }
): Promise<TeamRecord> {
  const result = await query<{
    team_id: string;
    team_name: string;
    poll_id: string;
    metadata: string | TeamMetadata | null;
    project_name: string | null;
    project_description: string | null;
    pitch: string | null;
    live_site_url: string | null;
    github_url: string | null;
    created_at: Date;
  }>(
    `INSERT INTO teams (poll_id, team_name, metadata, project_name, project_description, pitch, live_site_url, github_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      pollId,
      teamName,
      metadata ? JSON.stringify(metadata) : null,
      projectInfo?.projectName || null,
      projectInfo?.projectDescription || null,
      projectInfo?.pitch || null,
      projectInfo?.liveSiteUrl || null,
      projectInfo?.githubUrl || null,
    ]
  );
  
  const row = result.rows[0];
  return {
    ...row,
    metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : null,
  };
}

/**
 * Get team by ID
 */
export async function getTeamById(teamId: string): Promise<TeamRecord | null> {
  const result = await query<{
    team_id: string;
    team_name: string;
    poll_id: string;
    metadata: string | TeamMetadata | null;
    project_name: string | null;
    project_description: string | null;
    pitch: string | null;
    live_site_url: string | null;
    github_url: string | null;
    created_at: Date;
  }>(
    'SELECT * FROM teams WHERE team_id = $1',
    [teamId]
  );
  
  if (!result.rows[0]) {
    return null;
  }
  
  const row = result.rows[0];
  return {
    ...row,
    metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
  };
}

/**
 * Get team by name and poll ID
 */
export async function getTeamByName(
  pollId: string,
  teamName: string
): Promise<TeamRecord | null> {
  const result = await query<{
    team_id: string;
    team_name: string;
    poll_id: string;
    metadata: string | TeamMetadata | null;
    project_name: string | null;
    project_description: string | null;
    pitch: string | null;
    live_site_url: string | null;
    github_url: string | null;
    created_at: Date;
  }>(
    'SELECT * FROM teams WHERE poll_id = $1 AND team_name = $2',
    [pollId, teamName]
  );
  
  if (!result.rows[0]) {
    return null;
  }
  
  const row = result.rows[0];
  return {
    ...row,
    metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
  };
}

/**
 * Get teams by poll ID
 */
export async function getTeamsByPoll(pollId: string): Promise<TeamRecord[]> {
  const result = await query<{
    team_id: string;
    team_name: string;
    poll_id: string;
    metadata: string | TeamMetadata | null;
    project_name: string | null;
    project_description: string | null;
    pitch: string | null;
    live_site_url: string | null;
    github_url: string | null;
    created_at: Date;
  }>(
    'SELECT * FROM teams WHERE poll_id = $1 ORDER BY team_name ASC',
    [pollId]
  );
  
  return result.rows.map(row => ({
    ...row,
    metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
  }));
}


/**
 * Bulk create teams
 */
export async function bulkCreateTeams(
  pollId: string,
  teams: Array<{ teamName: string; metadata?: TeamMetadata }>
): Promise<TeamRecord[]> {
  const createdTeams: TeamRecord[] = [];
  
  for (const team of teams) {
    try {
      const created = await createTeam(pollId, team.teamName, team.metadata);
      createdTeams.push(created);
    } catch (error) {
      // Skip duplicate teams (unique constraint violation)
      if (error instanceof Error && error.message.includes('unique')) {
        continue;
      }
      throw error;
    }
  }
  
  return createdTeams;
}

/**
 * Update team
 */
export async function updateTeam(
  teamId: string,
  updates: {
    teamName?: string;
    metadata?: Partial<TeamMetadata>;
    projectName?: string;
    projectDescription?: string;
    pitch?: string;
    liveSiteUrl?: string;
    githubUrl?: string;
  }
): Promise<TeamRecord> {
  const updateFields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  // Get existing team data if we need to merge metadata
  let existing: TeamRecord | null = null;
  if (updates.metadata !== undefined || updateFields.length === 0) {
    existing = await getTeamById(teamId);
    if (!existing) {
      throw new Error('Team not found');
    }
  }

  if (updates.teamName !== undefined) {
    updateFields.push(`team_name = $${paramIndex}`);
    values.push(updates.teamName);
    paramIndex++;
  }

  if (updates.metadata !== undefined) {
    // Merge with existing metadata if it exists
    const existingMetadata = existing?.metadata || {};
    const mergedMetadata = { ...existingMetadata, ...updates.metadata };
    
    updateFields.push(`metadata = $${paramIndex}`);
    values.push(JSON.stringify(mergedMetadata));
    paramIndex++;
  }

  // Update project information fields
  if (updates.projectName !== undefined) {
    updateFields.push(`project_name = $${paramIndex}`);
    values.push(updates.projectName || null);
    paramIndex++;
  }

  if (updates.projectDescription !== undefined) {
    updateFields.push(`project_description = $${paramIndex}`);
    values.push(updates.projectDescription || null);
    paramIndex++;
  }

  if (updates.pitch !== undefined) {
    updateFields.push(`pitch = $${paramIndex}`);
    values.push(updates.pitch || null);
    paramIndex++;
  }

  if (updates.liveSiteUrl !== undefined) {
    updateFields.push(`live_site_url = $${paramIndex}`);
    values.push(updates.liveSiteUrl || null);
    paramIndex++;
  }

  if (updates.githubUrl !== undefined) {
    updateFields.push(`github_url = $${paramIndex}`);
    values.push(updates.githubUrl || null);
    paramIndex++;
  }

  if (updateFields.length === 0) {
    return existing!;
  }

  values.push(teamId);

  const result = await query<{
    team_id: string;
    team_name: string;
    poll_id: string;
    metadata: string | TeamMetadata | null;
    project_name: string | null;
    project_description: string | null;
    pitch: string | null;
    live_site_url: string | null;
    github_url: string | null;
    created_at: Date;
  }>(
    `UPDATE teams SET ${updateFields.join(', ')} WHERE team_id = $${paramIndex} RETURNING *`,
    values
  );

  const row = result.rows[0];
  return {
    ...row,
    metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
  };
}

/**
 * Delete team
 */
export async function deleteTeam(teamId: string): Promise<void> {
  await query('DELETE FROM teams WHERE team_id = $1', [teamId]);
}

/**
 * Migrate (duplicate) teams from one poll to another
 * This creates duplicate teams in the target poll and duplicates their voters (tokens)
 * Teams and voters remain in the source poll and are also added to the target poll
 * @param sourcePollId - Source poll ID
 * @param targetPollId - Target poll ID
 * @param teamIds - Array of team IDs to migrate (if empty, migrates all teams)
 * @returns Array of duplicated team records in the target poll
 */
export async function migrateTeams(
  sourcePollId: string,
  targetPollId: string,
  teamIds?: string[]
): Promise<TeamRecord[]> {
  // Verify both polls exist and belong to the same hackathon
  const { getPollById } = await import('@/lib/repositories/polls');
  const sourcePoll = await getPollById(sourcePollId);
  const targetPoll = await getPollById(targetPollId);
  
  if (!sourcePoll || !targetPoll) {
    throw new Error('Source or target poll not found');
  }
  
  if (sourcePoll.hackathon_id !== targetPoll.hackathon_id) {
    throw new Error('Cannot migrate teams between polls in different hackathons');
  }
  
  // Get teams from source poll
  const sourceTeams = await getTeamsByPoll(sourcePollId);
  
  // Filter teams if specific IDs provided
  const teamsToMigrate = teamIds && teamIds.length > 0
    ? sourceTeams.filter(t => teamIds.includes(t.team_id))
    : sourceTeams;
  
  if (teamsToMigrate.length === 0) {
    throw new Error('No teams found to migrate');
  }
  
  // Get tokens (voters) for the teams being migrated
  const { getTokensByPoll } = await import('@/lib/repositories/tokens');
  const sourceTokens = await getTokensByPoll(sourcePollId);
  const teamIdsSet = new Set(teamsToMigrate.map(t => t.team_id));
  const tokensToMigrate = sourceTokens.filter(t => teamIdsSet.has(t.team_id));
  
  // Duplicate teams in target poll
  const duplicatedTeams: TeamRecord[] = [];
  
  for (const team of teamsToMigrate) {
    try {
      // Create duplicate team in target poll
      const duplicatedTeam = await createTeam(
        targetPollId,
        team.team_name,
        team.metadata || undefined,
        {
          projectName: team.project_name || undefined,
          projectDescription: team.project_description || undefined,
          pitch: team.pitch || undefined,
          liveSiteUrl: team.live_site_url || undefined,
          githubUrl: team.github_url || undefined,
        }
      );
      duplicatedTeams.push(duplicatedTeam);
      
      // Duplicate tokens (voters) for this team
      const teamTokens = tokensToMigrate.filter(t => t.team_id === team.team_id);
      const { bulkCreateTokens } = await import('@/lib/repositories/tokens');
      
      if (teamTokens.length > 0) {
        // Create new tokens for voters in the target poll
        await bulkCreateTokens(
          targetPollId,
          teamTokens.map(t => ({
            email: t.email,
            teamId: duplicatedTeam.team_id, // Use the new team ID
          }))
        );
      }
    } catch (error) {
      // If team name already exists in target poll, skip it
      if (error instanceof Error && error.message.includes('unique')) {
        console.warn(`Team "${team.team_name}" already exists in target poll, skipping`);
        continue;
      }
      throw error;
    }
  }
  
  return duplicatedTeams;
}

