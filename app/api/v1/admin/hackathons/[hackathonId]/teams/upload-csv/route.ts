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
    // Try multiple key variations for each field
    const emailKey = `member_${memberIndex}_email`;
    const firstNameKey1 = `member_${memberIndex}_first_name`;
    const firstNameKey2 = `member_${memberIndex}_firstName`;
    const lastNameKey1 = `member_${memberIndex}_last_name`;
    const lastNameKey2 = `member_${memberIndex}_lastName`;
    const phoneKey = `member_${memberIndex}_phone`;
    const roleKey = `member_${memberIndex}_role`;
    const isLeadKey1 = `member_${memberIndex}_is_lead`;
    const isLeadKey2 = `member_${memberIndex}_isLead`;

    // Check if any member data exists for this index
    const email = row[emailKey] || '';
    const firstName = row[firstNameKey1] || row[firstNameKey2] || '';
    const lastName = row[lastNameKey1] || row[lastNameKey2] || '';
    const phone = row[phoneKey] || '';
    const role = row[roleKey] || '';
    const isLeadValue = row[isLeadKey1] || row[isLeadKey2] || '';
    const isLead = isLeadValue === 'true' || isLeadValue === '1' || isLeadValue === 'yes' || memberIndex === 1;

    // If no data found for this member index, stop
    if (!email && !firstName && !lastName) {
      break; // No more members
    }

    // Add member if we have at least email, first name, or last name
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
    // Try various column name formats (case-insensitive matching)
    const getValue = (keys: string[]) => {
      for (const key of keys) {
        // Try exact match first
        if (row[key]) return row[key];
        // Try case-insensitive match
        const lowerKey = key.toLowerCase();
        for (const rowKey in row) {
          if (rowKey.toLowerCase() === lowerKey) {
            return row[rowKey];
          }
        }
      }
      return '';
    };

    const email = getValue(['email', 'member_email', 'Email', 'Email Address', 'e-mail']);
    const firstName = getValue(['first_name', 'firstName', 'firstname', 'first name', 'First Name', 'fname', 'member_first_name']);
    const lastName = getValue(['last_name', 'lastName', 'lastname', 'last name', 'Last Name', 'lname', 'member_last_name']);
    const phone = getValue(['phone', 'Phone', 'phone_number', 'Phone Number', 'member_phone', 'telephone']);
    const role = getValue(['role', 'Role', 'member_role', 'position']);
    const isLeadValue = getValue(['is_lead', 'isLead', 'is_leader', 'leader', 'team_lead']);
    const isLead = isLeadValue === 'true' || isLeadValue === '1' || isLeadValue === 'yes' || isLeadValue === 'Yes' || true; // Default to true for single member

    if (email || firstName || lastName) {
      members.push({
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        role: role.trim(),
        isLead,
      });
    }
  }

  // Final fallback: if still no members found, try to extract from any available columns
  if (members.length === 0) {
    // Look for any column that might contain member data
    const allKeys = Object.keys(row);
    const emailPattern = /email|e-mail|mail/i;
    const firstNamePattern = /first[_\s]?name|fname|given[_\s]?name/i;
    const lastNamePattern = /last[_\s]?name|lname|surname|family[_\s]?name/i;
    const phonePattern = /phone|tel|mobile|cell/i;
    const rolePattern = /role|position|title/i;

    let email = '';
    let firstName = '';
    let lastName = '';
    let phone = '';
    let role = '';

    // Try to find columns matching patterns
    for (const key of allKeys) {
      const value = (row[key] || '').trim();
      if (!value) continue;

      const lowerKey = key.toLowerCase();
      if (emailPattern.test(key) && !email && value.includes('@')) {
        email = value;
      } else if (firstNamePattern.test(key) && !firstName) {
        firstName = value;
      } else if (lastNamePattern.test(key) && !lastName) {
        lastName = value;
      } else if (phonePattern.test(key) && !phone) {
        phone = value;
      } else if (rolePattern.test(key) && !role) {
        role = value;
      }
    }

    // If we found at least email, first name, or last name, create a member
    if (email || firstName || lastName) {
      members.push({
        email,
        firstName,
        lastName,
        phone,
        role,
        isLead: true, // Default to lead for single member
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

        // Parse team members first to help generate team name if needed
        const members = parseTeamMembers(row);

        if (members.length === 0) {
          errors.push(`Row ${rowNumber}: No team members found`);
          errorCount += 1;
          continue;
        }

        // Extract team name with flexible column name matching
        const getTeamName = () => {
          // Try exact matches first
          if (row.team_name) return row.team_name.trim();
          if (row.teamName) return row.teamName.trim();
          if (row['Team Name']) return row['Team Name'].trim();
          if (row['team name']) return row['team name'].trim();
          
          // Try case-insensitive match
          const teamNamePattern = /team[_\s]?name/i;
          for (const key in row) {
            if (teamNamePattern.test(key) && row[key] && row[key].trim()) {
              return row[key].trim();
            }
          }
          
          return '';
        };

        let teamName = getTeamName();
        if (!teamName) {
          // Try to generate from first member's name
          const firstMember = members[0];
          if (firstMember.firstName && firstMember.lastName) {
            teamName = `${firstMember.firstName} ${firstMember.lastName}'s Team`;
          } else if (firstMember.firstName) {
            teamName = `${firstMember.firstName}'s Team`;
          } else if (firstMember.email) {
            teamName = `Team ${firstMember.email.split('@')[0]}`;
          } else {
            teamName = `Team Row ${rowNumber}`;
          }
        }

        // Extract team description with flexible column name matching
        const getTeamDescription = () => {
          // Try exact matches first
          if (row.team_description) return row.team_description.trim();
          if (row.teamDescription) return row.teamDescription.trim();
          if (row['Team Description']) return row['Team Description'].trim();
          if (row['team description']) return row['team description'].trim();
          if (row.description) return row.description.trim();
          if (row.Description) return row.Description.trim();
          
          // Try case-insensitive match
          const descPattern = /team[_\s]?description|description/i;
          for (const key in row) {
            if (descPattern.test(key) && row[key] && row[key].trim()) {
              return row[key].trim();
            }
          }
          
          return '';
        };

        const teamDescription = getTeamDescription();

        // Check if team already exists in this batch
        if (teamsMap.has(teamName)) {
          // Add members to existing team (for single-member-per-row format)
          const existingTeam = teamsMap.get(teamName)!;
          existingTeam.members.push(...members);
          // Update description if current row has one and existing doesn't
          if (teamDescription && !existingTeam.teamDescription) {
            existingTeam.teamDescription = teamDescription;
          }
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
