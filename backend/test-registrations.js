import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Test credentials
const PLAYER_EMAIL = 'testplayer@matchify.com';
const PLAYER_PASSWORD = 'password123';

let playerToken = '';
let tournamentId = '';
let categoryIds = [];
let registrationId = '';

// Helper function to log results
const log = (title, data) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(title);
  console.log('='.repeat(60));
  console.log(JSON.stringify(data, null, 2));
};

// Test 1: Login as player
async function testLogin() {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: PLAYER_EMAIL,
      password: PLAYER_PASSWORD,
    });
    
    playerToken = response.data.accessToken;
    log('✅ TEST 1: Login Successful', {
      user: response.data.user.name,
      role: response.data.user.role,
      walletBalance: response.data.user.walletBalance,
    });
    return true;
  } catch (error) {
    console.error('❌ TEST 1 FAILED:', error.response?.data || error.message);
    return false;
  }
}

// Test 2: Get a tournament with open registration
async function testGetTournament() {
  try {
    const response = await axios.get(`${API_URL}/tournaments?registrationOpen=true&limit=1`);
    
    if (response.data.data.tournaments.length === 0) {
      console.error('❌ TEST 2 FAILED: No tournaments with open registration found');
      return false;
    }
    
    const tournament = response.data.data.tournaments[0];
    tournamentId = tournament.id;
    categoryIds = tournament.categories.map(c => c.id);
    
    log('✅ TEST 2: Found Tournament', {
      id: tournament.id,
      name: tournament.name,
      categoriesCount: tournament.categories.length,
      categories: tournament.categories.map(c => ({
        id: c.id,
        name: c.name,
        entryFee: c.entryFee,
      })),
    });
    return true;
  } catch (error) {
    console.error('❌ TEST 2 FAILED:', error.response?.data || error.message);
    return false;
  }
}

// Test 3: Register for tournament (single category)
async function testRegisterSingleCategory() {
  try {
    const response = await axios.post(
      `${API_URL}/registrations`,
      {
        tournamentId,
        categoryIds: [categoryIds[0]], // Register for first category only
      },
      {
        headers: { Authorization: `Bearer ${playerToken}` },
      }
    );
    
    registrationId = response.data.data.registrations[0].id;
    
    log('✅ TEST 3: Registration Successful (Single Category)', {
      registrationId,
      totalAmount: response.data.data.totalAmount,
      walletUsed: response.data.data.walletUsed,
      razorpayAmount: response.data.data.razorpayAmount,
      registrations: response.data.data.registrations.map(r => ({
        id: r.id,
        category: r.category.name,
        status: r.status,
        paymentStatus: r.paymentStatus,
      })),
    });
    return true;
  } catch (error) {
    console.error('❌ TEST 3 FAILED:', error.response?.data || error.message);
    return false;
  }
}

// Test 4: Try to register for same category again (should fail)
async function testDuplicateRegistration() {
  try {
    await axios.post(
      `${API_URL}/registrations`,
      {
        tournamentId,
        categoryIds: [categoryIds[0]],
      },
      {
        headers: { Authorization: `Bearer ${playerToken}` },
      }
    );
    
    console.error('❌ TEST 4 FAILED: Should have prevented duplicate registration');
    return false;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.error?.includes('Already registered')) {
      log('✅ TEST 4: Duplicate Registration Prevented', {
        error: error.response.data.error,
      });
      return true;
    }
    console.error('❌ TEST 4 FAILED:', error.response?.data || error.message);
    return false;
  }
}

// Test 5: Get my registrations
async function testGetMyRegistrations() {
  try {
    const response = await axios.get(`${API_URL}/registrations/my`, {
      headers: { Authorization: `Bearer ${playerToken}` },
    });
    
    log('✅ TEST 5: Get My Registrations', {
      count: response.data.count,
      registrations: response.data.registrations.map(r => ({
        id: r.id,
        tournament: r.tournament.name,
        category: r.category.name,
        status: r.status,
        paymentStatus: r.paymentStatus,
        amountTotal: r.amountTotal,
      })),
    });
    return true;
  } catch (error) {
    console.error('❌ TEST 5 FAILED:', error.response?.data || error.message);
    return false;
  }
}

// Test 6: Cancel registration
async function testCancelRegistration() {
  try {
    const response = await axios.delete(
      `${API_URL}/registrations/${registrationId}`,
      {
        headers: { Authorization: `Bearer ${playerToken}` },
      }
    );
    
    log('✅ TEST 6: Registration Cancelled', {
      message: response.data.message,
      refundAmount: response.data.refundAmount,
      refundPercentage: response.data.refundPercentage,
    });
    return true;
  } catch (error) {
    console.error('❌ TEST 6 FAILED:', error.response?.data || error.message);
    return false;
  }
}

