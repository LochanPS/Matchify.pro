import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Test credentials
const testPlayer = {
  email: 'testplayer@matchify.com',
  password: 'password123'
};

let authToken = '';

// Helper function for colored output
const log = {
  success: (msg) => console.log('\x1b[32m✓\x1b[0m', msg),
  error: (msg) => console.log('\x1b[31m✗\x1b[0m', msg),
  info: (msg) => console.log('\x1b[36mℹ\x1b[0m', msg),
  section: (msg) => console.log('\n\x1b[1m' + msg + '\x1b[0m')
};

// Test 1: Login
async function testLogin() {
  log.section('TEST 1: Login');
  try {
    const response = await axios.post(`${API_URL}/auth/login`, testPlayer);
    authToken = response.data.token;
    log.success('Login successful');
    log.info(`Token: ${authToken.substring(0, 20)}...`);
    return true;
  } catch (error) {
    log.error(`Login failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Test 2: Get Global Leaderboard
async function testGlobalLeaderboard() {
  log.section('TEST 2: Get Global Leaderboard');
  try {
    const response = await axios.get(`${API_URL}/leaderboard?scope=global&limit=10`);
    log.success('Global leaderboard fetched');
    log.info(`Total players: ${response.data.total}`);
    log.info(`Top 3 players:`);
    response.data.players.slice(0, 3).forEach((player, index) => {
      console.log(`  ${index + 1}. ${player.name} - ${player.matchify_points} points`);
    });
    return true;
  } catch (error) {
    log.error(`Failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Test 3: Get State Leaderboard
async function testStateLeaderboard() {
  log.section('TEST 3: Get State Leaderboard');
  try {
    const response = await axios.get(`${API_URL}/leaderboard?scope=state&state=Maharashtra&limit=10`);
    log.success('State leaderboard fetched');
    log.info(`Players in Maharashtra: ${response.data.total}`);
    return true;
  } catch (error) {
    log.error(`Failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Test 4: Get City Leaderboard
async function testCityLeaderboard() {
  log.section('TEST 4: Get City Leaderboard');
  try {
    const response = await axios.get(`${API_URL}/leaderboard?scope=city&city=Mumbai&state=Maharashtra&limit=10`);
    log.success('City leaderboard fetched');
    log.info(`Players in Mumbai: ${response.data.total}`);
    return true;
  } catch (error) {
    log.error(`Failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Test 5: Get My Points (Protected)
async function testMyPoints() {
  log.section('TEST 5: Get My Points (Protected)');
  try {
    const response = await axios.get(`${API_URL}/points/my`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    log.success('My points fetched');
    log.info(`Total points: ${response.data.total_points}`);
    log.info(`Global rank: #${response.data.rank}`);
    log.info(`Tournaments played: ${response.data.tournaments_played}`);
    log.info(`Points history entries: ${response.data.logs.length}`);
    return true;
  } catch (error) {
    log.error(`Failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Test 6: Get User Points (Public)
async function testUserPoints() {
  log.section('TEST 6: Get User Points (Public)');
  try {
    // Get first user from leaderboard
    const leaderboard = await axios.get(`${API_URL}/leaderboard?scope=global&limit=1`);
    const userId = leaderboard.data.players[0].id;
    
    const response = await axios.get(`${API_URL}/points/user/${userId}`);
    log.success('User points fetched');
    log.info(`User: ${response.data.user.name}`);
    log.info(`Total points: ${response.data.total_points}`);
    log.info(`Global rank: #${response.data.rank}`);
    return true;
  } catch (error) {
    log.error(`Failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Test 7: Leaderboard Without Auth (Public Access)
async function testPublicAccess() {
  log.section('TEST 7: Leaderboard Public Access');
  try {
    const response = await axios.get(`${API_URL}/leaderboard?scope=global`);
    log.success('Leaderboard accessible without authentication');
    log.info(`Players returned: ${response.data.players.length}`);
    return true;
  } catch (error) {
    log.error(`Failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Test 8: My Points Without Auth (Should Fail)
async function testProtectedRoute() {
  log.section('TEST 8: My Points Without Auth (Should Fail)');
  try {
    await axios.get(`${API_URL}/points/my`);
    log.error('Protected route accessible without auth (SECURITY ISSUE!)');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      log.success('Protected route correctly requires authentication');
      return true;
    }
    log.error(`Unexpected error: ${error.message}`);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║   MATCHIFY POINTS API TESTS 🏆       ║');
  console.log('╚═══════════════════════════════════════╝\n');

  const results = [];

  // Run tests
  results.push(await testLogin());
  results.push(await testGlobalLeaderboard());
  results.push(await testStateLeaderboard());
  results.push(await testCityLeaderboard());
  results.push(await testMyPoints());
  results.push(await testUserPoints());
  results.push(await testPublicAccess());
  results.push(await testProtectedRoute());

  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;

  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║           TEST SUMMARY                ║');
  console.log('╠═══════════════════════════════════════╣');
  console.log(`║  Passed: ${passed}/${total}                           ║`);
  console.log(`║  Failed: ${total - passed}/${total}                           ║`);
  console.log('╚═══════════════════════════════════════╝\n');

  if (passed === total) {
    log.success('ALL TESTS PASSED! 🎉');
  } else {
    log.error(`${total - passed} test(s) failed`);
  }

  process.exit(passed === total ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
