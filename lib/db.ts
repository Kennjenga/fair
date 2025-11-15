import { Pool, PoolClient, QueryResult } from 'pg';
import type { QueryRow } from '@/types/database';

/**
 * Parse a PostgreSQL connection URL
 * Supports formats:
 * - postgresql://user:password@host:port/database
 * - postgres://user:password@host:port/database
 * - postgresql://user:password@host:port/database?sslmode=require
 * 
 * Handles URL-encoded passwords and special characters
 */
function parseDatabaseUrl(url: string): {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
} {
  try {
    const parsed = new URL(url);
    
    // Decode URL-encoded values (passwords may contain special characters)
    const username = parsed.username ? decodeURIComponent(parsed.username) : 'postgres';
    const password = parsed.password ? decodeURIComponent(parsed.password) : '';
    const database = parsed.pathname 
      ? decodeURIComponent(parsed.pathname.slice(1)) // Remove leading '/' and decode
      : 'fair_db';
    
    return {
      host: parsed.hostname || 'localhost',
      port: parsed.port ? parseInt(parsed.port, 10) : 5432,
      database: database,
      user: username,
      password: password,
    };
  } catch (error) {
    console.error('Failed to parse DATABASE_URL:', error);
    throw new Error('Invalid DATABASE_URL format. Expected format: postgresql://user:password@host:port/database');
  }
}

/**
 * Get database configuration
 * Supports both DATABASE_URL (for production) and individual environment variables (for development)
 * This function ensures password is always a proper string
 */
function getDbConfig() {
  // Check if DATABASE_URL is provided (common in production environments)
  if (process.env.DATABASE_URL) {
    const config = parseDatabaseUrl(process.env.DATABASE_URL);
    
    // Parse SSL settings from URL or environment
    let sslConfig: { rejectUnauthorized: boolean } | undefined = undefined;
    
    // Check if SSL is required via environment variable
    if (process.env.DB_SSL === 'true' || process.env.DB_SSL === '1') {
      sslConfig = {
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
      };
    } else if (process.env.NODE_ENV === 'production') {
      // Default to SSL in production if not explicitly disabled
      sslConfig = {
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true',
      };
    }
    
    // Check URL for SSL mode parameter
    try {
      const url = new URL(process.env.DATABASE_URL);
      const sslmode = url.searchParams.get('sslmode');
      if (sslmode === 'require' || sslmode === 'prefer') {
        sslConfig = {
          rejectUnauthorized: sslmode === 'require' && process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true',
        };
      }
      // Neon and most cloud databases require SSL
      // If no sslmode is specified but it's a cloud database URL, enable SSL
      if (!sslmode && (url.hostname.includes('.neon.tech') || url.hostname.includes('.supabase.co') || url.hostname.includes('.railway.app'))) {
        sslConfig = {
          rejectUnauthorized: false, // Cloud providers use valid certificates but we set to false for compatibility
        };
      }
    } catch {
      // URL parsing failed, use existing config
    }
    
    return {
      ...config,
      // Connection pool settings
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000, // Increased for cloud databases (Neon, etc.)
      // SSL configuration
      ssl: sslConfig,
    };
  }

  // Fall back to individual environment variables (for development)
  // Get password and ensure it's a string
  // Handle cases where it might be undefined, null, or other types
  let password: string = '';
  
  if (process.env.DB_PASSWORD !== undefined && process.env.DB_PASSWORD !== null) {
    // Convert to string and trim whitespace
    password = String(process.env.DB_PASSWORD).trim();
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'fair_db',
    user: process.env.DB_USER || 'postgres',
    password: password, // Always a string
    // Connection pool settings
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // Increased for cloud databases
  };
}

/**
 * Database connection pool
 * Created lazily to ensure environment variables are loaded
 */
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const config = getDbConfig();
    pool = new Pool(config);
  }
  return pool;
}

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
  const poolInstance = getPool();
  const start = Date.now();
  try {
    const result = await poolInstance.query(text, params);
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
  const poolInstance = getPool();
  const client = await poolInstance.connect();
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
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// Export getPool for advanced usage (but prefer using query/getClient functions)
export { getPool as pool };

