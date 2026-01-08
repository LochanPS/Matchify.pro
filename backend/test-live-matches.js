import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

console.log('🧪 Testing Live Matches API\n');
console.log('===========================================\n');

async function testLiveMatches() {
  try {
    // Test 1: Get all live matches (anonymous)
    console.log('Test 1: GET /matches/live (anonymous)');
    const response1 = await axios.get(`${API_URL}/matches/live`);
    console.log('✅ Success!');
    console.log(`   Found ${response1.data.count} live matches`);
    if (response1.data.matches.length > 0) {
      console.log(`   First match: ${response1.data.matches[0].tournament.name}`);
      console.log(`   Category: ${response1.data.matches[0].category.name}`);
      console.log(`   Status: ${response1.data.matches[0].status}`);
    }
    console.log('');

    // Test 2: Get live matches with tournament filter
    console.log('Test 2: GET /matches/live?tournamentId=...');
    const response2 = await axios.get(`${API_URL}/matches/live`, {
      params: { tournamentId: 'some-tournament-id' }
    });
    console.log('✅ Success!');
    console.log(`   Found ${response2.data.count} matches for tournament`);
    console.log('');

    // Test 3: Get single match details
    if (response1.data.matches.length > 0) {
      const matchId = response1.data.matches[0].id;
      console.log(`Test 3: GET /matches/${matchId}/live`);
      const response3 = await axios.get(`${API_URL}/matches/${matchId}/live`);
      console.log('✅ Success!');
      console.log(`   Match: ${response3.data.match.tournament.name}`);
      console.log(`   Category: ${response3.data.match.category.name}`);
      console.log(`   Duration: ${response3.data.match.duration} minutes`);
      console.log('');
    }

    // Test 4: Get live matches with court filter
    console.log('Test 4: GET /matches/live?court=1');
    const response4 = await axios.get(`${API_URL}/matches/live`, {
      params: { court: 1 }
    });
    console.log('✅ Success!');
    console.log(`   Found ${response4.data.count} matches on court 1`);
    console.log('');

    console.log('===========================================');
    console.log('✅ All tests passed!');
    console.log('===========================================\n');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testLiveMatches();
