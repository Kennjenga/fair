/**
 * Database type definitions for PostgreSQL
 */

/**
 * Database configuration interface
 */
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

/**
 * Query result row type (can be extended based on your tables)
 */
export type QueryRow = Record<string, unknown>;

/**
 * Query result type
 */
export interface QueryResult<T = QueryRow> {
  rows: T[];
  rowCount: number;
  command: string;
  oid: number;
  fields: Array<{
    name: string;
    tableID: number;
    columnID: number;
    dataTypeID: number;
    dataTypeSize: number;
    dataTypeModifier: number;
    format: string;
  }>;
}


