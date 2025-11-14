import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * @swagger
 * /api/v1/example:
 *   get:
 *     summary: Example endpoint
 *     description: Demonstrates database operations with example table
 *     tags: [Example]
 *     responses:
 *       200:
 *         description: Successfully retrieved example data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExampleResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET() {
  try {
    // Example: Create a simple table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS example_table (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Example: Insert a record
    await query(
      'INSERT INTO example_table (name) VALUES ($1) ON CONFLICT DO NOTHING',
      ['Example Record']
    );

    // Example: Fetch records
    const result = await query('SELECT * FROM example_table ORDER BY created_at DESC LIMIT 10');

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
    }, { status: 200 });
  } catch (error) {
    console.error('Example API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}


