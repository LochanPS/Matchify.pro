import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Test credentials
const testUmpire = {
  email: 'testumpire@matchify.com',
  password: 'password123'
};

const testOrganizer = {
  email: 'testorganizer@matchify.com',
  password: 'password123'
};

let authToken = '';
let testMatchId = '';

// Helper function for colored output
const log = {
  success: (msg) => console.log('\x1b[32m✓\x1b[0m', msg),
  error: (msg) => console.log('\x1b[31m✗\x1b[0m', msg),
  info: (msg) => console.log('\x1b[36mℹ\x1b[0m', msg),
  section: (msg) => console.log('\n\x1b[1m' + msg + '\x1b[0m')
};

// Test 1: Login as Organizer
async function testLogin() {
  log.section('TEST 1: Login as Organizer');
  try {
    const response = await axios.post(`${API_URL}/auth/login`, testOrganizer);
    authToken = response.data.token;
    log.success('Login successful');
    log.info(`Token: ${authToken.substring(0, 20)}...`);
    return true;
  } catch (error) {
    log.error(`Login failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Test 2: Get Tournament Matches
async function testGetTournamentMatches() {
  log.section('TEST 2: Get Tournament Matches');
  try {
    // First, get a tournament
    const tournamentsResponse = await axios.get(`${API_URL}/tournaments?limit=1`);
    if (tournamentsResponse.data.tournaments.length === 0) {
      log.error('No tournaments found');
      return false;
    }
    
    const tournamentId = tournamentsResponse.data.tournaments[0].id;
    log.info(`Testing with tournament: ${tournamentId}`);
    
    const response = await axios.get(`${API_URL}/tournaments/${tournamentId}/matches`);
    log.success('Tournament matches fetched');
    log.info(`Total matches: ${response.data.matches.length}`);
    
    if (response.data.matches.length > 0) {
      testMatchId = response.data.matches[0].id;
      log.info(`Using match ID: ${testMatchId}`);
    }
    
    return true;
  } catch (error) {
    log.error(`Failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Test 3: Get Single Match
async function testGetMatch() {
  log.section('TEST 3: Get Single Match');
  
  if (!testMatchId) {
    log.error('No test match ID available');
    return false;
  }
  
  try {
    const response = await axios.get(`${API_URL}/matches/${testMatchId}`);
    log.success('Match details fetched');
    log.info(`Match: ${response.data.match.matchNumber}`);
    log.info(`Status: ${response.data.match.status}`);
    log.info(`Round: ${response.data.match.round}`);
    return true;
  } catch (error) {
    log.error(`Failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Test 4: Start Match
async function testStartMatch() {
  log.section('TEST 4: Start Match');
  
  if (!testMatchId) {
    log.error('No test match ID available');
    return false;
  }
  
  try {
    const response = await axios.post(
      `${API_URL}/matches/${testMatchId}/start`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    log.success('Match started');
    log.info(`Current set: ${response.data.score.currentSet}`);
    log.info(`Score: ${response.data.score.currentScore.player1}-${response.data.score.currentScore.player2}`);
    return true;
  } catch (error) {
    log.error(`Failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Test 5: Add Points (Player 1 scores 5 points)
async function testAddPoints() {
  log.section('TEST 5: Add Points (Player 1 scores 5 points)');
  
  if (!testMatchId) {
    log.error('No test match ID available');
    return false;
  }
  
  try {
    for (let i = 0; i < 5; i++) {
      const response = await axios.post(
        `${API_URL}/matches/${testMatchId}/score`,
        { player: 'player1' },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      log.info(`Point ${i + 1}: ${response.data.score.currentScore.player1}-${response.data.score.currentScore.player2}`);
    }
    log.success('5 points added successfully');
    return true;
  } catch (error) {
    log.error(`Failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Test 6: Add Points for Player 2
async function testAddPointsPlayer2() {
  log.section('TEST 6: Add Points (Player 2 scores 3 points)');
  
  if (!testMatchId) {
    log.error('No test match ID available');
    return false;
  }
  
  try {
    for (let i = 0; i < 3; i++) {
      const response = await axios.post(
        `${API_URL}/matches/${testMatchId}/score`,
        { player: 'player2' },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      log.info(`Point ${i + 1}: ${response.data.score.currentScore.player1}-${response.data.score.currentScore.player2}`);
    }
    log.success('3 points added for player 2');
    return true;
  } catch (error) {
    log.error(`Failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Test 7: Undo Last Point
async function testUndoPoint() {
  log.section('TEST 7: Undo Last Point');
  
  if (!testMatchId) {
    log.error('No test match ID available');
    return false;
  }
  
  try {
    const response = await axios.post(
      `${API_URL}/matches/${testMatchId}/undo`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    log.success('Last point undone');
    log.info(`Score after undo: ${response.data.score.currentScore.player1}-${response.data.score.currentScore.player2}`);
    return true;
  } catch (error) {
    log.error(`Failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Test 8: Verify Score History
async function testScoreHistory() {
  log.section('TEST 8: Verify Score History');
  
  if (!testMatchId) {
    log.error('No test match ID available');
    return false;
  }
  
  try {
    const response = await axios.get(`${API_URL}/matches/${testMatchId}`);
    const score = response.data.match.scoreJson;
    
    if (score && score.history) {
      log.success('Score history exists');
      log.info(`Total points in history: ${score.history.length}`);
      log.info(`Current score: ${score.currentScore.player1}-${score.currentScore.player2}`);
      log.info(`Current server: ${score.currentServer}`);
      return true;
    } else {
      log.error('No score history found');
      return false;
    }
  } catch (error) {
    log.error(`Failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Test 9: Test Without Auth (Should Fail)
async function testUnauthorized() {
  log.section('TEST 9: Test Without Auth (Should Fail)');
  
  if (!testMatchId) {
    log.error('No test match ID available');
    return false;
  }
  
  try {
    await axios.post(
      `${API_URL}/matches/${testMatchId}/score`,
      { player: 'player1' }
    );
    log.error('Unauthorized access allowed (SECURITY ISSUE!)');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      log.success('Unauthorized access correctly blocked');
      return true;
    }
    log.error(`Unexpected error: ${error.message}`);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║   MATCHIFY SCORING API TESTS 🎾      ║');
  console.log('╚═══════════════════════════════════════╝\n');

  const results = [];

  // Run tests
  results.push(await testLogin());
  results.push(await testGetTournamentMatches());
  results.push(await testGetMatch());
  results.push(await testStartMatch());
  results.push(await testAddPoints());
  results.push(await testAddPointsPlayer2());
  results.push(await testUndoPoint());
  results.push(await testScoreHistory());
  results.push(await testUnauthorized());

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
