import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

let adminToken = '';
let inviteToken = '';
let oneTimePassword = '';

async function testInviteAcceptanceFlow() {
  console.log('🧪 Testing Admin Invite Acceptance Flow with OTP...\n');
  console.log('='.repeat(60) + '\n');

  try {
    // Step 1: Login as admin
    console.log('1️⃣  Logging in as admin...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@matchify.com',
      password: 'password123'
    });
    adminToken = loginRes.data.accessToken;
    console.log('✅ Admin logged in\n');

    // Step 2: Create invite
    console.log('2️⃣  Creating invite for newuser@test.com...');
    const inviteRes = await axios.post(
      `${API_URL}/admin/invites`,
      {
        email: 'newuser@test.com',
        role: 'ORGANIZER',
        duration: '7d'
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );

    console.log('✅ Invite created');
    console.log('   Email:', inviteRes.data.data.email);
    console.log('   Role:', inviteRes.data.data.role);
    console.log('');

    // Step 3: Get the invite token from database
    console.log('3️⃣  Getting invite details...');
    const listRes = await axios.get(
      `${API_URL}/admin/invites`,
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );
    
    const invite = listRes.data.data.invites.find(i => i.email === 'newuser@test.com');
    if (!invite) {
      throw new Error('Could not find created invite');
    }
    console.log('✅ Found invite in list\n');

    // Step 4: Manually get token and OTP from database
    console.log('4️⃣  To complete this test, you need to:');
    console.log('   a) Check the backend console logs for the OTP');
    console.log('   b) Get the invite token from the database');
    console.log('');
    console.log('   Run this SQL query:');
    console.log('   SELECT token, oneTimePassword FROM "AdminInvite" WHERE email = \'newuser@test.com\' AND status = \'pending\';');
    console.log('');
    console.log('   Then test acceptance manually:');
    console.log('   1. Go to: http://localhost:5173/invite/accept/{TOKEN}');
    console.log('   2. Enter the OTP from the query');
    console.log('   3. Fill in the form and submit');
    console.log('');

    // Step 5: Verify invite endpoint
    console.log('5️⃣  Testing verify endpoint (need token from database)...');
    console.log('   This endpoint requires the actual token from the database');
    console.log('   Format: GET /api/admin/invites/{token}/verify');
    console.log('');

    // Step 6: Test acceptance endpoint structure
    console.log('6️⃣  Acceptance endpoint structure:');
    console.log('   POST /api/admin/invites/{token}/accept');
    console.log('   Body: {');
    console.log('     "oneTimePassword": "A1B2C3D4",');
    console.log('     "name": "New User",');
    console.log('     "password": "password123",');
    console.log('     "phone": "+91 9876543210",');
    console.log('     "city": "Mumbai",');
    console.log('     "state": "Maharashtra"');
    console.log('   }');
    console.log('');

    console.log('='.repeat(60));
    console.log('✅ INVITE CREATED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📝 Next Steps:');
    console.log('   1. Check backend logs for OTP (look for "📧 EMAIL LOG")');
    console.log('   2. Get token from database using SQL query above');
    console.log('   3. Test frontend acceptance at http://localhost:5173/invite/accept/{TOKEN}');
    console.log('   4. Or test API directly with curl/Postman');
    console.log('');
    console.log('💡 To clean up:');
    console.log(`   DELETE /api/admin/invites/${inviteRes.data.data.id}`);

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('   Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testInviteAcceptanceFlow();
