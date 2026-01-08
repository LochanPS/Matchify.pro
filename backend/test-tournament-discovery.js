import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Helper function to log results
const log = (title, data) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(title);
  console.log('='.repeat(60));
  console.log(JSON.stringify(data, null, 2));
};

// Test 1: Get all tournaments (default)
async function testGetAllTournaments() {
  try {
    const response = await axios.get(`${API_URL}/tournaments`);
    
    log('✅ TEST 1: Get All Tournaments (Default)', {
      totalTournaments: response.data.data.pagination.total,
      currentPage: response.data.data.pagination.page,
      tournamentsReturned: response.data.data.tournaments.length,
      firstTournament: {
        name: response.data.data.tournaments[0]?.name,
        city: response.data.data.tournaments[0]?.city,
        status: response.data.data.tournaments[0]?.status,
      },
    });
    return true;
  } catch (error) {
    console.error('❌ TEST 1 FAILED:', error.response?.data || error.message);
    return false;
  }
}

// Test 2: Filter by city
async function testFilterByCity() {
  try {
    const response = await axios.get(`${API_URL}/tournaments?city=Bangalore`);
    
    const allFromBangalore = response.data.data.tournaments.every(
      t => t.city.toLowerCase().includes('bangalore')
    );
    
    log('✅ TEST 2: Filter by City (Bangalore)', {
      totalFound: response.data.data.pagination.total,
      allFromBangalore,
      cities: response.data.data.tournaments.map(t => t.city),
    });
    return allFromBangalore;
  } catch (error) {
    console.error('❌ TEST 2 FAILED:', error.response?.data || error.message);
    return false;
  }
}

// Test 3: Filter by state
async function testFilterByState() {
  try {
    const response = await axios.get(`${API_URL}/tournaments?state=Karnataka`);
    
    const allFromKarnataka = response.data.data.tournaments.every(
      t => t.state.toLowerCase().includes('karnataka')
    );
    
    log('✅ TEST 3: Filter by State (Karnataka)', {
      totalFound: response.data.data.pagination.total,
      allFromKarnataka,
      states: [...new Set(response.data.data.tournaments.map(t => t.state))],
    });
    return allFromKarnataka;
  } catch (error) {
    console.error('❌ TEST 3 FAILED:', error.response?.data || error.message);
    return false;
  }
}

// Test 4: Filter by zone
async function testFilterByZone() {
  try {
    const response = await axios.get(`${API_URL}/tournaments?zone=South`);
    
    const allFromSouth = response.data.data.tournaments.every(
      t => t.zone === 'South'
    );
    
    log('✅ TEST 4: Filter by Zone (South)', {
      totalFound: response.data.data.pagination.total,
      allFromSouth,
      zones: [...new Set(response.data.data.tournaments.map(t => t.zone))],
    });
    return allFromSouth;
  } catch (error) {
    console.error('❌ TEST 4 FAILED:', error.response?.data || error.message);
    return false;
  }
}

// Test 5: Filter by format
async function testFilterByFormat() {
  try {
    const response = await axios.get(`${API_URL}/tournaments?format=both`);
    
    const allBothFormat = response.data.data.tournaments.every(
      t => t.format === 'both'
    );
    
    log('✅ TEST 5: Filter by Format (both)', {
      totalFound: response.data.data.pagination.total,
      allBothFormat,
      formats: [...new Set(response.data.data.tournaments.map(t => t.format))],
    });
    return allBothFormat;
  } catch (error) {
    console.error('❌ TEST 5 FAILED:', error.response?.data || error.message);
    return false;
  }
}

// Test 6: Filter by multiple statuses
async function testFilterByStatus() {
  try {
    const response = await axios.get(`${API_URL}/tournaments?status=published,ongoing`);
    
    const allValidStatus = response.data.data.tournaments.every(
      t => ['published', 'ongoing'].includes(t.status)
    );
    
    log('✅ TEST 6: Filter by Status (published,ongoing)', {
      totalFound: response.data.data.pagination.total,
      allValidStatus,
      statuses: [...new Set(response.data.data.tournaments.map(t => t.status))],
    });
    return allValidStatus;
  } catch (error) {
    console.error('❌ TEST 6 FAILED:', error.response?.data || error.message);
    return false;
  }
}

// Test 7: Search by name
async function testSearchByName() {
  try {
    const response = await axios.get(`${API_URL}/tournaments?search=Open`);
    
    const allContainOpen = response.data.data.tournaments.every(
      t => t.name.toLowerCase().includes('open') || 
           t.description?.toLowerCase().includes('open') ||
           t.venue?.toLowerCase().includes('open') ||
           t.city?.toLowerCase().includes('open')
    );
    
    log('✅ TEST 7: Search by Name (Open)', {
      totalFound: response.data.data.pagination.total,
      allContainOpen,
      names: response.data.data.tournaments.map(t => t.name).slice(0, 3),
    });
    return allContainOpen;
  } catch (error) {
    console.error('❌ TEST 7 FAILED:', error.response?.data || error.message);
    return false;
  }
}

