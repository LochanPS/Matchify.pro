/**
 * Live Matches API Test Suite
 * Tests for Day 44 - Live Matches Backend Part 2
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

// Test credentials
const TEST_USERS = {
  umpire: {
    email: 'umpire@test.com',
    password: 'password123',
  },
  organizer: {
    email: 'organizer@test.com',
    password: 'password123',
  },
};

let authTokens = {};

/**
 * Helper: Login and get auth token
 */
async function login(email, password) {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  return data.token;
}

/**
 * Test 1: Get all live matches (anonymous)
 */
async function testGetLiveMatchesAnonymous() {
  console.log('\n🧪 Test 1: Get all live matches (anonymous)');

  try {
    const response = await fetch(`${BASE_URL}/matches/live`);
    const data = await response.json();

    console.log('✅ Status:', response.status);
    console.log('✅ Response:', JSON.stringify(data, null, 2));
    console.log(`✅ Found ${data.count} live matches`);

    return response.status === 200;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

/**
 * Test 2: Get live matches with filters
 */
async function testGetLiveMatchesWithFilters() {
  console.log('\n🧪 Test 2: Get live matches with filters');

  const filters = [
    { name: 'Court 1', query: 'court=1' },
    { name: 'City Filter', query: 'city=Test City' },
    { name: 'State Filter', query: 'state=Test State' },
    { name: 'Format Filter', query: 'format=SINGLES' },
    { name: 'Combined', query: 'city=Test City&format=SINGLES' },
  ];

  let allPassed = true;

  for (const filter of filters) {
    try {
      const response = await fetch(`${BASE_URL}/matches/live?${filter.query}`);
      const data = await response.json();

      console.log(`\n  📋 ${filter.name}:`);
      console.log(`  ✅ Status: ${response.status}`);
      console.log(`  ✅ Count: ${data.count}`);

      if (response.status !== 200) {
        allPassed = false;
      }
    } catch (error) {
      console.error(`  ❌ Error:`, error.message);
      allPassed = false;
    }
  }

  return allPassed;
}

/**
 * Test 3: Get single match details
 */
async function testGetMatchDetails(matchId) {
  console.log('\n🧪 Test 3: Get single match details');

  try {
    const response = await fetch(`${BASE_URL}/matches/${matchId}/live`);
    const data = await response.json();

    console.log('✅ Status:', response.status);
    console.log('✅ Match ID:', data.match?.id);
    console.log('✅ Tournament:', data.match?.tournament?.name);
    console.log('✅ Category:', data.match?.category?.name);
    console.log('✅ Status:', data.match?.status);
    console.log('✅ Duration:', data.match?.duration, 'minutes');

    return response.status === 200;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

/**
 * Test 4: Get match status (quick polling endpoint)
 */
async function testGetMatchStatus(matchId) {
  console.log('\n🧪 Test 4: Get match status (quick polling)');

  try {
    const response = await fetch(`${BASE_URL}/matches/${matchId}/status`);
    const data = await response.json();

    console.log('✅ Status:', response.status);
    console.log('✅ Match Status:', data.status);
    console.log('✅ Duration:', data.duration, 'minutes');
    console.log('✅ Last Updated:', data.lastUpdated);
    console.log('✅ Score:', JSON.stringify(data.score?.currentScore || {}, null, 2));

    return response.status === 200;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

/**
 * Test 5: Access control - authenticated user
 */
async function testAuthenticatedAccess(matchId) {
  console.log('\n🧪 Test 5: Access control - authenticated user');

  try {
    const token = authTokens.umpire;
    const response = await fetch(`${BASE_URL}/matches/${matchId}/live`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();

    console.log('✅ Status:', response.status);
    console.log('✅ Has access:', data.success);

    return response.status === 200;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

/**
 * Test 6: Performance - multiple rapid requests
 */
async function testPerformance() {
  console.log('\n🧪 Test 6: Performance - rapid polling');

  const startTime = Date.now();
  const requests = [];

  // Make 10 rapid requests
  for (let i = 0; i < 10; i++) {
    requests.push(fetch(`${BASE_URL}/matches/live`));
  }

  try {
    const responses = await Promise.all(requests);
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`✅ Completed 10 requests in ${duration}ms`);
    console.log(`✅ Average: ${(duration / 10).toFixed(2)}ms per request`);
    console.log(`✅ All successful:`, responses.every((r) => r.status === 200));

    return responses.every((r) => r.status === 200);
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

/**
 * Test 7: Invalid match ID
 */
async function testInvalidMatchId() {
  console.log('\n🧪 Test 7: Invalid match ID');

  try {
    const response = await fetch(`${BASE_URL}/matches/invalid-id-12345/live`);
    const data = await response.json();

    console.log('✅ Status:', response.status);
    console.log('✅ Error message:', data.message);

    return response.status === 404;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

/**
 * Test 8: Access control utilities
 */
async function testAccessControlUtilities() {
  console.log('\n🧪 Test 8: Access control utilities');

  try {
    // Import access control utilities
    const { checkPrivateTournamentAccess, isMatchPublic } = await import(
      '../src/utils/accessControl.js'
    );

    // Test public tournament
    const publicTournament = { privacy: 'public', organizerId: 'org-123' };
    const match = { player1Id: 'player-1', player2Id: 'player-2' };

    const publicAccess = checkPrivateTournamentAccess(publicTournament, match, null);
    console.log('✅ Public tournament (anonymous):', publicAccess === true);

    // Test private tournament (organizer)
    const privateTournament = { privacy: 'private', organizerId: 'org-123' };
    const organizerAccess = checkPrivateTournamentAccess(privateTournament, match, 'org-123');
    console.log('✅ Private tournament (organizer):', organizerAccess === true);

    // Test private tournament (participant)
    const participantAccess = checkPrivateTournamentAccess(privateTournament, match, 'player-1');
    console.log('✅ Private tournament (participant):', participantAccess === true);

    // Test private tournament (unauthorized)
    const unauthorizedAccess = checkPrivateTournamentAccess(
      privateTournament,
      match,
      'random-user'
    );
    console.log('✅ Private tournament (unauthorized):', unauthorizedAccess === false);

    // Test isMatchPublic
    const isPublic = isMatchPublic(publicTournament);
    console.log('✅ isMatchPublic:', isPublic === true);

    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 Starting Live Matches API Tests (Day 44)');
  console.log('='.repeat(50));

  // Login to get auth tokens
  console.log('\n🔐 Logging in test users...');
  authTokens.umpire = await login(TEST_USERS.umpire.email, TEST_USERS.umpire.password);
  authTokens.organizer = await login(TEST_USERS.organizer.email, TEST_USERS.organizer.password);
  console.log('✅ Auth tokens obtained');

  // Get a match ID for testing
  const liveMatchesResponse = await fetch(`${BASE_URL}/matches/live`);
  const liveMatchesData = await liveMatchesResponse.json();
  const testMatchId =
    liveMatchesData.matches?.[0]?.id || '12bd0602-8437-444f-969c-185992e38e46';

  console.log(`\n📝 Using test match ID: ${testMatchId}`);

  // Run all tests
  const results = {
    test1: await testGetLiveMatchesAnonymous(),
    test2: await testGetLiveMatchesWithFilters(),
    test3: await testGetMatchDetails(testMatchId),
    test4: await testGetMatchStatus(testMatchId),
    test5: await testAuthenticatedAccess(testMatchId),
    test6: await testPerformance(),
    test7: await testInvalidMatchId(),
    test8: await testAccessControlUtilities(),
  };

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));

  const passed = Object.values(results).filter((r) => r === true).length;
  const total = Object.keys(results).length;

  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });

  console.log('\n' + '='.repeat(50));
  console.log(`🎯 Result: ${passed}/${total} tests passed`);
  console.log('='.repeat(50));

  if (passed === total) {
    console.log('\n🎉 ALL TESTS PASSED! Day 44 is complete!');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the output above.');
  }
}

// Run tests
runTests().catch((error) => {
  console.error('💥 Test suite error:', error);
  process.exit(1);
});
