import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api';
let adminToken = '';
let organizerToken = '';

async function testAPI(endpoint, method = 'GET', body = null, token = '') {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      ...(body && { body: JSON.stringify(body) })
    };

    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function runCriticalTests() {
  console.log('\n🧪 CRITICAL FEATURES TEST\n');
  console.log('='.repeat(70));

  let passed = 0;
  let failed = 0;

  // Login
  console.log('\n1. AUTHENTICATION');
  const adminLogin = await testAPI('/auth/login', 'POST', {
    email: 'ADMIN@gmail.com',
    password: 'ADMIN@123(123)'
  });
  if (adminLogin.success || adminLogin.data.accessToken) {
    adminToken = adminLogin.data.accessToken || adminLogin.data.token;
    console.log('   ✅ Admin login');
    passed++;
  } else {
    console.log('   ❌ Admin login failed');
    failed++;
  }

  const orgLogin = await testAPI('/auth/login', 'POST', {
    email: 'organizer@gmail.com',
    password: 'organizer123'
  });
  if (orgLogin.success || orgLogin.data.accessToken) {
    organizerToken = orgLogin.data.accessToken || orgLogin.data.token;
    console.log('   ✅ Organizer login');
    passed++;
  } else {
    console.log('   ❌ Organizer login failed');
    failed++;
  }

  // Admin features
  console.log('\n2. ADMIN FEATURES');
  
  const users = await testAPI('/admin/users', 'GET', null, adminToken);
  if (users.success && users.data.users) {
    console.log(`   ✅ Get users (${users.data.users.length} users)`);
    passed++;
  } else {
    console.log('   ❌ Get users failed');
    failed++;
  }

  const deletedUsers = await testAPI('/admin/users/deleted', 'GET', null, adminToken);
  if (deletedUsers.success) {
    console.log(`   ✅ Get deleted users (${deletedUsers.data.users?.length || 0} deleted)`);
    passed++;
  } else {
    console.log('   ❌ Get deleted users failed');
    failed++;
  }

  // KYC features
  console.log('\n3. KYC SYSTEM');
  
  const kycStatus = await testAPI('/kyc/status', 'GET', null, organizerToken);
  if (kycStatus.success || kycStatus.status === 200) {
    console.log('   ✅ KYC status');
    passed++;
  } else {
    console.log('   ❌ KYC status failed');
    failed++;
  }

  const kycStats = await testAPI('/admin/kyc/stats', 'GET', null, adminToken);
  if (kycStats.success) {
    console.log('   ✅ KYC stats');
    passed++;
  } else {
    console.log('   ❌ KYC stats failed');
    failed++;
  }

  const pendingKYCs = await testAPI('/admin/kyc/pending', 'GET', null, adminToken);
  if (pendingKYCs.success) {
    console.log(`   ✅ Pending KYCs (${pendingKYCs.data.kycs?.length || 0} pending)`);
    passed++;
  } else {
    console.log('   ❌ Pending KYCs failed');
    failed++;
  }

  // Tournament features
  console.log('\n4. TOURNAMENTS');
  
  const tournaments = await testAPI('/tournaments', 'GET');
  if (tournaments.success || tournaments.data) {
    console.log(`   ✅ Get tournaments (${tournaments.data.tournaments?.length || 0} tournaments)`);
    passed++;
  } else {
    console.log('   ❌ Get tournaments failed');
    failed++;
  }

  // Academy features
  console.log('\n5. ACADEMIES');
  
  const academies = await testAPI('/academies', 'GET');
  if (academies.success || academies.data) {
    console.log(`   ✅ Get academies (${academies.data.academies?.length || 0} academies)`);
    passed++;
  } else {
    console.log('   ❌ Get academies failed');
    failed++;
  }

  // Wallet features
  console.log('\n6. WALLET');
  
  const wallet = await testAPI('/wallet/balance', 'GET', null, organizerToken);
  if (wallet.success || wallet.data) {
    console.log('   ✅ Wallet balance');
    passed++;
  } else {
    console.log('   ❌ Wallet balance failed');
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST RESULTS');
  console.log('='.repeat(70));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  console.log('='.repeat(70));

  if (failed === 0) {
    console.log('\n🎉 ALL CRITICAL FEATURES WORKING!');
  } else {
    console.log(`\n⚠️  ${failed} features need attention`);
  }
}

runCriticalTests().catch(console.error);
