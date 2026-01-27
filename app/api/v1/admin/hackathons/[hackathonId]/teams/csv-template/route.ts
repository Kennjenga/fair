import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import type { AuthenticatedRequest } from '@/lib/auth/middleware';

/**
 * GET /api/v1/admin/hackathons/:hackathonId/teams/csv-template
 * Download a CSV template file for team information import
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hackathonId: string }> },
) {
  return withAdmin(async (req: AuthenticatedRequest) => {
    try {
      const { hackathonId } = await params;

      // Create CSV template content
      const csvContent = `team_name,team_description,member_1_email,member_1_first_name,member_1_last_name,member_1_phone,member_1_role,member_1_is_lead,member_2_email,member_2_first_name,member_2_last_name,member_2_phone,member_2_role,member_2_is_lead,member_3_email,member_3_first_name,member_3_last_name,member_3_phone,member_3_role,member_3_is_lead
Team Alpha,Innovative development team,alice@example.com,Alice,Smith,+1234567890,Developer,true,bob@example.com,Bob,Jones,+1234567891,Designer,false,charlie@example.com,Charlie,Brown,+1234567892,Project Manager,false
Team Beta,Creative solutions group,diana@example.com,Diana,Prince,+1234567893,Lead Developer,true,eve@example.com,Eve,Wilson,+1234567894,UI/UX Designer,false
Team Gamma,Research and development,frank@example.com,Frank,Miller,+1234567895,Data Scientist,true`;

      // Return CSV file as download
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="team-import-template-${hackathonId}.csv"`,
        },
      });
    } catch (error: any) {
      console.error('Error generating CSV template:', error);
      return NextResponse.json(
        { error: 'Failed to generate CSV template', details: error.message },
        { status: 500 },
      );
    }
  })(request);
}
