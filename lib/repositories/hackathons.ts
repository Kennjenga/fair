import { query } from '@/lib/db';
import type { Hackathon } from '@/types/hackathon';
import type { QueryRow } from '@/types/database';

/**
 * Hackathon database record
 */
export interface HackathonRecord extends QueryRow {
  hackathon_id: string;
  name: string;
  description: string | null;
  start_date: Date | null;
  end_date: Date | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Create a new hackathon
 */
export async function createHackathon(
  name: string,
  createdBy: string,
  description?: string,
  startDate?: Date,
  endDate?: Date
): Promise<HackathonRecord> {
  const result = await query<HackathonRecord>(
    `INSERT INTO hackathons (name, description, start_date, end_date, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, description || null, startDate || null, endDate || null, createdBy]
  );
  
  return result.rows[0];
}

/**
 * Get hackathon by ID
 */
export async function getHackathonById(hackathonId: string): Promise<HackathonRecord | null> {
  const result = await query<HackathonRecord>(
    'SELECT * FROM hackathons WHERE hackathon_id = $1',
    [hackathonId]
  );
  
  return result.rows[0] || null;
}

/**
 * Get all hackathons created by an admin
 */
export async function getHackathonsByAdmin(adminId: string): Promise<HackathonRecord[]> {
  const result = await query<HackathonRecord>(
    'SELECT * FROM hackathons WHERE created_by = $1 ORDER BY created_at DESC',
    [adminId]
  );
  
  return result.rows;
}

/**
 * Get all hackathons (for super admin)
 */
export async function getAllHackathons(): Promise<HackathonRecord[]> {
  const result = await query<HackathonRecord>(
    'SELECT * FROM hackathons ORDER BY created_at DESC'
  );
  
  return result.rows;
}

/**
 * Update hackathon
 */
export async function updateHackathon(
  hackathonId: string,
  updates: {
    name?: string;
    description?: string;
    startDate?: Date | null;
    endDate?: Date | null;
  }
): Promise<HackathonRecord> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(updates.description);
  }
  if (updates.startDate !== undefined) {
    fields.push(`start_date = $${paramIndex++}`);
    values.push(updates.startDate);
  }
  if (updates.endDate !== undefined) {
    fields.push(`end_date = $${paramIndex++}`);
    values.push(updates.endDate);
  }

  if (fields.length === 0) {
    const hackathon = await getHackathonById(hackathonId);
    if (!hackathon) {
      throw new Error('Hackathon not found');
    }
    return hackathon;
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(hackathonId);

  const result = await query<HackathonRecord>(
    `UPDATE hackathons SET ${fields.join(', ')} WHERE hackathon_id = $${paramIndex} RETURNING *`,
    values
  );
  
  return result.rows[0];
}

/**
 * Delete hackathon
 */
export async function deleteHackathon(hackathonId: string): Promise<void> {
  await query('DELETE FROM hackathons WHERE hackathon_id = $1', [hackathonId]);
}

