import { query, getClient } from './db';
import fs from 'fs';
import path from 'path';

/**
 * Migration file interface
 */
export interface Migration {
  id: string;
  name: string;
  up: string;
  down: string;
}

/**
 * Create migrations table if it doesn't exist
 */
async function ensureMigrationsTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

/**
 * Get all executed migrations
 * @returns Array of migration names
 */
export async function getExecutedMigrations(): Promise<string[]> {
  await ensureMigrationsTable();
  const result = await query<{ name: string }>('SELECT name FROM migrations ORDER BY executed_at ASC');
  return result.rows.map(row => row.name);
}

/**
 * Record a migration as executed
 * @param migrationName - Name of the migration file
 */
async function recordMigration(migrationName: string): Promise<void> {
  await query('INSERT INTO migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [migrationName]);
}

/**
 * Remove a migration record (for rollback)
 * @param migrationName - Name of the migration file
 */
async function removeMigration(migrationName: string): Promise<void> {
  await query('DELETE FROM migrations WHERE name = $1', [migrationName]);
}

/**
 * Load migration file
 * @param migrationPath - Path to the migration file
 * @returns Migration object with up and down SQL
 */
function loadMigration(migrationPath: string): Migration {
  const content = fs.readFileSync(migrationPath, 'utf-8');
  const name = path.basename(migrationPath, '.sql');
  
  // Split migration file by -- DOWN comment
  const parts = content.split(/--\s*DOWN\s*/i);
  const up = parts[0].replace(/--\s*UP\s*/i, '').trim();
  const down = parts[1]?.trim() || '';
  
  return {
    id: name,
    name,
    up,
    down,
  };
}

/**
 * Get all migration files from the migrations directory
 * @returns Array of migration file paths sorted by name
 */
function getMigrationFiles(): string[] {
  const migrationsDir = path.join(process.cwd(), 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
    return [];
  }
  
  return fs
    .readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .map(file => path.join(migrationsDir, file))
    .sort();
}

/**
 * Run all pending migrations
 */
export async function runMigrations(): Promise<void> {
  console.log('Running migrations...');
  
  await ensureMigrationsTable();
  const executedMigrations = await getExecutedMigrations();
  const migrationFiles = getMigrationFiles();
  
  const pendingMigrations = migrationFiles.filter(file => {
    const name = path.basename(file, '.sql');
    return !executedMigrations.includes(name);
  });
  
  if (pendingMigrations.length === 0) {
    console.log('No pending migrations.');
    return;
  }
  
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    for (const migrationFile of pendingMigrations) {
      const migration = loadMigration(migrationFile);
      console.log(`Running migration: ${migration.name}`);
      
      // Execute the UP migration
      if (migration.up) {
        await client.query(migration.up);
      }
      
      // Record the migration
      await client.query('INSERT INTO migrations (name) VALUES ($1)', [migration.name]);
      console.log(`✓ Migration ${migration.name} completed`);
    }
    
    await client.query('COMMIT');
    console.log(`Successfully ran ${pendingMigrations.length} migration(s)`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Rollback the last migration
 */
export async function rollbackMigration(): Promise<void> {
  console.log('Rolling back last migration...');
  
  await ensureMigrationsTable();
  const executedMigrations = await getExecutedMigrations();
  
  if (executedMigrations.length === 0) {
    console.log('No migrations to rollback.');
    return;
  }
  
  const lastMigrationName = executedMigrations[executedMigrations.length - 1];
  const migrationFiles = getMigrationFiles();
  const migrationFile = migrationFiles.find(file => 
    path.basename(file, '.sql') === lastMigrationName
  );
  
  if (!migrationFile) {
    throw new Error(`Migration file not found for: ${lastMigrationName}`);
  }
  
  const migration = loadMigration(migrationFile);
  
  if (!migration.down) {
    throw new Error(`No DOWN migration found for: ${lastMigrationName}`);
  }
  
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    console.log(`Rolling back migration: ${migration.name}`);
    await client.query(migration.down);
    await removeMigration(migration.name);
    
    await client.query('COMMIT');
    console.log(`✓ Migration ${migration.name} rolled back`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Rollback failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get migration status
 */
export async function getMigrationStatus(): Promise<{
  executed: string[];
  pending: string[];
}> {
  await ensureMigrationsTable();
  const executedMigrations = await getExecutedMigrations();
  const migrationFiles = getMigrationFiles();
  
  const allMigrations = migrationFiles.map(file => path.basename(file, '.sql'));
  const pendingMigrations = allMigrations.filter(name => !executedMigrations.includes(name));
  
  return {
    executed: executedMigrations,
    pending: pendingMigrations,
  };
}

