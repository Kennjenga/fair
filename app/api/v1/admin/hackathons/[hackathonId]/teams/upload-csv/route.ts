import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import { createSubmission } from '@/lib/repositories/submissions';
import { trackParticipation } from '@/lib/repositories/participation';
import csv from 'csv-parser';
import { Readable } from 'stream';
import type { AuthenticatedRequest } from '@/lib/auth/middleware';

/**
 * Safely parse a CSV buffer into an array of records using csv-parser.
 */
async function parseCsv(buffer: Buffer): Promise<Record<string, string>[]> {
  const rows: Record<string, string>[] = [];

  return new Promise((resolve, reject) => {
    const readable = Readable.from(buffer.toString('utf-8'));

    readable
      .pipe(csv())
      .on('data', (data: Record<string, string>) => {
        rows.push(data);
      })
      .on('end', () => resolve(rows))
      .on('error', (error: Error) => reject(error));
  });
}

/**
 * Parse team member data from CSV row.
 * Supports multiple formats:
 * - Individual columns: member_1_email, member_1_first_name, etc.
 * - Comma-separated: team_members (JSON string or formatted string)
 * - Multiple rows per team (team_name repeated)
 */
function parseTeamMembers(row: Record<string, string>): Array<{
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  isLead: boolean;
}> {
  const members: Array<{
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: string;
    isLead: boolean;
  }> = [];

  // Try to parse as JSON first (if team_members column exists as JSON)
  if (row.team_members) {
    try {
      const parsed = JSON.parse(row.team_members);
      if (Array.isArray(parsed)) {
        return parsed.map((m: any) => ({
          email: m.email || '',
          firstName: m.firstName || m.first_name || '',
          lastName: m.lastName || m.last_name || '',
          phone: m.phone || '',
          role: m.role || '',
          isLead: m.isLead === true || m.is_lead === true || m.isLead === 'true' || m.is_lead === 'true',
        }));
      }
    } catch {
      // Not JSON, try other formats
    }
  }

  // Try numbered member columns (member_1_email, member_2_email, etc.)
  let memberIndex = 1;
  while (true) {
    const emailKey = `member_${memberIndex}_email`;
    const firstNameKey = `member_${memberIndex}_first_name` || `member_${memberIndex}_firstName`;
    const lastNameKey = `member_${memberIndex}_last_name` || `member_${memberIndex}_lastName`;
    const phoneKey = `member_${memberIndex}_phone`;
    const roleKey = `member_${memberIndex}_role`;
    const isLeadKey = `member_${memberIndex}_is_lead` || `member_${memberIndex}_isLead`;

    if (!row[emailKey] && !row[firstNameKey] && !row[lastNameKey]) {
      break; // No more members
    }

    const email = row[emailKey] || '';
    const firstName = row[firstNameKey] || '';
    const lastName = row[lastNameKey] || '';
    const phone = row[phoneKey] || '';
    const role = row[roleKey] || '';
    const isLead = row[isLeadKey] === 'true' || row[isLeadKey] === '1' || row[isLeadKey] === 'yes' || memberIndex === 1;

    if (email || firstName || lastName) {
      members.push({
        email,
        firstName,
        lastName,
        phone,
        role,
        isLead: memberIndex === 1 && members.length === 0 ? true : isLead, // First member defaults to lead if none specified
      });
    }

    memberIndex += 1;
    if (memberIndex > 50) break; // Safety limit
  }

  // If no members found with numbered format, try single row format
  if (members.length === 0) {
    const email = row.email || row.member_email || '';
    const firstName = row.first_name || row.firstName || row.member_first_name || '';
    const lastName = row.last_name || row.lastName || row.member_last_name || '';
    const phone = row.phone || row.member_phone || '';
    const role = row.role || row.member_role || '';
    const isLead = row.is_lead === 'true' || row.is_lead === '1' || row.is_lead === 'yes' || row.isLead === 'true' || true; // Default to true for single member

    if (email || firstName || lastName) {
      members.push({
        email,
        firstName,
        lastName,
        phone,
        role,
        isLead,
      });
    }
  }

  // Ensure at least one member is marked as lead
  if (members.length > 0 && !members.some(m => m.isLead)) {
    members[0].isLead = true;
  }

  return members;
}

