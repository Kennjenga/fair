/**
 * Script to check the actual data type of submission_data column
 * Run with: npx tsx scripts/check-submission-data-type.ts
 */

import { query } from '../lib/db';

async function checkColumnType() {
  try {
    // Check the column data type
    const typeResult = await query(`
      SELECT 
        column_name,
        data_type,
        udt_name
      FROM information_schema.columns
      WHERE table_name = 'hackathon_submissions'
        AND column_name = 'submission_data'
    `);

    console.log('Column Type Information:');
    console.log(JSON.stringify(typeResult.rows, null, 2));

    // Check a sample of actual data
    const sampleResult = await query(`
      SELECT 
        submission_id,
        pg_typeof(submission_data) as actual_type,
        submission_data::text as data_preview
      FROM hackathon_submissions
      LIMIT 5
    `);

    console.log('\nSample Data Types:');
    console.log(JSON.stringify(sampleResult.rows, null, 2));

    // Check if we need to convert TEXT to JSONB
    const textCountResult = await query(`
      SELECT COUNT(*) as count
      FROM information_schema.columns
      WHERE table_name = 'hackathon_submissions'
        AND column_name = 'submission_data'
        AND data_type = 'text'
    `);

    if (parseInt(textCountResult.rows[0]?.count || '0', 10) > 0) {
      console.log('\n⚠️  WARNING: submission_data column is TEXT, not JSONB!');
      console.log('You may need to run a migration to convert it to JSONB.');
    } else {
      console.log('\n✅ Column is correctly typed as JSONB');
    }
  } catch (error) {
    console.error('Error checking column type:', error);
  } finally {
    process.exit(0);
  }
}

checkColumnType();
