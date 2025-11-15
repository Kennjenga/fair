import { createAdmin } from '../lib/repositories/admins';
import { query, closePool } from '../lib/db';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

/**
 * Initialize super admin account
 * This script creates the first super admin from environment variables
 */
async function initSuperAdmin() {
  try {
    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;

    if (!email || !password) {
      console.error('Error: SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set in .env.local');
      process.exit(1);
    }

    // Check if super admin already exists
    const existing = await query(
      "SELECT admin_id FROM admins WHERE email = $1 AND role = 'super_admin'",
      [email]
    );

    if (existing.rows.length > 0) {
      console.log(`Super admin with email ${email} already exists.`);
      process.exit(0);
    }

    // Create super admin
    const admin = await createAdmin(email, password, 'super_admin');

    console.log('✓ Super admin created successfully!');
    console.log(`  Email: ${admin.email}`);
    console.log(`  Role: ${admin.role}`);
    console.log(`  Admin ID: ${admin.admin_id}`);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
  } catch (error) {
    console.error('Failed to create super admin:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Run the script
initSuperAdmin();

