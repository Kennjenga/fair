import { NextRequest, NextResponse } from 'next/server';
import { createSubmission, findTeamByTeamLead, isTeamLead } from '@/lib/repositories/submissions';
import { getFormFields } from '@/lib/repositories/form-fields';
import { trackParticipation } from '@/lib/repositories/participation';
import { uploadFile } from '@/lib/cloudinary';
import { getTeamByName, updateTeam } from '@/lib/repositories/teams';
import { getPollById, getPollsByHackathon } from '@/lib/repositories/polls';
import type { FileReference } from '@/types/submission';

/**
 * POST /api/v1/public/hackathons/:id/submit
 * Submit to a hackathon (public endpoint)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ hackathonId: string }> }
) {
  try {
    // Resolve dynamic route params
    const { hackathonId } = await params;
    
    // Get form_key from URL query (e.g. ?form=team_formation) so we validate the right form
    const url = new URL(request.url);
    let formKey = url.searchParams.get('form') || undefined;

    const formData = await request.formData();

    // Extract submission data
    const submissionData: Record<string, any> = {};
    const files: Array<{ fieldName: string; file: File }> = [];

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        files.push({ fieldName: key, file: value });
      } else {
        try {
          submissionData[key] = JSON.parse(value as string);
        } catch {
          submissionData[key] = value;
        }
      }
    }

    // Fallback: form_key from body if not in URL (ensures team_formation / project_details work)
    if (!formKey && submissionData.form_key) {
      formKey = String(submissionData.form_key);
      delete submissionData.form_key;
    }

    // Get form fields for this form only so required validation matches what the user submitted
    const formFields = await getFormFields(hackathonId, formKey);

    const isProjectDetailsForm = formKey === 'project_details';
    
    // For project_details form, verify that the submitter is a team lead
    let teamName: string | null = null;
    let teamSubmissionId: string | null = null;
    
    if (isProjectDetailsForm) {
      // Get the submitter's email
      const submitterEmail = submissionData.submitted_by || submissionData.email;
      
      if (!submitterEmail) {
        return NextResponse.json(
          { error: 'Email is required to submit project details. Only team leads can submit project details.' },
          { status: 400 }
        );
      }
      
      // Find the team where this user is the team lead
      const teamInfo = await findTeamByTeamLead(hackathonId, submitterEmail);
      
      if (!teamInfo) {
        return NextResponse.json(
          { error: 'You must be a team lead to submit project details. Please ensure you have submitted a team formation with yourself as the team lead.' },
          { status: 403 }
        );
      }
      
      teamName = teamInfo.teamName;
      teamSubmissionId = teamInfo.submissionId;
      
      // Remove team_name, team_members, and description from submission data if they exist
      // These should not be collected in project_details form
      delete submissionData.team_name;
      delete submissionData.team_members;
      delete submissionData.team_description;
      delete submissionData.description;
      
      // Automatically link this submission to the team by adding team_name to submission_data
      // This allows the submission to be associated with the team without collecting it in the form
      submissionData.team_name = teamName;
    }

    // Validate required fields (excluding team-related fields for project_details)
    for (const field of formFields) {
      // Skip validation for team-related fields in project_details form
      if (isProjectDetailsForm && 
          (field.field_name === 'team_name' || 
           field.field_name === 'team_members' || 
           field.field_name === 'team_description' ||
           field.field_name === 'description')) {
        continue;
      }
      
      if (field.is_required && !submissionData[field.field_name] && !files.find(f => f.fieldName === field.field_name)) {
        return NextResponse.json(
          { error: `Missing required field: ${field.field_label}` },
          { status: 400 }
        );
      }
    }

    // Upload files to Cloudinary
    const fileReferences: FileReference[] = [];
    
    // Extract poll_id if provided (for project submissions)
    const pollId = submissionData.poll_id || null;

    // For project_details, we don't use team_id from submission data
    // Instead, we'll link it via the team name in submission_data
    // Note: team_id in submissions table is for teams table, but we're using submission-based teams
    const teamId = isProjectDetailsForm ? null : submissionData.team_id;

    // Create submission first to get submission ID
    const submission = await createSubmission(
      hackathonId,
      submissionData,
      submissionData.submitted_by || submissionData.email,
      teamId,
      [],
      pollId
    );

    // Upload files with submission ID
    for (const { fieldName, file } of files) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadResult = await uploadFile(
          buffer,
          file.name,
          hackathonId,
          submission.submission_id
        );

        fileReferences.push({
          fieldName,
          publicId: uploadResult.publicId,
          url: uploadResult.url,
          secureUrl: uploadResult.secureUrl,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          format: uploadResult.format,
          uploadedAt: new Date(),
        });

        // Add file reference to submission data
        submissionData[fieldName] = uploadResult.secureUrl;
      } catch (error: any) {
        console.error(`Error uploading file ${file.name}:`, error);
        return NextResponse.json(
          { error: `Failed to upload file: ${file.name}`, details: error.message },
          { status: 500 }
        );
      }
    }

    // Update submission with file references if any were uploaded
    if (fileReferences.length > 0) {
      // Note: You'd need to add an update method to include file references
      // For now, they're stored in the submission_data
    }

    // Track participation
    if (submissionData.submitted_by || submissionData.email) {
      await trackParticipation(
        submissionData.submitted_by || submissionData.email,
        hackathonId,
        'participant'
      );
    }

    // For project_details form, update the poll team with project information
    if (isProjectDetailsForm && teamName) {
      const updatePayload = {
        projectName: submissionData.project_name || undefined,
        projectDescription:
          submissionData.project_description ||
          submissionData.project_details ||
          submissionData.problem_statement ||
          undefined,
        pitch: submissionData.pitch || submissionData.solution || undefined,
        liveSiteUrl: submissionData.live_site_url || submissionData.live_link || undefined,
        githubUrl: submissionData.github_url || submissionData.github_link || undefined,
      };
      try {
        let updated = false;
        if (pollId) {
          const poll = await getPollById(pollId);
          if (poll && poll.hackathon_id === hackathonId) {
            const pollTeam = await getTeamByName(pollId, teamName);
            if (pollTeam) {
              await updateTeam(pollTeam.team_id, updatePayload);
              updated = true;
            }
          }
        }
        // Fallback: if no poll_id or team not found, try each hackathon poll by team name
        if (!updated) {
          const polls = await getPollsByHackathon(hackathonId);
          for (const poll of polls) {
            const pollTeam = await getTeamByName(poll.poll_id, teamName);
            if (pollTeam) {
              await updateTeam(pollTeam.team_id, updatePayload);
              break;
            }
          }
        }
      } catch (error: any) {
        console.error('Error updating poll team details:', error);
      }
    }

    return NextResponse.json(
      {
        message: 'Submission successful',
        submission: {
          submissionId: submission.submission_id,
          submittedAt: submission.submitted_at,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating submission:', error);
    return NextResponse.json(
      { error: 'Failed to submit', details: error.message },
      { status: 500 }
    );
  }
}
