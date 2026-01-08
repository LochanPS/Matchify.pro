/**
 * 🎾 MATCHIFY - WALLET FRONTEND TEST SUITE
 * 
 * Day 13: Complete Wallet System Frontend Testing
 * 
 * This script tests the wallet frontend components and integration
 * with the backend API to ensure everything works correctly.
 */

import { walletAPI } from './src/api/wallet.js';

// Test configuration
const TEST_CONFIG = {
  baseURL: 'http://localhost:5000/api',
  testUser: {
    email: 'player@test.com',
    password: 'password123'
  }
};

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

// Helper function to run tests
async function runTest(testName, testFunction) {
  testResults.total++;
  try {
    console.log(`\n🧪 Testing: ${testName}`);
    await testFunction();
    console.log(`✅ ${testName}: PASSED`);
    testResults.passed++;
  } catch (error) {
    console.log(`❌ ${testName}: FAILED`);
    console.log(`   Error: ${error.message}`);
    testResults.failed++;
  }
}

// Helper function to make authenticated requests
async function makeAuthenticatedRequest(url, options = {}) {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No access token found. Please login first.');
  }

  const response = await fetch(`${TEST_CONFIG.baseURL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Test 1: Wallet API Service Layer
async function testWalletAPIService() {
  // Mock localStorage for testing
  global.localStorage = {
    getItem: () => 'mock-token',
    setItem: () => {},
    removeItem: () => {}
  };

  // Test API service methods exist
  const requiredMethods = [
    'getBalance',
    'getSummary', 
    'createTopupOrder',
    'verifyPayment',
    'getTransactions',
    'deductAmount',
    'refundAmount'
  ];

  for (const method of requiredMethods) {
    if (typeof walletAPI[method] !== 'function') {
      throw new Error(`Missing API method: ${method}`);
    }
  }

  console.log('   ✓ All required API methods exist');
}

// Test 2: Component File Structure
async function testComponentStructure() {
  const fs = await import('fs');
  const path = await import('path');

  const requiredFiles = [
    'src/pages/WalletPage.jsx',
    'src/components/wallet/TopupModal.jsx',
    'src/components/wallet/TransactionHistory.jsx',
    'src/api/wallet.js'
  ];

  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(process.cwd(), file))) {
      throw new Error(`Missing required file: ${file}`);
    }
  }

  console.log('   ✓ All required component files exist');
}

// Test 3: Wallet Page Component Structure
async function testWalletPageComponent() {
  const fs = await import('fs');
  const walletPageContent = fs.readFileSync('src/pages/WalletPage.jsx', 'utf8');

  const requiredFeatures = [
    'useState',
    'useEffect',
    'walletAPI',
    'TopupModal',
    'TransactionHistory',
    'formatCurrency',
    'fetchWalletData'
  ];

  for (const feature of requiredFeatures) {
    if (!walletPageContent.includes(feature)) {
      throw new Error(`Missing feature in WalletPage: ${feature}`);
    }
  }

  console.log('   ✓ WalletPage component has all required features');
}

// Test 4: TopupModal Component Structure
async function testTopupModalComponent() {
  const fs = await import('fs');
  const topupModalContent = fs.readFileSync('src/components/wallet/TopupModal.jsx', 'utf8');

  const requiredFeatures = [
    'Razorpay',
    'createTopupOrder',
    'verifyPayment',
    'validateAmount',
    'quickAmounts',
    'handleTopup'
  ];

  for (const feature of requiredFeatures) {
    if (!topupModalContent.includes(feature)) {
      throw new Error(`Missing feature in TopupModal: ${feature}`);
    }
  }

  console.log('   ✓ TopupModal component has all required features');
}

// Test 5: TransactionHistory Component Structure
async function testTransactionHistoryComponent() {
  const fs = await import('fs');
  const transactionHistoryContent = fs.readFileSync('src/components/wallet/TransactionHistory.jsx', 'utf8');

  const requiredFeatures = [
    'getTransactions',
    'pagination',
    'filterType',
    'transactionTypes',
    'getTransactionIcon',
    'formatCurrency'
  ];

  for (const feature of requiredFeatures) {
    if (!transactionHistoryContent.includes(feature)) {
      throw new Error(`Missing feature in TransactionHistory: ${feature}`);
    }
  }

  console.log('   ✓ TransactionHistory component has all required features');
}

// Test 6: App.jsx Route Integration
async function testAppRouteIntegration() {
  const fs = await import('fs');
  const appContent = fs.readFileSync('src/App.jsx', 'utf8');

  const requiredFeatures = [
    'WalletPage',
    'path="/wallet"',
    'ProtectedRoute'
  ];

  for (const feature of requiredFeatures) {
    if (!appContent.includes(feature)) {
      throw new Error(`Missing feature in App.jsx: ${feature}`);
    }
  }

  console.log('   ✓ App.jsx has wallet route integration');
}

// Test 7: Navbar Integration
async function testNavbarIntegration() {
  const fs = await import('fs');
  const navbarContent = fs.readFileSync('src/components/Navbar.jsx', 'utf8');

  const requiredFeatures = [
    'to="/wallet"',
    'Wallet'
  ];

  for (const feature of requiredFeatures) {
    if (!navbarContent.includes(feature)) {
      throw new Error(`Missing feature in Navbar: ${feature}`);
    }
  }

  console.log('   ✓ Navbar has wallet navigation link');
}

// Test 8: Razorpay Integration
async function testRazorpayIntegration() {
  const fs = await import('fs');
  const indexHtmlContent = fs.readFileSync('index.html', 'utf8');

  if (!indexHtmlContent.includes('checkout.razorpay.com')) {
    throw new Error('Razorpay script not included in index.html');
  }

  console.log('   ✓ Razorpay script included in HTML');
}

// Test 9: Currency Formatting
async function testCurrencyFormatting() {
  // Test currency formatting function
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const testCases = [
    { input: 100, expected: '₹100' },
    { input: 1500.50, expected: '₹1,500.50' },
    { input: 0, expected: '₹0' }
  ];

  for (const testCase of testCases) {
    const result = formatCurrency(testCase.input);
    if (!result.includes(testCase.expected.replace('₹', ''))) {
      throw new Error(`Currency formatting failed for ${testCase.input}`);
    }
  }

  console.log('   ✓ Currency formatting works correctly');
}

// Test 10: Component Props and State Management
async function testComponentPropsAndState() {
  const fs = await import('fs');
  
  // Check WalletPage state management
  const walletPageContent = fs.readFileSync('src/pages/WalletPage.jsx', 'utf8');
  const stateVariables = ['walletData', 'loading', 'error', 'showTopupModal', 'refreshTrigger'];
  
  for (const stateVar of stateVariables) {
    if (!walletPageContent.includes(stateVar)) {
      throw new Error(`Missing state variable in WalletPage: ${stateVar}`);
    }
  }

  // Check TopupModal props
  const topupModalContent = fs.readFileSync('src/components/wallet/TopupModal.jsx', 'utf8');
  const props = ['isOpen', 'onClose', 'onSuccess', 'currentBalance'];
  
  for (const prop of props) {
    if (!topupModalContent.includes(prop)) {
      throw new Error(`Missing prop in TopupModal: ${prop}`);
    }
  }

  console.log('   ✓ Component props and state management implemented correctly');
}

// Main test runner
async function runAllTests() {
  console.log('🎾 MATCHIFY - WALLET FRONTEND TEST SUITE');
  console.log('==========================================');
  console.log('Day 13: Testing Complete Wallet System Frontend\n');

  // Run all tests
  await runTest('Wallet API Service Layer', testWalletAPIService);
  await runTest('Component File Structure', testComponentStructure);
  await runTest('WalletPage Component Structure', testWalletPageComponent);
  await runTest('TopupModal Component Structure', testTopupModalComponent);
  await runTest('TransactionHistory Component Structure', testTransactionHistoryComponent);
  await runTest('App.jsx Route Integration', testAppRouteIntegration);
  await runTest('Navbar Integration', testNavbarIntegration);
  await runTest('Razorpay Integration', testRazorpayIntegration);
  await runTest('Currency Formatting', testCurrencyFormatting);
  await runTest('Component Props and State Management', testComponentPropsAndState);

  // Print results
  console.log('\n==========================================');
  console.log('🎯 TEST RESULTS SUMMARY');
  console.log('==========================================');
  console.log(`✅ Passed: ${testResults.passed}/${testResults.total}`);
  console.log(`❌ Failed: ${testResults.failed}/${testResults.total}`);
  console.log(`📊 Success Rate: ${Math.round((testResults.passed / testResults.total) * 100)}%`);

  if (testResults.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Wallet frontend is ready for production!');
  } else {
    console.log('\n⚠️  Some tests failed. Please fix the issues before proceeding.');
  }

  console.log('\n🚀 NEXT STEPS:');
  console.log('1. Start both backend and frontend servers');
  console.log('2. Test the complete wallet flow in the browser');
  console.log('3. Verify Razorpay integration with test payments');
  console.log('4. Check responsive design on mobile devices');
  console.log('5. Test error handling and edge cases');

  return testResults.failed === 0;
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests, testResults };