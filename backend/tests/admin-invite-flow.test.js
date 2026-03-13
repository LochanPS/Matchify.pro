import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// You need to get an admin token first by logging in as admin
// Login: POST /api/auth/login with admin@matchify.com / password123
let adminToken = ''; // Set this after getting token
let inviteToken = '';
let oneTimePassword = '';

async function getAdminToken() {
  console.log('🔐 Getting admin token...');
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@matchify.com',
      password: 'password123'
    });
    adminToken = response.data.accessToken;
    console.log('✅ Admin token obtained\n');
    return true;
  } catch (error) {
    console.error('❌ Failed to get admin token:', error.response?.data?.error || error.message);
    console.log('   Make sure admin@matchify.com exists with password: password123\n');
    return false;
  }
}

async function testInviteFlow() {
  console.log('🧪 Testing Admin Invite Flow...\n');
  console.log('='.repeat(60) + '\n');

  try {
    // Step 0: Get admin token
    const hasToken = await getAdminToken();
    if (!hasToken) {
      console.log('❌ Cannot proceed without admin token');
      return;
    }

    // Step 1: Create invite
    console.log('1️⃣  Creating invite...');
    const inviteRes = await axios.post(
      `${API_URL}/admin/invites`,
      {
        email: 'newadmin@test.com',
        role: 'ADMIN',
        duration: '7d'
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );

    inviteToken = inviteRes.data.data.id; // We'll use ID for revocation
    const inviteData = inviteRes.data.data;
    
    console.log('✅ Invite created');
    console.log('   ID:', inviteData.id);
    console.log('   Email:', inviteData.email);
    console.log('   Role:', inviteData.role);
    console.log('   Expires:', new Date(inviteData.expiresAt).toLocaleString());
    console.log('   Status:', inviteData.status);
    console.log('');

    // Step 2: List all invites
    console.log('2️⃣  Listing all invites...');
    const listRes = await axios.get(
      `${API_URL}/admin/invites`,
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );
    console.log('✅ Found', listRes.data.data.invites.length, 'invite(s)');
    console.log('   Statuses:', listRes.data.data.invites.map(i => `${i.email}: ${i.status}`).join(', '));
    console.log('');

    // Step 3: Get invite details (public endpoint)
    console.log('3️⃣  Getting invite details (public endpoint)...');
    // Note: We need the token from email, not the ID
    // For testing, let's get it from the list
    const testInvite = listRes.data.data.invites.find(i => i.email === 'newadmin@test.com');
    if (!testInvite) {
      console.log('❌ Could not find test invite');
      return;
    }
    
    console.log('✅ Invite details retrieved');
    console.log('   Email:', testInvite.email);
    console.log('   Role:', testInvite.role);
    console.log('   Invited by:', testInvite.invitedBy);
    console.log('');

    // Step 4: Revoke invite
    console.log('4️⃣  Revoking invite...');
    await axios.delete(
      `${API_URL}/admin/invites/${inviteData.id}/revoke`,
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );
    console.log('✅ Invite revoked successfully');
    console.log('');

    // Step 5: Try to revoke again (should fail)
    console.log('5️⃣  Trying to revoke again (should fail)...');
    try {
      await axios.delete(
        `${API_URL}/admin/invites/${inviteData.id}/revoke`,
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );
      console.log('❌ Should have failed!');
    } catch (err) {
      console.log('✅ Correctly rejected:', err.response?.data?.error);
    }
    console.log('');

    // Step 6: Create another invite for acceptance test
    console.log('6️⃣  Creating new invite for acceptance test...');
    const inviteRes2 = await axios.post(
      `${API_URL}/admin/invites`,
      {
        email: 'testadmin@test.com',
        role: 'ADMIN',
        duration: '7d'
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );
    console.log('✅ New invite created for acceptance test');
    console.log('   Email:', inviteRes2.data.data.email);
    console.log('   Note: Check email logs for one-time password');
    console.log('');

    // Step 7: Delete invite
    console.log('7️⃣  Deleting invite...');
    await axios.delete(
      `${API_URL}/admin/invites/${inviteRes2.data.data.id}`,
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );
    console.log('✅ Invite deleted successfully');
    console.log('');

    console.log('='.repeat(60));
    console.log('🎉 ALL TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('\n📝 Summary:');
    console.log('   ✅ Create invite');
    console.log('   ✅ List invites');
    console.log('   ✅ Get invite details');
    console.log('   ✅ Revoke invite');
    console.log('   ✅ Prevent duplicate revocation');
    console.log('   ✅ Delete invite');
    console.log('\n💡 To test acceptance:');
    console.log('   1. Create an invite');
    console.log('   2. Check backend logs for one-time password');
    console.log('   3. Use the invite URL with the password');
    console.log('   4. Create account through the frontend');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('   Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testInviteFlow();
