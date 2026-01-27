import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { createSubmission } from '@/lib/repositories/submissions';
import { trackParticipation } from '@/lib/repositories/participation';
import csv from 'csv-parser';
import { Readable } from 'stream';

/**
 * Safely parse a CSV buffer into an array of records using csv-parser.
 * This helper keeps the route handler focused on auth and business logic.
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
 * POST /api/v1/admin/hackathons/:hackathonId/submissions/upload-csv
 *
 * Bulk upload submissions from a CSV file. Each row is converted into a
 * submission_data payload and an optional participant identifier is used
 * to track participation for the hackathon.
 *
 * Expected columns are flexible, but using headers like:
 * - team_name
 * - project_name
 * - email or submitted_by
 * keeps the downstream UX consistent with the public submission flow.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ hackathonId: string }> },
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Resolve dynamic route params
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
        { error: 'CSV file is empty', processed: 0 },
        { status: 400 },
      );
    }

    let createdCount = 0;

    // Process each CSV row sequentially so that errors stay easy to reason about.
    for (const row of rows) {
      const submissionData: Record<string, unknown> = { ...row };

      const submittedBy =
        row.submitted_by || row.email || row.contact_email || null;

      // Extract poll_id if provided in CSV
      const pollId = row.poll_id || null;

      const submission = await createSubmission(
        hackathonId,
        submissionData,
        submittedBy ?? undefined,
        undefined,
        [],
        pollId || undefined,
      );

      if (submittedBy) {
        // Track the uploader as a participant in the hackathon.
        await trackParticipation(submittedBy, hackathonId, 'participant');
      }

      if (submission) {
        createdCount += 1;
      }
    }

    return NextResponse.json(
      {
        message: 'CSV processed successfully',
        processed: rows.length,
        created: createdCount,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('Error uploading CSV submissions:', error);
    return NextResponse.json(
      { error: 'Failed to process CSV', details: error.message },
      { status: 500 },
    );
  }
}

