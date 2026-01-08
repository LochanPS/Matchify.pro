import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Test credentials (use an existing organizer account)
const ORGANIZER_EMAIL = 'testorganizer@matchify.com';
const ORGANIZER_PASSWORD = 'password123';

let accessToken = '';
let tournamentId = '';

// Helper function to log results
const log = (title, data) => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(title);
  console.log('='.repeat(50));
  console.log(JSON.stringify(data, null, 2));
};

// Test 1: Login as organizer
async function testLogin() {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: ORGANIZER_EMAIL,
      password: ORGANIZER_PASSWORD,
    });
    
    accessToken = response.data.accessToken;
    log('✅ TEST 1: Login Successful', {
      user: response.data.user.name,
      role: response.data.user.role,
    });
    return true;
  } catch (error) {
    console.error('❌ TEST 1 FAILED:', error.response?.data || error.message);
    return false;
  }
}

// Test 2: Create a test tournament
async function testCreateTournament() {
  try {
    const response = await axios.post(
      `${API_URL}/tournaments`,
      {
        name: 'Category Test Tournament',
        description: 'This is a test tournament for testing category endpoints',
        venue: 'Test Stadium',
        address: '123 Test Street',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
        zone: 'South',
        country: 'India',
        format: 'both',
        privacy: 'public',
        registrationOpenDate: new Date(Date.now() + 86400000).toISOString(),
        registrationCloseDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        startDate: new Date(Date.now() + 10 * 86400000).toISOString(),
        endDate: new Date(Date.now() + 12 * 86400000).toISOString(),
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    
    // Handle different response structures
    const tournament = response.data.data?.tournament || response.data.tournament;
    tournamentId = tournament.id;
    
    log('✅ TEST 2: Tournament Created', {
      id: tournamentId,
      name: tournament.name,
    });
    return true;
  } catch (error) {
    console.error('❌ TEST 2 FAILED:', error.response?.data || error.message);
    return false;
  }
}

// Test 3: Create categories
async function testCreateCategories() {
  const categories = [
    {
      name: "Men's Singles Open",
      format: 'singles',
      gender: 'MALE',
      ageGroup: 'Open',
      entryFee: 500,
      maxParticipants: 32,
      scoringFormat: 'best_of_3',
    },
    {
      name: "Women's Doubles U-19",
      format: 'doubles',
      gender: 'FEMALE',
      ageGroup: 'U-19',
      entryFee: 400,
      maxParticipants: 16,
      scoringFormat: 'best_of_3',
    },
    {
      name: "Mixed Doubles Open",
      format: 'doubles',
      gender: 'OPEN',
      ageGroup: 'Open',
      entryFee: 600,
      maxParticipants: null,
      scoringFormat: 'best_of_5',
    },
  ];

  try {
    const createdCategories = [];
    
    for (const category of categories) {
      const response = await axios.post(
        `${API_URL}/tournaments/${tournamentId}/categories`,
        category,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      createdCategories.push(response.data.category);
    }
    
    log('✅ TEST 3: Categories Created', {
      count: createdCategories.length,
      categories: createdCategories.map(c => ({
        id: c.id,
        name: c.name,
        format: c.format,
        gender: c.gender,
        entryFee: c.entryFee,
      })),
    });
    return true;
  } catch (error) {
    console.error('❌ TEST 3 FAILED:', error.response?.data || error.message);
    return false;
  }
}

// Test 4: Get all categories
async function testGetCategories() {
  try {
    const response = await axios.get(
      `${API_URL}/tournaments/${tournamentId}/categories`
    );
    
    log('✅ TEST 4: Get Categories', {
      count: response.data.count,
      categories: response.data.categories.map(c => c.name),
    });
    return true;
  } catch (error) {
    console.error('❌ TEST 4 FAILED:', error.response?.data || error.message);
    return false;
  }
}

// Test 5: Update a category
async function testUpdateCategory() {
  try {
    // First get categories to get an ID
    const getResponse = await axios.get(
      `${API_URL}/tournaments/${tournamentId}/categories`
    );
    
    const categoryId = getResponse.data.categories[0].id;
    
    const response = await axios.put(
      `${API_URL}/tournaments/${tournamentId}/categories/${categoryId}`,
      {
        entryFee: 550,
        maxParticipants: 64,
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    
    log('✅ TEST 5: Category Updated', {
      id: response.data.category.id,
      name: response.data.category.name,
      oldFee: 500,
      newFee: response.data.category.entryFee,
      oldMax: 32,
      newMax: response.data.category.maxParticipants,
    });
    return true;
  } catch (error) {
    console.error('❌ TEST 5 FAILED:', error.response?.data || error.message);
    return false;
  }
}

// Test 6: Delete a category
async function testDeleteCategory() {
  try {
    // Get categories to get an ID
    const getResponse = await axios.get(
      `${API_URL}/tournaments/${tournamentId}/categories`
    );
    
    const categoryId = getResponse.data.categories[getResponse.data.categories.length - 1].id;
    const categoryName = getResponse.data.categories[getResponse.data.categories.length - 1].name;
    
    const response = await axios.delete(
      `${API_URL}/tournaments/${tournamentId}/categories/${categoryId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    
    log('✅ TEST 6: Category Deleted', {
      deletedCategory: categoryName,
      message: response.data.message,
    });
    return true;
  } catch (error) {
    console.error('❌ TEST 6 FAILED:', error.response?.data || error.message);
    return false;
  }
}

// Test 7: Verify final state
async function testFinalState() {
  try {
    const response = await axios.get(
      `${API_URL}/tournaments/${tournamentId}/categories`
    );
    
    log('✅ TEST 7: Final State', {
      totalCategories: response.data.count,
      categories: response.data.categories.map(c => ({
        name: c.name,
        format: c.format,
        gender: c.gender,
        entryFee: c.entryFee,
        maxParticipants: c.maxParticipants,
      })),
    });
    return true;
  } catch (error) {
    console.error('❌ TEST 7 FAILED:', error.response?.data || error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('\n🚀 Starting Category Endpoint Tests...\n');
  
  const results = {
    login: await testLogin(),
    createTournament: false,
    createCategories: false,
    getCategories: false,
    updateCategory: false,
    deleteCategory: false,
    finalState: false,
  };
  
  if (results.login) {
    results.createTournament = await testCreateTournament();
  }
  
  if (results.createTournament) {
    results.createCategories = await testCreateCategories();
    results.getCategories = await testGetCategories();
    results.updateCategory = await testUpdateCategory();
    results.deleteCategory = await testDeleteCategory();
    results.finalState = await testFinalState();
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('TEST SUMMARY');
  console.log('='.repeat(50));
  
  const passed = Object.values(results).filter(r => r === true).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}`);
  });
  
  console.log(`\n${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Category endpoints are working correctly.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.\n');
  }
}

// Run the tests
runTests().catch(console.error);
