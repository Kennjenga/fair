/**
 * Test script for template API endpoints
 * Run with: tsx scripts/test-templates-api.ts
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const API_BASE = 'http://localhost:3000/api/v1';

async function testTemplatesAPI() {
  console.log('🧪 Testing Template API Endpoints\n');

  // You'll need to get an auth token first
  // For now, this is a placeholder that shows the test structure
  
  console.log('📝 Test Plan:');
  console.log('1. GET /api/v1/admin/templates - List all templates');
  console.log('2. GET /api/v1/admin/templates?filter=built-in - List built-in templates');
  console.log('3. GET /api/v1/admin/templates/:id - Get specific template');
  console.log('4. POST /api/v1/admin/templates - Create custom template');
  console.log('5. PATCH /api/v1/admin/templates/:id - Update custom template');
  console.log('6. DELETE /api/v1/admin/templates/:id - Delete custom template\n');

  console.log('⚠️  Note: You need to:');
  console.log('   1. Start the dev server: npm run dev');
  console.log('   2. Login as admin to get auth token');
  console.log('   3. Use the token in Authorization header\n');

  console.log('📖 Example cURL commands:\n');
  
  console.log('# List all templates');
  console.log('curl -H "Authorization: Bearer YOUR_TOKEN" \\');
  console.log(`  ${API_BASE}/admin/templates\n`);

  console.log('# List built-in templates only');
  console.log('curl -H "Authorization: Bearer YOUR_TOKEN" \\');
  console.log(`  "${API_BASE}/admin/templates?filter=built-in"\n`);

  console.log('# Get specific template');
  console.log('curl -H "Authorization: Bearer YOUR_TOKEN" \\');
  console.log(`  ${API_BASE}/admin/templates/TEMPLATE_ID\n`);

  console.log('# Create custom template');
  console.log('curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"name":"My Custom Template","governanceModel":"centralized","complexityLevel":"beginner","config":{"roles":[],"permissions":[],"evaluationLogic":{"method":"score"},"integrityRules":{"immutableAfterLaunch":true,"requireCommitments":true,"publicAuditLog":false,"allowVoteEditing":false},"outcomeLogic":{"calculationMethod":"simple_majority"}}}\' \\');
  console.log(`  ${API_BASE}/admin/templates\n`);

  console.log('✅ Test script ready!');
  console.log('   Start your dev server and use the cURL commands above to test.\n');
}

testTemplatesAPI();
