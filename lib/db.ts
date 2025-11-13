import { Pool, PoolClient, QueryResult } from 'pg';
import type { QueryRow } from '@/types/database';

/**
 * Database connection pool configuration
 * Uses environment variables for connection details
 */
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'fair_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

/**
 * Execute a query using the connection pool
 * @param text - SQL query string
 * @param params - Query parameters (optional)
 * @returns Promise with query result
 */
export async function query<T extends QueryRow = QueryRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Database query error', { text, error });
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 * Remember to release the client when done
 * @returns Promise with PoolClient
 */
export async function getClient(): Promise<PoolClient> {
  const client = await pool.connect();
  return client;
}

/**
 * Execute a transaction with automatic rollback on error
 * @param callback - Function that receives a client and performs operations
 * @returns Promise with the result of the callback
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close all database connections
 * Should be called when shutting down the application
 */
export async function closePool(): Promise<void> {
  await pool.end();
}

// Export the pool for advanced usage
export { pool };