// Test 8: Pagination
async function testPagination() {
  try {
    const page1 = await axios.get(`${API_URL}/tournaments?limit=5&page=1`);
    const page2 = await axios.get(`${API_URL}/tournaments?limit=5&page=2`);
    
    const page1Ids = page1.data.data.tournaments.map(t => t.id);
    const page2Ids = page2.data.data.tournaments.map(t => t.id);
    const noDuplicates = !page1Ids.some(id => page2Ids.includes(id));
    
    log('✅ TEST 8: Pagination', {
      page1Count: page1.data.data.tournaments.length,
      page2Count: page2.data.data.tournaments.length,
      noDuplicates,
      totalPages: page1.data.data.pagination.totalPages,
      total: page1.data.data.pagination.total,
    });
    return noDuplicates && page1.data.data.tournaments.length === 5;
  } catch (error) {
    console.error('❌ TEST 8 FAILED:', error.response?.data || error.message);
    return false;
  }
}

// Test 9: Sorting
async function testSorting() {
  try {
    const asc = await axios.get(`${API_URL}/tournaments?sortBy=startDate&sortOrder=asc&limit=5`);
    const desc = await axios.get(`${API_URL}/tournaments?sortBy=startDate&sortOrder=desc&limit=5`);
    
    const ascDates = asc.data.data.tournaments.map(t => new Date(t.startDate).getTime());
    const descDates = desc.data.data.tournaments.map(t => new Date(t.startDate).getTime());
    
    const ascSorted = ascDates.every((date, i) => i === 0 || date >= ascDates[i - 1]);
    const descSorted = descDates.every((date, i) => i === 0 || date <= descDates[i - 1]);
    
    log('✅ TEST 9: Sorting', {
      ascSorted,
      descSorted,
      ascDates: ascDates.map(d => new Date(d).toISOString().split('T')[0]),
      descDates: descDates.map(d => new Date(d).toISOString().split('T')[0]),
    });
    return ascSorted && descSorted;
  } catch (error) {
    console.error('❌ TEST 9 FAILED:', error.response?.data || error.message);
    return false;
  }
}

// Test 10: Combined filters
async function testCombinedFilters() {
  try {
    const response = await axios.get(
      `${API_URL}/tournaments?city=Bangalore&format=both&status=published&limit=10`
    );
    
    const allMatch = response.data.data.tournaments.every(
      t => t.city.toLowerCase().includes('bangalore') &&
           t.format === 'both' &&
           t.status === 'published'
    );
    
    log('✅ TEST 10: Combined Filters', {
      totalFound: response.data.data.pagination.total,
      allMatch,
      sample: response.data.data.tournaments.slice(0, 2).map(t => ({
        name: t.name,
        city: t.city,
        format: t.format,
        status: t.status,
      })),
    });
    return allMatch;
  } catch (error) {
    console.error('❌ TEST 10 FAILED:', error.response?.data || error.message);
    return false;
  }
}

// Test 11: Check pricing calculation
async function testPricingCalculation() {
  try {
    const response = await axios.get(`${API_URL}/tournaments?limit=5`);
    
    const hasPricing = response.data.data.tournaments.every(
      t => typeof t.minEntryFee === 'number' && typeof t.maxEntryFee === 'number'
    );
    
    log('✅ TEST 11: Pricing Calculation', {
      hasPricing,
      samples: response.data.data.tournaments.slice(0, 3).map(t => ({
        name: t.name,
        minFee: t.minEntryFee,
        maxFee: t.maxEntryFee,
        categoriesCount: t.categories?.length || 0,
      })),
    });
    return hasPricing;
  } catch (error) {
    console.error('❌ TEST 11 FAILED:', error.response?.data || error.message);
    return false;
  }
}

// Test 12: Check registration status
async function testRegistrationStatus() {
  try {
    const response = await axios.get(`${API_URL}/tournaments?limit=5`);
    
    const hasRegistrationStatus = response.data.data.tournaments.every(
      t => typeof t.isRegistrationOpen === 'boolean' &&
           typeof t.daysUntilStart === 'number'
    );
    
    log('✅ TEST 12: Registration Status', {
      hasRegistrationStatus,
      samples: response.data.data.tournaments.slice(0, 3).map(t => ({
        name: t.name,
        isRegistrationOpen: t.isRegistrationOpen,
        daysUntilStart: t.daysUntilStart,
      })),
    });
    return hasRegistrationStatus;
  } catch (error) {
    console.error('❌ TEST 12 FAILED:', error.response?.data || error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('\n🚀 Starting Tournament Discovery Endpoint Tests...\n');
  
  const results = {
    getAllTournaments: await testGetAllTournaments(),
    filterByCity: await testFilterByCity(),
    filterByState: await testFilterByState(),
    filterByZone: await testFilterByZone(),
    filterByFormat: await testFilterByFormat(),
    filterByStatus: await testFilterByStatus(),
    searchByName: await testSearchByName(),
    pagination: await testPagination(),
    sorting: await testSorting(),
    combinedFilters: await testCombinedFilters(),
    pricingCalculation: await testPricingCalculation(),
    registrationStatus: await testRegistrationStatus(),
  };
  
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
    console.log('\n🎉 All tests passed! Tournament discovery endpoint is working correctly.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.\n');
  }
}

// Run the tests
runTests().catch(console.error);
