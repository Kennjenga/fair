/**
 * Test script to check profile API and generate a test token
 */
import { generateToken } from '../lib/auth/jwt';
import { findAdminByEmail } from '../lib/repositories/admins';

async function testProfileAPI() {
  try {
    console.log('🔍 Testing Profile API...\n');

    // Find the admin user
    const email = 'kinyagia10@gmail.com';
    console.log(`Looking up admin: ${email}`);
    
    const admin = await findAdminByEmail(email);
    
    if (!admin) {
      console.error('❌ Admin not found');
      return;
    }

    console.log('✅ Admin found:');
    console.log(`   ID: ${admin.admin_id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Display Name: ${admin.display_name || 'Not set'}`);
    console.log(`   Phone: ${admin.phone || 'Not set'}\n`);

    // Generate a fresh token
    const token = generateToken({
      adminId: admin.admin_id,
      email: admin.email,
      role: admin.role,
    });

    console.log('✅ Generated fresh JWT token:\n');
    console.log(token);
    console.log('\n📋 To use this token:');
    console.log('1. Open your browser DevTools (F12)');
    console.log('2. Go to Console tab');
    console.log('3. Paste and run:');
    console.log(`   localStorage.setItem('auth_token', '${token}');`);
    console.log(`   localStorage.setItem('admin', '${JSON.stringify({ adminId: admin.admin_id, email: admin.email, role: admin.role })}');`);
    console.log('4. Refresh the page\n');

    // Test the token by making a fetch request
    const testUrl = 'http://localhost:3000/api/v1/admin/profile';
    console.log(`🧪 Testing API endpoint: ${testUrl}`);
    
    const response = await fetch(testUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Profile API is working!');
      console.log('   Profile data:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('   ❌ Profile API failed:', errorText);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

testProfileAPI();
