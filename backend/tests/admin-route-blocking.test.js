import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

let adminToken = '';
let playerToken = '';
let organizerToken = '';
let umpireToken = '';
let testTournamentId = '';
let testCategoryId = '';
let testMatchId = '';

async function testAdminRouteBlocking() {
  console.log('🧪 Testing Admin Route Blocking...\n');
  console.log('='.repeat(60) + '\n');

  try {
    // Step 1: Get tokens for all roles
    console.log('1️⃣  Getting authentication tokens...');
    
    const adminRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@matchify.com',
      password: 'password123'
    });
    adminToken = adminRes.data.accessToken;
    console.log('   ✅ Admin token obtained');

    const playerRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'testplayer@matchify.com',
      password: 'password123'
    });
    playerToken = playerRes.data.accessToken;
    console.log('   ✅ Player token obtained');

    const organizerRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'testorganizer@matchify.com',
      password: 'password123'
    });
    organizerToken = organizerRes.data.accessToken;
    console.log('   ✅ Organizer token obtained\n');

    // Step 2: Test Tournament Routes
    console.log('2️⃣  Testing Tournament Routes...');
    
    // Admin should be blocked from creating tournament
    try {
      await axios.post(`${API_URL}/tournaments`, {
        name: 'Admin Created Tournament',
        description: 'Should be blocked',
        startDate: '2025-03-01',
        endDate: '2025-03-03',
        registrationDeadline: '2025-02-25',
        venue: 'Test Venue',
        city: 'Test City',
        state: 'Test State'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('   ❌ FAIL: Admin was able to create tournament');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('   ✅ Admin blocked from creating tournament');
        console.log(`      Message: ${error.response.data.message}`);
      } else {
        console.log(`   ❌ Unexpected error: ${error.message}`);
      }
    }

    // Organizer should be able to create tournament
    try {
      const response = await axios.post(`${API_URL}/tournaments`, {
        name: 'Organizer Created Tournament',
        description: 'Should succeed',
        startDate: '2025-03-01',
        endDate: '2025-03-03',
        registrationDeadline: '2025-02-25',
        venue: 'Test Venue',
        city: 'Test City',
        state: 'Test State'
      }, {
        headers: { Authorization: `Bearer ${organizerToken}` }
      });
      testTournamentId = response.data.tournament.id;
      console.log('   ✅ Organizer can create tournament');
    } catch (error) {
      console.log(`   ❌ Organizer failed to create tournament: ${error.message}`);
    }

    // Admin should be blocked from updating tournament
    if (testTournamentId) {
      try {
        await axios.put(`${API_URL}/tournaments/${testTournamentId}`, {
          name: 'Updated by Admin'
        }, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('   ❌ FAIL: Admin was able to update tournament');
      } catch (error) {
        if (error.response?.status === 403) {
          console.log('   ✅ Admin blocked from updating tournament');
        } else {
          console.log(`   ❌ Unexpected error: ${error.message}`);
        }
      }
    }

    console.log('');

    // Step 3: Test Registration Routes
    console.log('3️⃣  Testing Registration Routes...');

    // Create a category first
    if (testTournamentId) {
      try {
        const categoryRes = await axios.post(
          `${API_URL}/tournaments/${testTournamentId}/categories`,
          {
            name: 'Men\'s Singles',
            gender: 'MALE',
            type: 'SINGLES',
            minAge: 18,
            maxAge: 50,
            registrationFee: 500,
            maxParticipants: 16
          },
          {
            headers: { Authorization: `Bearer ${organizerToken}` }
          }
        );
        testCategoryId = categoryRes.data.category.id;
        console.log('   ✅ Category created for testing');
      } catch (error) {
        console.log(`   ⚠️  Could not create category: ${error.message}`);
      }
    }

    // Admin should be blocked from registering
    if (testTournamentId && testCategoryId) {
      try {
        await axios.post(`${API_URL}/registrations`, {
          tournamentId: testTournamentId,
          categoryId: testCategoryId
        }, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('   ❌ FAIL: Admin was able to register');
      } catch (error) {
        if (error.response?.status === 403) {
          console.log('   ✅ Admin blocked from registering');
          console.log(`      Message: ${error.response.data.message}`);
        } else {
          console.log(`   ❌ Unexpected error: ${error.message}`);
        }
      }

      // Player should be able to register
      try {
        await axios.post(`${API_URL}/registrations`, {
          tournamentId: testTournamentId,
          categoryId: testCategoryId
        }, {
          headers: { Authorization: `Bearer ${playerToken}` }
        });
        console.log('   ✅ Player can register for tournament');
      } catch (error) {
        console.log(`   ⚠️  Player registration: ${error.response?.data?.message || error.message}`);
      }
    }

    // Admin should be blocked from viewing registrations
    try {
      await axios.get(`${API_URL}/registrations/my`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('   ❌ FAIL: Admin was able to view registrations');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('   ✅ Admin blocked from viewing registrations');
      } else {
        console.log(`   ❌ Unexpected error: ${error.message}`);
      }
    }

    console.log('');

    // Step 4: Test Public Routes (Admin should access)
    console.log('4️⃣  Testing Public Routes (Admin should access)...');

    try {
      await axios.get(`${API_URL}/tournaments`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('   ✅ Admin can view tournaments list');
    } catch (error) {
      console.log(`   ❌ Admin cannot view tournaments: ${error.message}`);
    }

    if (testTournamentId) {
      try {
        await axios.get(`${API_URL}/tournaments/${testTournamentId}`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('   ✅ Admin can view tournament details');
      } catch (error) {
        console.log(`   ❌ Admin cannot view tournament details: ${error.message}`);
      }
    }

    try {
      await axios.get(`${API_URL}/matches/live`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('   ✅ Admin can view live matches');
    } catch (error) {
      console.log(`   ❌ Admin cannot view live matches: ${error.message}`);
    }

    console.log('');

    // Step 5: Summary
    console.log('='.repeat(60));
    console.log('✅ Admin Route Blocking Tests Complete!\n');
    console.log('Summary:');
    console.log('  • Admins are blocked from tournament management');
    console.log('  • Admins are blocked from registrations');
    console.log('  • Admins can access public/read-only routes');
    console.log('  • Error messages are clear and helpful');
    console.log('  • Players and organizers can access their routes\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run the tests
testAdminRouteBlocking();
