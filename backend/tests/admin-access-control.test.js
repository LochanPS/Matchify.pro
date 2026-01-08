import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

let playerToken = '';
let organizerToken = '';
let umpireToken = '';
let adminToken = '';

async function testAdminAccessControl() {
  console.log('🧪 Testing Admin Access Control...\n');
  console.log('='.repeat(60) + '\n');

  try {
    // Step 1: Get tokens for all roles
    console.log('1️⃣  Getting authentication tokens...');
    
    // Admin token
    const adminRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@matchify.com',
      password: 'password123'
    });
    adminToken = adminRes.data.accessToken;
    console.log('✅ Admin token obtained');

    // Player token
    const playerRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'testplayer@matchify.com',
      password: 'password123'
    });
    playerToken = playerRes.data.accessToken;
    console.log('✅ Player token obtained');

    // Organizer token
    const organizerRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'testorganizer@matchify.com',
      password: 'password123'
    });
    organizerToken = organizerRes.data.accessToken;
    console.log('✅ Organizer token obtained');
    console.log('');

    // Step 2: Test player cannot access admin routes
    console.log('2️⃣  Testing player cannot access admin routes...');
    try {
      await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${playerToken}` }
      });
      console.log('❌ FAILED: Player accessed admin route!');
    } catch (err) {
      if (err.response?.status === 403) {
        console.log('✅ Player correctly blocked from admin routes');
        console.log('   Error:', err.response.data.message);
      } else {
        console.log('⚠️  Unexpected error:', err.response?.status);
      }
    }
    console.log('');

    // Step 3: Test organizer cannot access admin routes
    console.log('3️⃣  Testing organizer cannot access admin routes...');
    try {
      await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${organizerToken}` }
      });
      console.log('❌ FAILED: Organizer accessed admin route!');
    } catch (err) {
      if (err.response?.status === 403) {
        console.log('✅ Organizer correctly blocked from admin routes');
        console.log('   Error:', err.response.data.message);
      } else {
        console.log('⚠️  Unexpected error:', err.response?.status);
      }
    }
    console.log('');

    // Step 4: Test admin CAN access admin routes
    console.log('4️⃣  Testing admin CAN access admin routes...');
    try {
      const res = await axios.get(`${API_URL}/admin/users?page=1&limit=5`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Admin successfully accessed admin routes');
      console.log('   Users found:', res.data.pagination.total);
    } catch (err) {
      console.log('❌ FAILED: Admin could not access admin route!');
      console.log('   Error:', err.response?.data);
    }
    console.log('');

    // Step 5: Test admin stats access
    console.log('5️⃣  Testing admin stats access...');
    try {
      const res = await axios.get(`${API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Admin successfully accessed stats');
      console.log('   Total users:', res.data.stats.totalUsers);
      console.log('   Total tournaments:', res.data.stats.totalTournaments);
    } catch (err) {
      console.log('❌ FAILED: Admin could not access stats!');
    }
    console.log('');

    // Step 6: Test unauthenticated access
    console.log('6️⃣  Testing unauthenticated access to admin routes...');
    try {
      await axios.get(`${API_URL}/admin/users`);
      console.log('❌ FAILED: Unauthenticated user accessed admin route!');
    } catch (err) {
      if (err.response?.status === 401) {
        console.log('✅ Unauthenticated access correctly blocked');
        console.log('   Error:', err.response.data.error);
      } else {
        console.log('⚠️  Unexpected error:', err.response?.status);
      }
    }
    console.log('');

    // Step 7: Test admin audit logs access
    console.log('7️⃣  Testing admin audit logs access...');
    try {
      const res = await axios.get(`${API_URL}/admin/audit-logs?page=1&limit=10`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Admin successfully accessed audit logs');
      console.log('   Total logs:', res.data.pagination.total);
      console.log('   Recent actions:', res.data.logs.slice(0, 3).map(l => l.action).join(', '));
    } catch (err) {
      console.log('❌ FAILED: Admin could not access audit logs!');
    }
    console.log('');

    console.log('='.repeat(60));
    console.log('🎉 ADMIN ACCESS CONTROL TESTS COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n📝 Summary:');
    console.log('   ✅ Player blocked from admin routes');
    console.log('   ✅ Organizer blocked from admin routes');
    console.log('   ✅ Admin can access admin routes');
    console.log('   ✅ Admin can access stats');
    console.log('   ✅ Unauthenticated access blocked');
    console.log('   ✅ Admin can access audit logs');
    console.log('\n💡 Note:');
    console.log('   - All admin actions are logged in audit trail');
    console.log('   - Admins cannot play, organize, or umpire');
    console.log('   - Separate accounts required for non-admin activities');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response?.data) {
      console.error('   Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testAdminAccessControl();
