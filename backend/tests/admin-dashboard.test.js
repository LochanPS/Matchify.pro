import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

let adminToken = '';
let testUserId = '';
let testTournamentId = '';

async function testAdminDashboard() {
  console.log('🧪 Testing Admin Dashboard Backend...\n');
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

    // Step 2: Get platform stats
    console.log('2️⃣  Getting platform statistics...');
    const statsRes = await axios.get(
      `${API_URL}/admin/stats`,
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );
    console.log('✅ Platform stats retrieved');
    console.log('   Total Users:', statsRes.data.stats.totalUsers);
    console.log('   Total Tournaments:', statsRes.data.stats.totalTournaments);
    console.log('   Total Registrations:', statsRes.data.stats.totalRegistrations);
    console.log('   Total Revenue:', statsRes.data.stats.totalRevenue);
    console.log('   Users by Role:', JSON.stringify(statsRes.data.stats.usersByRole));
    console.log('');

    // Step 3: List all users
    console.log('3️⃣  Listing all users...');
    const usersRes = await axios.get(
      `${API_URL}/admin/users?page=1&limit=5`,
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );
    console.log('✅ Users listed');
    console.log('   Total:', usersRes.data.pagination.total);
    console.log('   Page:', usersRes.data.pagination.page);
    console.log('   First user:', usersRes.data.users[0]?.name || 'None');
    
    // Get a test user (not admin)
    testUserId = usersRes.data.users.find(u => u.role !== 'ADMIN')?.id;
    console.log('   Test User ID:', testUserId || 'None found');
    console.log('');

    // Step 4: Get user details
    if (testUserId) {
      console.log('4️⃣  Getting user details...');
      const userDetailsRes = await axios.get(
        `${API_URL}/admin/users/${testUserId}`,
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );
      console.log('✅ User details retrieved');
      console.log('   Name:', userDetailsRes.data.user.name);
      console.log('   Email:', userDetailsRes.data.user.email);
      console.log('   Role:', userDetailsRes.data.user.role);
      console.log('   Registrations:', userDetailsRes.data.user.registrations.length);
      console.log('   Tournaments:', userDetailsRes.data.user.tournaments.length);
      console.log('');
    }

    // Step 5: Suspend user
    if (testUserId) {
      console.log('5️⃣  Suspending user...');
      const suspendRes = await axios.post(
        `${API_URL}/admin/users/${testUserId}/suspend`,
        {
          reason: 'Test suspension - violating platform rules',
          durationDays: 7
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );
      console.log('✅ User suspended');
      console.log('   Suspended until:', new Date(suspendRes.data.user.suspendedUntil).toLocaleDateString());
      console.log('   Reason:', suspendRes.data.user.suspensionReason);
      console.log('');
    }

    // Step 6: Unsuspend user
    if (testUserId) {
      console.log('6️⃣  Unsuspending user...');
      await axios.post(
        `${API_URL}/admin/users/${testUserId}/unsuspend`,
        {},
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );
      console.log('✅ User unsuspended');
      console.log('');
    }

    // Step 7: List tournaments
    console.log('7️⃣  Listing tournaments...');
    const tournamentsRes = await axios.get(
      `${API_URL}/admin/tournaments?page=1&limit=5`,
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );
    console.log('✅ Tournaments listed');
    console.log('   Total:', tournamentsRes.data.pagination.total);
    console.log('   First tournament:', tournamentsRes.data.tournaments[0]?.name || 'None');
    
    testTournamentId = tournamentsRes.data.tournaments[0]?.id;
    console.log('');

    // Step 8: Get audit logs
    console.log('8️⃣  Getting audit logs...');
    const auditLogsRes = await axios.get(
      `${API_URL}/admin/audit-logs?page=1&limit=10`,
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );
    console.log('✅ Audit logs retrieved');
    console.log('   Total logs:', auditLogsRes.data.pagination.total);
    console.log('   Recent actions:');
    auditLogsRes.data.logs.slice(0, 3).forEach(log => {
      console.log(`   - ${log.action} on ${log.entityType} by ${log.admin.name}`);
    });
    console.log('');

    // Step 9: Get entity-specific audit logs
    if (testUserId) {
      console.log('9️⃣  Getting user-specific audit logs...');
      const entityLogsRes = await axios.get(
        `${API_URL}/admin/audit-logs/USER/${testUserId}`,
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );
      console.log('✅ Entity audit logs retrieved');
      console.log('   Logs for this user:', entityLogsRes.data.logs.length);
      console.log('');
    }

    // Step 10: Search users
    console.log('🔟 Searching users...');
    const searchRes = await axios.get(
      `${API_URL}/admin/users?search=test&role=PLAYER`,
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );
    console.log('✅ User search completed');
    console.log('   Results:', searchRes.data.users.length);
    console.log('');

    console.log('='.repeat(60));
    console.log('🎉 ALL ADMIN DASHBOARD TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('\n📝 Summary:');
    console.log('   ✅ Platform statistics');
    console.log('   ✅ User management (list, details, search)');
    console.log('   ✅ User suspension/unsuspension');
    console.log('   ✅ Tournament management');
    console.log('   ✅ Audit logs (all & entity-specific)');
    console.log('\n💡 Note:');
    console.log('   - Tournament cancellation not tested (requires active tournament)');
    console.log('   - Test it manually with: DELETE /api/admin/tournaments/:id');
    console.log('   - Body: { "reason": "Test cancellation" }');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('   Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testAdminDashboard();
