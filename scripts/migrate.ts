#!/usr/bin/env ts-node

/**
 * Migration CLI script
 * Usage:
 *   npm run migrate        - Run all pending migrations
 *   npm run migrate:status - Show migration status
 *   npm run migrate:rollback - Rollback last migration
 */

import { runMigrations, rollbackMigration, getMigrationStatus } from '../lib/migrations';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const command = process.argv[2] || 'up';
  
  try {
    switch (command) {
      case 'up':
        await runMigrations();
        break;
      
      case 'down':
      case 'rollback':
        await rollbackMigration();
        break;
      
      case 'status':
        const status = await getMigrationStatus();
        console.log('\nMigration Status:');
        console.log('Executed:', status.executed.length > 0 ? status.executed.join(', ') : 'None');
        console.log('Pending:', status.pending.length > 0 ? status.pending.join(', ') : 'None');
        break;
      
      default:
        console.error(`Unknown command: ${command}`);
        console.log('Usage: npm run migrate [up|down|status]');
        process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

main();

