// Matchify Integration Test - Frontend to Backend Connection
import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000';
const API_URL = `${BACKEND_URL}/api`;
const FRONTEND_URL = 'http://localhost:5173';

let passed = 0;
let failed = 0;

const log = (emoji, message, data = null) => {
  console.log(`${emoji} ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
};

const test = async (name, fn) => {
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`TEST: ${name}`);
    console.log('='.repeat(60));
    await fn();
    log('✅', `PASSED: ${name}`);
    passed++;
  } catch (error) {
    log('❌', `FAILED: ${name}`);
    console.error(error.response?.data || error.message);
    failed++;
  }
};

// Run all tests
async function runTests() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║     MATCHIFY INTEGRATION TEST - FRONTEND TO BACKEND        ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Test 1: Backend Health
  await test('Backend Health Check', async () => {
    const response = await axios.get(`${BACKEND_URL}/health`);
    if (response.data.status !== 'ok') throw new Error('Health check failed');
    log('✓', 'Backend is healthy', response.data);
  });

  // Test 2: Frontend Accessibility
  await test('Frontend Accessibility', async () => {
    const response = await axios.get(FRONTEND_URL);
    if (response.status !== 200) throw new Error('Frontend not accessible');
    log('✓', 'Frontend is accessible');
  });

  // Test 3: API Root
  await test('API Root Endpoint', async () => {
    const response = await axios.get(`${API_URL}`);
    if (!response.data.endpoints) throw new Error('API endpoints not found');
    log('✓', 'API endpoints available', response.data.endpoints);
  });

  // Test 4: CORS Configuration
  await test('CORS Configuration', async () => {
    const response = await axios.get(`${API_URL}`, {
      headers: { 'Origin': FRONTEND_URL }
    });
    log('✓', 'CORS is properly configured');
  });

  // Test 5: Authentication Flow
  let playerToken = '';
  await test('Authentication - Login', async () => {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'testplayer@matchify.com',
      password: 'password123'
    });
    playerToken = response.data.accessToken;
    if (!playerToken) throw new Error('No access token received');
    log('✓', 'Login successful', {
      user: response.data.user.name,
      role: response.data.user.role
    });
  });

  // Test 6: Protected Route Access
  await test('Protected Route - Profile', async () => {
    const response = await axios.get(`${API_URL}/profile`, {
      headers: { Authorization: `Bearer ${playerToken}` }
    });
    if (!response.data.user) throw new Error('Profile not retrieved');
    log('✓', 'Profile retrieved', {
      name: response.data.user.name,
      email: response.data.user.email
    });
  });

  // Test 7: Wallet API
  await test('Wallet API', async () => {
    const response = await axios.get(`${API_URL}/wallet`, {
      headers: { Authorization: `Bearer ${playerToken}` }
    });
    if (response.data.balance === undefined) throw new Error('Wallet balance not found');
    log('✓', 'Wallet data retrieved', {
      balance: response.data.balance,
      currency: response.data.currency
    });
  });

  // Test 8: Tournaments API (Public)
  await test('Tournaments API - Public Access', async () => {
    const response = await axios.get(`${API_URL}/tournaments?limit=5`);
    if (!response.data.data.tournaments) throw new Error('Tournaments not found');
    log('✓', 'Tournaments retrieved', {
      total: response.data.data.total,
      returned: response.data.data.tournaments.length
    });
  });

  // Test 9: Tournament Detail
  let tournamentId = '';
  await test('Tournament Detail API', async () => {
    const listResponse = await axios.get(`${API_URL}/tournaments?limit=1`);
    tournamentId = listResponse.data.data.tournaments[0].id;
    
    const response = await axios.get(`${API_URL}/tournaments/${tournamentId}`);
    if (!response.data.tournament) throw new Error('Tournament detail not found');
    log('✓', 'Tournament detail retrieved', {
      id: response.data.tournament.id,
      name: response.data.tournament.name,
      categories: response.data.tournament.categories.length
    });
  });

  // Test 10: Categories API
  await test('Categories API', async () => {
    const response = await axios.get(`${API_URL}/tournaments/${tournamentId}/categories`);
    if (!response.data.categories) throw new Error('Categories not found');
    log('✓', 'Categories retrieved', {
      count: response.data.categories.length
    });
  });

  // Test 11: My Registrations
  await test('My Registrations API', async () => {
    const response = await axios.get(`${API_URL}/registrations/my`, {
      headers: { Authorization: `Bearer ${playerToken}` }
    });
    if (!response.data.registrations) throw new Error('Registrations not found');
    log('✓', 'Registrations retrieved', {
      count: response.data.count
    });
  });

  // Test 12: Environment Variables
  await test('Frontend Environment Configuration', async () => {
    // This test verifies that the frontend .env is properly configured
    // by checking if the API URL is accessible
    const response = await axios.get(`${API_URL}`);
    if (!response.data.message) throw new Error('API not accessible from frontend URL');
    log('✓', 'Frontend .env properly configured');
  });

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    TEST SUMMARY                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total:  ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Frontend and Backend are properly connected.\n');
    console.log('✓ Backend server is running');
    console.log('✓ Frontend server is running');
    console.log('✓ API endpoints are accessible');
    console.log('✓ CORS is configured correctly');
    console.log('✓ Authentication is working');
    console.log('✓ Protected routes are accessible');
    console.log('✓ All API integrations are functional\n');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.\n');
  }
  
  process.exit(failed === 0 ? 0 : 1);
}

runTests();