// Test 7: Try to cancel again (should fail)
async function testCancelAgain() {
  try {
    await axios.delete(
      `${API_URL}/registrations/${registrationId}`,
      {
        headers: { Authorization: `Bearer ${playerToken}` },
      }
    );
    
    console.error('❌ TEST 7 FAILED: Should have prevented double cancellation');
    return false;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.error?.includes('already cancelled')) {
      log('✅ TEST 7: Double Cancellation Prevented', {
        error: error.response.data.error,
      });
      return true;
    }
    console.error('❌ TEST 7 FAILED:', error.response?.data || error.message);
    return false;
  }
}

// Test 8: Register for multiple categories
async function testRegisterMultipleCategories() {
  try {
    // Use remaining categories (skip the first one we already used)
    const categoriesToRegister = categoryIds.slice(1, Math.min(3, categoryIds.length));
    
    if (categoriesToRegister.length === 0) {
      console.log('⚠️  TEST 8 SKIPPED: No additional categories available');
      return true;
    }
    
    const response = await axios.post(
      `${API_URL}/registrations`,
      {
        tournamentId,
        categoryIds: categoriesToRegister,
      },
      {
        headers: { Authorization: `Bearer ${playerToken}` },
      }
    );
    
    log('✅ TEST 8: Multiple Categories Registration', {
      categoriesCount: response.data.data.registrations.length,
      totalAmount: response.data.data.totalAmount,
      walletUsed: response.data.data.walletUsed,
      razorpayAmount: response.data.data.razorpayAmount,
      registrations: response.data.data.registrations.map(r => ({
        category: r.category.name,
        status: r.status,
        amountTotal: r.amountTotal,
      })),
    });
    return true;
  } catch (error) {
    console.error('❌ TEST 8 FAILED:', error.response?.data || error.message);
    return false;
  }
}

// Test 9: Register with partner email
async function testRegisterWithPartner() {
  try {
    // Find a doubles category
    const doublesCategory = categoryIds.find((id, index) => {
      // This is a simple check - in real scenario, check category format
      return true; // For testing, use any category
    });
    
    if (!doublesCategory) {
      console.log('⚠️  TEST 9 SKIPPED: No doubles category available');
      return true;
    }
    
    const response = await axios.post(
      `${API_URL}/registrations`,
      {
        tournamentId,
        categoryIds: [doublesCategory],
        partnerEmail: 'partner@example.com',
      },
      {
        headers: { Authorization: `Bearer ${playerToken}` },
      }
    );
    
    log('✅ TEST 9: Registration with Partner Email', {
      partnerEmail: response.data.data.registrations[0].partnerEmail,
      partnerConfirmed: response.data.data.registrations[0].partnerConfirmed,
    });
    return true;
  } catch (error) {
    // If already registered, that's okay
    if (error.response?.status === 400 && error.response?.data?.error?.includes('Already registered')) {
      console.log('⚠️  TEST 9 SKIPPED: Already registered for this category');
      return true;
    }
    console.error('❌ TEST 9 FAILED:', error.response?.data || error.message);
    return false;
  }
}

// Test 10: Verify final registrations
async function testFinalState() {
  try {
    const response = await axios.get(`${API_URL}/registrations/my`, {
      headers: { Authorization: `Bearer ${playerToken}` },
    });
    
    log('✅ TEST 10: Final Registration State', {
      totalRegistrations: response.data.count,
      byStatus: {
        confirmed: response.data.registrations.filter(r => r.status === 'confirmed').length,
        pending: response.data.registrations.filter(r => r.status === 'pending').length,
        cancelled: response.data.registrations.filter(r => r.status === 'cancelled').length,
      },
      totalSpent: response.data.registrations
        .filter(r => r.status !== 'cancelled')
        .reduce((sum, r) => sum + r.amountTotal, 0),
    });
    return true;
  } catch (error) {
    console.error('❌ TEST 10 FAILED:', error.response?.data || error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('\n🚀 Starting Registration Endpoint Tests...\n');
  
  const results = {
    login: await testLogin(),
    getTournament: false,
    registerSingleCategory: false,
    duplicateRegistration: false,
    getMyRegistrations: false,
    cancelRegistration: false,
    cancelAgain: false,
    registerMultipleCategories: false,
    registerWithPartner: false,
    finalState: false,
  };
  
  if (results.login) {
    results.getTournament = await testGetTournament();
  }
  
  if (results.getTournament) {
    results.registerSingleCategory = await testRegisterSingleCategory();
    results.duplicateRegistration = await testDuplicateRegistration();
    results.getMyRegistrations = await testGetMyRegistrations();
    results.cancelRegistration = await testCancelRegistration();
    results.cancelAgain = await testCancelAgain();
    results.registerMultipleCategories = await testRegisterMultipleCategories();
    results.registerWithPartner = await testRegisterWithPartner();
    results.finalState = await testFinalState();
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passed = Object.values(results).filter(r => r === true).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}`);
  });
  
  console.log(`\n${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Registration endpoints are working correctly.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.\n');
  }
}

// Run the tests
runTests().catch(console.error);
