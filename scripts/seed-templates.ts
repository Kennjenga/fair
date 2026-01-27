/**
 * Seed built-in hackathon templates into the database
 * Run with: npm run seed-templates
 */

import { BUILT_IN_TEMPLATES } from '../lib/templates/built-in-templates';
import { createBuiltInTemplate } from '../lib/repositories/templates';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function seedTemplates() {
  console.log('🌱 Seeding built-in hackathon templates...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const template of BUILT_IN_TEMPLATES) {
    try {
      console.log(`📝 Creating template: ${template.name}`);
      
      const created = await createBuiltInTemplate(
        template.name,
        template.governanceModel,
        template.config,
        template.description,
        template.intendedUse,
        template.complexityLevel,
        template.defaultFormFields
      );

      console.log(`✅ Created: ${created.template_id} - ${template.name}`);
      console.log(`   Governance: ${template.governanceModel}`);
      console.log(`   Complexity: ${template.complexityLevel}`);
      console.log(`   Form Fields: ${template.defaultFormFields.length}`);
      console.log('');
      
      successCount++;
    } catch (error: any) {
      console.error(`❌ Error creating ${template.name}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n📊 Seeding Summary:');
  console.log(`   ✅ Success: ${successCount} templates`);
  console.log(`   ❌ Errors: ${errorCount} templates`);
  console.log(`   📦 Total: ${BUILT_IN_TEMPLATES.length} templates`);

  if (successCount === BUILT_IN_TEMPLATES.length) {
    console.log('\n🎉 All built-in templates seeded successfully!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some templates failed to seed. Please check the errors above.');
    process.exit(1);
  }
}

// Run the seed script
seedTemplates().catch((error) => {
  console.error('💥 Fatal error during seeding:', error);
  process.exit(1);
});
