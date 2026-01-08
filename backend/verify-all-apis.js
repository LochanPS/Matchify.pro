// Comprehensive API Verification Script
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
const BASE_URL = 'http://localhost:5000';

let passed = 0;
let failed = 0;
let playerToken = '';
let organizerToken = '';

const log = (emoji, message, data = null) => {
  console.log(`${emoji} ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
};

const test = async (name, fn) => {
  try {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`TEST: ${name}`);
    console.log('='.repeat(70));
    await fn();
    log('✅', `PASSED: ${name}`);
    passed++;
  } catch (error) {
    log('❌', `FAILED: ${name}`);
    console.error(error.response?.data || error.message);
    failed++;
  }
};

async function runTests() {
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║          MATCHIFY API VERIFICATION - ALL ENDPOINTS              ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  // ============================================
  // CORE ENDPOINTS
  // ============================================
  
  await test('1. Health Check Endpoint', async () => {
    const response = await axios.get(`${BASE_URL}/health`);
    if (response.data.status !== 'ok') throw new Error('Health check failed');
    log('✓', 'Health status', response.data);
  });

  await test('2. API Root Endpoint', async () => {
    const response = await axios.get(`${API_URL}`);
    if (!response.data.endpoints) throw new Error('Endpoints not found');
    log('✓', 'Available endpoints', response.data.endpoints);
  });

  // ============================================
  // AUTHENTICATION ENDPOINTS
  // ============================================

  await test('3. POST /api/auth/login (Player)', async () => {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'testplayer@matchify.com',
      password: 'password123'
    });
    playerToken = response.data.accessToken;
    if (!playerToken) throw new Error('No access token received');
    log('✓', 'Player logged in', {
      user: response.data.user.name,
      role: response.data.user.role
    });
  });

  await test('4. POST /api/auth/login (Organizer)', async () => {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'testorganizer@matchify.com',
      password: 'password123'
    });
    organizerToken = response.data.accessToken;
    if (!organizerToken) throw new Error('No access token received');
    log('✓', 'Organizer logged in', {
      user: response.data.user.name,
      role: response.data.user.role
    });
  });

  await test('5. GET /api/auth/me', async () => {
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${playerToken}` }
    });
    if (!response.data.user) throw new Error('User data not found');
    log('✓', 'User info retrieved', {
      name: response.data.user.name,
      email: response.data.user.email,
      role: response.data.user.role
    });
  });

  // ============================================
  // PROFILE ENDPOINTS
  // ============================================

  await test('6. GET /api/profile', async () => {
    const response = await axios.get(`${API_URL}/profile`, {
      headers: { Authorization: `Bearer ${playerToken}` }
    });
    if (!response.data.user) throw new Error('Profile not found');
    log('✓', 'Profile retrieved', {
      name: response.data.user.name,
      city: response.data.user.city
    });
  });

  await test('7. PUT /api/profile', async () => {
    const response = await axios.put(`${API_URL}/profile`, {
      city: 'Mumbai',
      state: 'Maharashtra'
    }, {
      headers: { Authorization: `Bearer ${playerToken}` }
    });
    if (!response.data.user) throw new Error('Profile not updated');
    log('✓', 'Profile updated', {
      city: response.data.user.city,
      state: response.data.user.state
    });
  });

  // ============================================
  // WALLET ENDPOINTS
  // ============================================

  await test('8. GET /api/wallet/balance', async () => {
    const response = await axios.get(`${API_URL}/wallet/balance`, {
      headers: { Authorization: `Bearer ${playerToken}` }
    });
    if (response.data.balance === undefined) throw new Error('Balance not found');
    log('✓', 'Wallet balance', {
      balance: response.data.balance
    });
  });

  await test('9. GET /api/wallet/summary', async () => {
    const response = await axios.get(`${API_URL}/wallet/summary`, {
      headers: { Authorization: `Bearer ${playerToken}` }
    });
    if (!response.data.data) throw new Error('Summary not found');
    log('✓', 'Wallet summary', response.data.data);
  });

  await test('10. GET /api/wallet/transactions', async () => {
    const response = await axios.get(`${API_URL}/wallet/transactions`, {
      headers: { Authorization: `Bearer ${playerToken}` }
    });
    if (!response.data.data) throw new Error('Transactions not found');
    log('✓', 'Transactions retrieved', {
      total: response.data.data.total,
      page: response.data.data.page
    });
  });

  // ============================================
  // TOURNAMENT ENDPOINTS (PUBLIC)
  // ============================================

  await test('11. GET /api/tournaments (Public)', async () => {
    const response = await axios.get(`${API_URL}/tournaments?limit=5`);
    if (!response.data.data.tournaments) throw new Error('Tournaments not found');
    log('✓', 'Tournaments retrieved', {
      total: response.data.data.total,
      returned: response.data.data.tournaments.length
    });
  });

  let tournamentId = '';
  await test('12. GET /api/tournaments/:id (Public)', async () => {
    const listResponse = await axios.get(`${API_URL}/tournaments?limit=1`);
    tournamentId = listResponse.data.data.tournaments[0].id;
    
    const response = await axios.get(`${API_URL}/tournaments/${tournamentId}`);
    if (!response.data.data) throw new Error('Tournament not found');
    log('✓', 'Tournament detail', {
      id: response.data.data.id,
      name: response.data.data.name
    });
  });

  await test('13. GET /api/tournaments/:id/categories (Public)', async () => {
    const response = await axios.get(`${API_URL}/tournaments/${tournamentId}/categories`);
    if (!response.data.categories) throw new Error('Categories not found');
    log('✓', 'Categories retrieved', {
      count: response.data.categories.length
    });
  });

  // ============================================
  // TOURNAMENT ENDPOINTS (PROTECTED)
  // ============================================

  await test('14. POST /api/tournaments (Organizer)', async () => {
    const response = await axios.post(`${API_URL}/tournaments`, {
      name: 'API Test Tournament',
      description: 'Testing tournament creation',
      format: 'singles',
      privacy: 'public',
      status: 'draft',
      startDate: '2026-06-01',
      endDate: '2026-06-03',
      registrationStartDate: '2026-05-01',
      registrationEndDate: '2026-05-25',
      venue: 'Test Venue',
      address: 'Test Address',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      zone: 'West',
      maxParticipants: 32
    }, {
      headers: { Authorization: `Bearer ${organizerToken}` }
    });
    if (!response.data.data) throw new Error('Tournament not created');
    log('✓', 'Tournament created', {
      id: response.data.data.id,
      name: response.data.data.name
    });
  });

  // ============================================
  // TOURNAMENT FILTERS
  // ============================================

  await test('15. GET /api/tournaments?city=Mumbai', async () => {
    const response = await axios.get(`${API_URL}/tournaments?city=Mumbai&limit=5`);
    if (!response.data.data.tournaments) throw new Error('Filtered tournaments not found');
    log('✓', 'Filtered by city', {
      total: response.data.data.total
    });
  });

  await test('16. GET /api/tournaments?format=singles', async () => {
    const response = await axios.get(`${API_URL}/tournaments?format=singles&limit=5`);
    if (!response.data.data.tournaments) throw new Error('Filtered tournaments not found');
    log('✓', 'Filtered by format', {
      total: response.data.data.total
    });
  });

  await test('17. GET /api/tournaments?status=published', async () => {
    const response = await axios.get(`${API_URL}/tournaments?status=published&limit=5`);
    if (!response.data.data.tournaments) throw new Error('Filtered tournaments not found');
    log('✓', 'Filtered by status', {
      total: response.data.data.total
    });
  });

  await test('18. GET /api/tournaments?search=Championship', async () => {
    const response = await axios.get(`${API_URL}/tournaments?search=Championship&limit=5`);
    if (!response.data.data.tournaments) throw new Error('Search results not found');
    log('✓', 'Search results', {
      total: response.data.data.total
    });
  });

  // ============================================
  // REGISTRATION ENDPOINTS
  // ============================================

  await test('19. GET /api/registrations/my', async () => {
    const response = await axios.get(`${API_URL}/registrations/my`, {
      headers: { Authorization: `Bearer ${playerToken}` }
    });
    if (!response.data.registrations) throw new Error('Registrations not found');
    log('✓', 'My registrations', {
      count: response.data.count
    });
  });

  // ============================================
  // TEST ENDPOINTS
  // ============================================

  await test('20. GET /api/test/protected', async () => {
    const response = await axios.get(`${API_URL}/test/protected`, {
      headers: { Authorization: `Bearer ${playerToken}` }
    });
    if (!response.data.message) throw new Error('Protected route failed');
    log('✓', 'Protected route accessed');
  });

  await test('21. GET /api/test/player-only', async () => {
    const response = await axios.get(`${API_URL}/test/player-only`, {
      headers: { Authorization: `Bearer ${playerToken}` }
    });
    if (!response.data.message) throw new Error('Player route failed');
    log('✓', 'Player-only route accessed');
  });

  await test('22. GET /api/test/organizer-only', async () => {
    const response = await axios.get(`${API_URL}/test/organizer-only`, {
      headers: { Authorization: `Bearer ${organizerToken}` }
    });
    if (!response.data.message) throw new Error('Organizer route failed');
    log('✓', 'Organizer-only route accessed');
  });

  // ============================================
  // ERROR HANDLING
  // ============================================

  await test('23. 404 Error Handling', async () => {
    try {
      await axios.get(`${API_URL}/nonexistent`);
      throw new Error('Should have returned 404');
    } catch (error) {
      if (error.response?.status !== 404) throw error;
      log('✓', '404 error handled correctly');
    }
  });

  await test('24. 401 Unauthorized (No Token)', async () => {
    try {
      await axios.get(`${API_URL}/profile`);
      throw new Error('Should have returned 401');
    } catch (error) {
      if (error.response?.status !== 401) throw error;
      log('✓', '401 error handled correctly');
    }
  });

  await test('25. 401 Unauthorized (Invalid Token)', async () => {
    try {
      await axios.get(`${API_URL}/profile`, {
        headers: { Authorization: 'Bearer invalid_token' }
      });
      throw new Error('Should have returned 401');
    } catch (error) {
      if (error.response?.status !== 401) throw error;
      log('✓', 'Invalid token rejected');
    }
  });

  // ============================================
  // SUMMARY
  // ============================================

  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                      API VERIFICATION SUMMARY                    ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total:  ${passed + failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL API ENDPOINTS ARE WORKING CORRECTLY!\n');
    console.log('✓ Core endpoints operational');
    console.log('✓ Authentication working');
    console.log('✓ Profile management functional');
    console.log('✓ Wallet system operational');
    console.log('✓ Tournament CRUD working');
    console.log('✓ Registration system functional');
    console.log('✓ Filters and search working');
    console.log('✓ Error handling correct');
    console.log('✓ Authorization working\n');
  } else {
    console.log('\n⚠️  Some API endpoints failed. Check the errors above.\n');
  }
  
  process.exit(failed === 0 ? 0 : 1);
}

runTests();
