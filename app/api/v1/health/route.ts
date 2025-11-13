import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Verifies database connectivity and returns system status
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: System is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *       503:
 *         description: System is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET() {
  try {
    // Test database connection with a simple query
    const result = await query<{ current_time: Date; pg_version: string }>(
      'SELECT NOW() as current_time, version() as pg_version'
    );
    
    const row = result.rows[0];
    if (!row) {
      throw new Error('No data returned from database');
    }
    
    return NextResponse.json({
      status: 'healthy',
      database: {
        connected: true,
        currentTime: row.current_time,
        version: row.pg_version.split(' ')[0] + ' ' + row.pg_version.split(' ')[1],
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      status: 'unhealthy',
      database: {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    }, { status: 503 });
  }
}

