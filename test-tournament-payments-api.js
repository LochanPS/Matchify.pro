// Test Tournament Payments API
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Admin credentials
const ADMIN_EMAIL = 'ADMIN@gmail.com';
const ADMIN_PASSWORD = 'ADMIN@123(123)';

async function testTournamentPaymentsAPI() {
  try {
    console.log('🔐 Logging in as admin...');
    
    // Login as admin
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Logged in successfully');
    
    const headers = {
      'Authorization': `Bearer ${token}`
    };
    
    // Test 1: Get tournament payments
    console.log('\n📊 Test 1: Get tournament payments...');
    const paymentsResponse = await axios.get(`${BASE_URL}/admin/tournament-payments`, { headers });
    console.log('✅ Response:', {
      success: paymentsResponse.data.success,
      count: paymentsResponse.data.data.length,
      payments: paymentsResponse.data.data.map(p => ({
        tournament: p.tournament.name,
        totalCollected: p.totalCollected,
        registrations: p.totalRegistrations,
        platformFee: p.platformFeeAmount,
        organizerShare: p.organizerShare
      }))
    });
    
    // Test 2: Get payment stats
    console.log('\n📊 Test 2: Get payment stats...');
    const statsResponse = await axios.get(`${BASE_URL}/admin/tournament-payments/stats/overview`, { headers });
    console.log('✅ Stats:', statsResponse.data.data);
    
    // Test 3: Get pending payouts
    console.log('\n📊 Test 3: Get pending payouts...');
    const payoutsResponse = await axios.get(`${BASE_URL}/admin/tournament-payments/pending/payouts`, { 
      headers,
      params: { type: 'all' }
    });
    console.log('✅ Response:', {
      success: payoutsResponse.data.success,
      count: payoutsResponse.data.data.length,
      payouts: payoutsResponse.data.data.map(p => ({
        tournament: p.tournament.name,
        organizer: p.tournament.organizer.name,
        totalCollected: p.totalCollected,
        payout50_1: p.payout50Percent1,
        payout50_2: p.payout50Percent2,
        status1: p.payout50Status1,
        status2: p.payout50Status2
      }))
    });
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testTournamentPaymentsAPI();
