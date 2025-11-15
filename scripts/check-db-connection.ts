#!/usr/bin/env ts-node

/**
 * Check which database the application is connecting to
 */

import { query, closePool } from '../lib/db';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function checkConnection() {
  try {
    console.log('Checking database connection...\n');
    
    // Show which connection method is being used
    if (process.env.DATABASE_URL) {
      const url = new URL(process.env.DATABASE_URL);
      console.log('✓ Using DATABASE_URL');
      console.log(`  Host: ${url.hostname}`);
      console.log(`  Port: ${url.port || '5432'}`);
      console.log(`  Database: ${url.pathname.slice(1)}`);
      console.log(`  User: ${url.username}`);
    } else {
      console.log('✓ Using individual environment variables');
      console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
      console.log(`  Port: ${process.env.DB_PORT || '5432'}`);
      console.log(`  Database: ${process.env.DB_NAME || 'fair_db'}`);
      console.log(`  User: ${process.env.DB_USER || 'postgres'}`);
    }
    
    console.log('\nTesting connection...');
    
    // Test the connection
    const result = await query('SELECT version(), current_database(), current_user');
    const row = result.rows[0];
    
    console.log('\n✓ Connection successful!');
    const version = typeof row.version === 'string' ? row.version : '';
    console.log(`  PostgreSQL Version: ${version.split(' ')[0]} ${version.split(' ')[1]}`);
    console.log(`  Current Database: ${row.current_database}`);
    console.log(`  Current User: ${row.current_user}`);
    
    // Check if tables exist
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`\n  Tables in public schema: ${tablesResult.rows.length}`);
    if (tablesResult.rows.length > 0) {
      console.log('  Table names:');
      tablesResult.rows.forEach((row: any) => {
        console.log(`    - ${row.table_name}`);
      });
    }
    
  } catch (error) {
    console.error('\n✗ Connection failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

checkConnection();

