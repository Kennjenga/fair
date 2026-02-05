/**
 * Seed built-in hackathon templates into the database (idempotent).
 * Run with: npm run seed-templates
 * Only inserts templates that do not already exist (by governance_model), so Centralized,
 * Community-Led, Sponsor-Driven, DAO-Managed, Hybrid, Rolling, and Pilot all appear.
 */

import { seedBuiltInTemplatesIfMissing } from '../lib/repositories/templates';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function seedTemplates() {
  console.log('🌱 Seeding built-in hackathon templates (idempotent)...\n');

  try {
    const { seeded, skipped } = await seedBuiltInTemplatesIfMissing();

    console.log('\n📊 Seeding Summary:');
    console.log(`   ✅ Seeded: ${seeded} new template(s)`);
    console.log(`   ⏭️  Skipped (already exist): ${skipped} template(s)`);

    if (seeded > 0) {
      console.log('\n🎉 New built-in templates added. All templates (e.g. Centralized, Community-Led) are now available.');
    } else if (skipped > 0) {
      console.log('\n✅ All built-in templates already present. Nothing to do.');
    }
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

// Run the seed script
seedTemplates().catch((error) => {
  console.error('💥 Fatal error during seeding:', error);
  process.exit(1);
});