/**
 * POST /api/v1/admin/hackathons/:hackathonId/teams/upload-csv
 *
 * Bulk upload teams from a CSV file. Each row represents a team with team members.
 * 
 * Expected CSV format (flexible):
 * - team_name (required)
 * - team_description (optional)
 * - member_1_email, member_1_first_name, member_1_last_name, member_1_phone, member_1_role, member_1_is_lead
 * - member_2_email, member_2_first_name, member_2_last_name, member_2_phone, member_2_role, member_2_is_lead
 * - ... (up to member_N_*)
 * 
 * OR single member per row (team_name repeated):
 * - team_name, team_description, email, first_name, last_name, phone, role, is_lead
 * 
 * OR JSON format:
 * - team_name, team_description, team_members (JSON array string)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ hackathonId: string }> },
) {
  return withAdmin(async (req: AuthenticatedRequest) => {
    try {
      const admin = req.admin!;
      const { hackathonId } = await params;

      const formData = await request.formData();
      const file = formData.get('file');

      if (!(file instanceof File)) {
        return NextResponse.json(
          { error: 'CSV file is required under the "file" field' },
          { status: 400 },
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const rows = await parseCsv(buffer);

      if (rows.length === 0) {
        return NextResponse.json(
          { error: 'CSV file is empty', processed: 0, created: 0 },
          { status: 400 },
        );
      }

      let createdCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Group rows by team_name (for single-member-per-row format)
      const teamsMap = new Map<string, {
        teamName: string;
        teamDescription: string;
        members: Array<{
          email: string;
          firstName: string;
          lastName: string;
          phone: string;
          role: string;
          isLead: boolean;
        }>;
      }>();

      // Process each CSV row
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2; // +2 because row 1 is header, and arrays are 0-indexed

        const teamName = (row.team_name || row.teamName || '').trim();
        if (!teamName) {
          errors.push(`Row ${rowNumber}: Missing team_name`);
          errorCount += 1;
          continue;
        }

        const teamDescription = (row.team_description || row.teamDescription || '').trim();

        // Parse team members
        const members = parseTeamMembers(row);

        if (members.length === 0) {
          errors.push(`Row ${rowNumber}: No team members found for team "${teamName}"`);
          errorCount += 1;
          continue;
        }

        // Check if team already exists in this batch
        if (teamsMap.has(teamName)) {
          // Add members to existing team (for single-member-per-row format)
          const existingTeam = teamsMap.get(teamName)!;
          existingTeam.members.push(...members);
        } else {
          // Create new team entry
          teamsMap.set(teamName, {
            teamName,
            teamDescription,
            members,
          });
        }
      }

      // Create submissions for each team
      for (const [teamName, teamData] of teamsMap.entries()) {
        try {
          // Ensure at least one member is marked as lead
          if (teamData.members.length > 0 && !teamData.members.some(m => m.isLead)) {
            teamData.members[0].isLead = true;
          }

          // Create submission data matching team_formation form structure
          const submissionData = {
            team_name: teamData.teamName,
            team_description: teamData.teamDescription || '',
            team_members: teamData.members,
          };

          // Use first member's email as submitted_by if available
          const submittedBy = teamData.members.find(m => m.email)?.email || admin.email;

          // Create submission
          await createSubmission(
            hackathonId,
            submissionData,
            submittedBy,
            undefined,
            [],
            undefined, // No poll_id for team formation
          );

          // Track participation for the submitter
          await trackParticipation(submittedBy, hackathonId, 'participant');

          createdCount += 1;
        } catch (error: any) {
          console.error(`Error creating team "${teamName}":`, error);
          errors.push(`Team "${teamName}": ${error.message || 'Failed to create'}`);
          errorCount += 1;
        }
      }

      return NextResponse.json(
        {
          message: 'CSV processed successfully',
          processed: rows.length,
          created: createdCount,
          errors: errorCount > 0 ? errors : undefined,
        },
        { status: 201 },
      );
    } catch (error: any) {
      console.error('Error uploading teams CSV:', error);
      return NextResponse.json(
        { error: 'Failed to process CSV', details: error.message },
        { status: 500 },
      );
    }
  })(request);
}
