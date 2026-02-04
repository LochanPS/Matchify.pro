import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = 'http://localhost:5000/api';

// Test credentials
const PLAYER_CREDENTIALS = {
  email: 'rajesh.kumar@gmail.com',
  password: 'password123'
};

const ORGANIZER_CREDENTIALS = {
  email: 'organizer1@test.com',
  password: 'password123'
};

let playerToken = null;
let organizerToken = null;
let testRegistrationId = null;
let testTournamentId = null;

// Helper function to login
async function login(email, password) {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password
    });
    return response.data.token;
  } catch (error) {
    console.error(`❌ Login failed for ${email}:`, error.response?.data || error.message);
    throw error;
  }
}

// Helper function to create a test tournament
async function createTestTournament(token) {
  try {
    const response = await axios.post(
      `${API_URL}/tournaments`,
      {
        name: 'Cancellation Test Tournament',
        description: 'Testing cancellation and refund flow',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        registrationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        venue: 'Test Venue',
        city: 'Bangalore',
        state: 'Karnataka',
        maxParticipants: 32,
        categories: [
          {
            name: 'Men\'s Singles',
            format: 'singles',
            gender: 'male',
            entryFee: 500,
            maxParticipants: 16
          }
        ]
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data.tournament;
  } catch (error) {
    console.error('❌ Failed to create tournament:', error.response?.data || error.message);
    throw error;
  }
}

// Helper function to register for tournament
async function registerForTournament(token, tournamentId, categoryId) {
  try {
    const response = await axios.post(
      `${API_URL}/registrations`,
      {
        tournamentId,
        categoryId,
        paymentMethod: 'upi'
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data.registration;
  } catch (error) {
    console.error('❌ Registration failed:', error.response?.data || error.message);
    throw error;
  }
}

// Test 1: Player requests cancellation
async function testPlayerCancellation() {
  console.log('\n📝 TEST 1: Player Requests Cancellation');
  console.log('='.repeat(60));

  try {
    const formData = new FormData();
    formData.append('reason', 'I have an urgent family commitment and cannot attend the tournament. Please process my refund.');
    formData.append('upiId', 'testplayer@paytm');

    const response = await axios.post(
      `${API_URL}/registrations/${testRegistrationId}/cancel`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${playerToken}`,
          ...formData.getHeaders()
        }
      }
    );

    console.log('✅ Cancellation request submitted successfully');
    console.log('   Message:', response.data.message);
    console.log('   Refund Amount: ₹' + response.data.refundAmount);
    return true;
  } catch (error) {
    console.error('❌ Cancellation request failed:', error.response?.data || error.message);
    return false;
  }
}

// Test 2: Organizer views cancellation requests
async function testOrganizerViewRequests() {
  console.log('\n📋 TEST 2: Organizer Views Cancellation Requests');
  console.log('='.repeat(60));

  try {
    const response = await axios.get(
      `${API_URL}/organizer/cancellation-requests`,
      {
        headers: { Authorization: `Bearer ${organizerToken}` }
      }
    );

    console.log('✅ Fetched cancellation requests');
    console.log('   Total Requests:', response.data.count);
    
    if (response.data.requests.length > 0) {
      const request = response.data.requests[0];
      console.log('\n   Latest Request:');
      console.log('   - Player:', request.user.name);
      console.log('   - Tournament:', request.tournament.name);
      console.log('   - Category:', request.category.name);
      console.log('   - Amount: ₹' + request.amountTotal);
      console.log('   - Reason:', request.cancellationReason);
      console.log('   - UPI ID:', request.refundUpiId);
      console.log('   - Status:', request.status);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to fetch requests:', error.response?.data || error.message);
    return false;
  }
}

// Test 3: Organizer approves refund
async function testOrganizerApproveRefund() {
  console.log('\n✅ TEST 3: Organizer Approves Refund');
  console.log('='.repeat(60));

  try {
    const response = await axios.put(
      `${API_URL}/organizer/registrations/${testRegistrationId}/approve-refund`,
      {},
      {
        headers: { Authorization: `Bearer ${organizerToken}` }
      }
    );

    console.log('✅ Refund approved successfully');
    console.log('   Message:', response.data.message);
    console.log('   Registration Status:', response.data.registration.status);
    console.log('   Refund Status:', response.data.registration.refundStatus);
    return true;
  } catch (error) {
    console.error('❌ Approve refund failed:', error.response?.data || error.message);
    return false;
  }
}

// Test 4: Organizer marks refund as completed
async function testOrganizerCompleteRefund() {
  console.log('\n💰 TEST 4: Organizer Marks Refund as Completed');
  console.log('='.repeat(60));

  try {
    const response = await axios.put(
      `${API_URL}/organizer/registrations/${testRegistrationId}/complete-refund`,
      {},
      {
        headers: { Authorization: `Bearer ${organizerToken}` }
      }
    );

    console.log('✅ Refund marked as completed');
    console.log('   Message:', response.data.message);
    console.log('   Refund Status:', response.data.registration.refundStatus);
    return true;
  } catch (error) {
    console.error('❌ Complete refund failed:', error.response?.data || error.message);
    return false;
  }
}

// Test 5: Verify registration status
async function testVerifyFinalStatus() {
  console.log('\n🔍 TEST 5: Verify Final Registration Status');
  console.log('='.repeat(60));

  try {
    const response = await axios.get(
      `${API_URL}/registrations/${testRegistrationId}`,
      {
        headers: { Authorization: `Bearer ${playerToken}` }
      }
    );

    const reg = response.data.registration;
    console.log('✅ Final registration status:');
    console.log('   Registration Status:', reg.status);
    console.log('   Payment Status:', reg.paymentStatus);
    console.log('   Refund Status:', reg.refundStatus);
    console.log('   Refund Amount: ₹' + reg.refundAmount);
    console.log('   Refund UPI ID:', reg.refundUpiId);
    console.log('   Cancelled At:', reg.cancelledAt);
    
    return reg.status === 'cancelled' && reg.refundStatus === 'completed';
  } catch (error) {
    console.error('❌ Failed to verify status:', error.response?.data || error.message);
    return false;
  }
}

// Test 6: Test rejection flow (create new registration)
async function testRejectionFlow() {
  console.log('\n🚫 TEST 6: Test Refund Rejection Flow');
  console.log('='.repeat(60));

  try {
    // Create new registration
    const tournament = await createTestTournament(organizerToken);
    const categoryId = tournament.categories[0].id;
    const registration = await registerForTournament(playerToken, tournament.id, categoryId);
    
    console.log('✅ Created new test registration:', registration.id);

    // Request cancellation
    const formData = new FormData();
    formData.append('reason', 'Testing rejection flow - please reject this request');
    formData.append('upiId', 'testplayer@paytm');

    await axios.post(
      `${API_URL}/registrations/${registration.id}/cancel`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${playerToken}`,
          ...formData.getHeaders()
        }
      }
    );

    console.log('✅ Cancellation request submitted');

    // Organizer rejects
    const rejectResponse = await axios.put(
      `${API_URL}/organizer/registrations/${registration.id}/reject-refund`,
      {
        reason: 'Tournament is starting soon, cannot process refund at this time'
      },
      {
        headers: { Authorization: `Bearer ${organizerToken}` }
      }
    );

    console.log('✅ Refund rejected successfully');
    console.log('   Message:', rejectResponse.data.message);
    console.log('   Registration Status:', rejectResponse.data.registration.status);
    console.log('   Refund Status:', rejectResponse.data.registration.refundStatus);
    console.log('   Rejection Reason:', rejectResponse.data.registration.refundRejectionReason);

    return rejectResponse.data.registration.status === 'confirmed' && 
           rejectResponse.data.registration.refundStatus === 'rejected';
  } catch (error) {
    console.error('❌ Rejection flow failed:', error.response?.data || error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('\n🧪 CANCELLATION & REFUND SYSTEM - COMPREHENSIVE TEST');
  console.log('='.repeat(60));

  try {
    // Step 1: Login as player
    console.log('\n🔐 Logging in as player...');
    playerToken = await login(PLAYER_CREDENTIALS.email, PLAYER_CREDENTIALS.password);
    console.log('✅ Player logged in successfully');

    // Step 2: Login as organizer
    console.log('\n🔐 Logging in as organizer...');
    organizerToken = await login(ORGANIZER_CREDENTIALS.email, ORGANIZER_CREDENTIALS.password);
    console.log('✅ Organizer logged in successfully');

    // Step 3: Create test tournament
    console.log('\n🏆 Creating test tournament...');
    const tournament = await createTestTournament(organizerToken);
    testTournamentId = tournament.id;
    console.log('✅ Tournament created:', tournament.name);
    console.log('   Tournament ID:', tournament.id);

    // Step 4: Register player for tournament
    console.log('\n📝 Registering player for tournament...');
    const categoryId = tournament.categories[0].id;
    const registration = await registerForTournament(playerToken, testTournamentId, categoryId);
    testRegistrationId = registration.id;
    console.log('✅ Player registered successfully');
    console.log('   Registration ID:', registration.id);
    console.log('   Amount: ₹' + registration.amountTotal);

    // Run all tests
    const results = {
      playerCancellation: await testPlayerCancellation(),
      organizerViewRequests: await testOrganizerViewRequests(),
      organizerApproveRefund: await testOrganizerApproveRefund(),
      organizerCompleteRefund: await testOrganizerCompleteRefund(),
      verifyFinalStatus: await testVerifyFinalStatus(),
      rejectionFlow: await testRejectionFlow()
    };

    // Print summary
    console.log('\n\n📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log('Player Cancellation Request:    ', results.playerCancellation ? '✅ PASS' : '❌ FAIL');
    console.log('Organizer View Requests:        ', results.organizerViewRequests ? '✅ PASS' : '❌ FAIL');
    console.log('Organizer Approve Refund:       ', results.organizerApproveRefund ? '✅ PASS' : '❌ FAIL');
    console.log('Organizer Complete Refund:      ', results.organizerCompleteRefund ? '✅ PASS' : '❌ FAIL');
    console.log('Verify Final Status:            ', results.verifyFinalStatus ? '✅ PASS' : '❌ FAIL');
    console.log('Rejection Flow:                 ', results.rejectionFlow ? '✅ PASS' : '❌ FAIL');
    console.log('='.repeat(60));

    const allPassed = Object.values(results).every(r => r === true);
    if (allPassed) {
      console.log('\n🎉 ALL TESTS PASSED! Cancellation & Refund system is fully functional!');
    } else {
      console.log('\n⚠️  SOME TESTS FAILED. Please review the errors above.');
    }

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests();
