import axios from 'axios';
import colors from 'colors';

const API_BASE_URL = 'http://localhost:5000/api';

// Test data
const testUser = {
  email: 'wallet.test@example.com',
  password: 'TestPass123!',
  name: 'Wallet Test User',
  role: 'PLAYER',
  phone: '9876543210'
};

let accessToken = '';
let refreshToken = '';

// Helper function to make authenticated requests
const makeAuthRequest = (method, url, data = null, headers = {}) => {
  const config = {
    method,
    url: `${API_BASE_URL}${url}`,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...headers
    }
  };
  
  if (data) {
    config.data = data;
  }
  
  return axios(config);
};

// Test functions
const testRegisterUser = async () => {
  try {
    console.log('\n🔧 Test 1: Register wallet test user'.cyan);
    
    const response = await axios.post(`${API_BASE_URL}/auth/register`, testUser);
    
    if (response.status === 201) {
      accessToken = response.data.accessToken;
      refreshToken = response.data.refreshToken;
      console.log('✅ User registered successfully'.green);
      console.log(`   User ID: ${response.data.user.id}`);
      console.log(`   Name: ${response.data.user.name}`);
      console.log(`   Initial Wallet Balance: ₹${response.data.user.walletBalance}`);
      return true;
    }
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('⚠️  User already exists, attempting login...'.yellow);
      return await testLoginUser();
    }
    console.log('❌ Registration failed:'.red, error.response?.data?.error || error.message);
    return false;
  }
};

const testLoginUser = async () => {
  try {
    console.log('\n🔑 Test 2: Login user'.cyan);
    
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    if (response.status === 200) {
      accessToken = response.data.accessToken;
      refreshToken = response.data.refreshToken;
      console.log('✅ Login successful'.green);
      console.log(`   User: ${response.data.user.name}`);
      console.log(`   Wallet Balance: ₹${response.data.user.walletBalance}`);
      return true;
    }
  } catch (error) {
    console.log('❌ Login failed:'.red, error.response?.data?.error || error.message);
    return false;
  }
};

const testGetWalletBalance = async () => {
  try {
    console.log('\n💰 Test 3: Get wallet balance'.cyan);
    
    const response = await makeAuthRequest('GET', '/wallet/balance');
    
    if (response.status === 200) {
      console.log('✅ Wallet balance retrieved successfully'.green);
      console.log(`   Current Balance: ₹${response.data.balance}`);
      return true;
    }
  } catch (error) {
    console.log('❌ Get wallet balance failed:'.red, error.response?.data?.error || error.message);
    return false;
  }
};

const testGetWalletSummary = async () => {
  try {
    console.log('\n📊 Test 4: Get wallet summary'.cyan);
    
    const response = await makeAuthRequest('GET', '/wallet/summary');
    
    if (response.status === 200) {
      console.log('✅ Wallet summary retrieved successfully'.green);
      const summary = response.data.data;
      console.log(`   Current Balance: ₹${summary.currentBalance}`);
      console.log(`   Total Topups: ₹${summary.totalTopups}`);
      console.log(`   Total Spent: ₹${summary.totalSpent}`);
      console.log(`   Total Refunds: ₹${summary.totalRefunds}`);
      console.log(`   Recent Transactions: ${summary.recentTransactions.length}`);
      return true;
    }
  } catch (error) {
    console.log('❌ Get wallet summary failed:'.red, error.response?.data?.error || error.message);
    return false;
  }
};

const testCreateTopupOrder = async () => {
  try {
    console.log('\n🛒 Test 5: Create topup order'.cyan);
    
    const response = await makeAuthRequest('POST', '/wallet/topup', {
      amount: 500
    });
    
    if (response.status === 200) {
      console.log('✅ Topup order created successfully'.green);
      const order = response.data.data;
      console.log(`   Transaction ID: ${order.transactionId}`);
      console.log(`   Order ID: ${order.orderId}`);
      console.log(`   Amount: ₹${order.amount}`);
      console.log(`   Currency: ${order.currency}`);
      console.log(`   Razorpay Key: ${order.razorpayKey}`);
      
      // Store order ID for verification test
      global.testOrderId = order.orderId;
      return true;
    }
  } catch (error) {
    console.log('❌ Create topup order failed:'.red, error.response?.data?.error || error.message);
    return false;
  }
};

const testTopupValidation = async () => {
  try {
    console.log('\n🔍 Test 6: Topup validation'.cyan);
    
    // Test invalid amount (too low)
    try {
      await makeAuthRequest('POST', '/wallet/topup', { amount: 5 });
      console.log('❌ Should have failed with low amount'.red);
      return false;
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Low amount validation working'.green);
      }
    }
    
    // Test invalid amount (too high)
    try {
      await makeAuthRequest('POST', '/wallet/topup', { amount: 200000 });
      console.log('❌ Should have failed with high amount'.red);
      return false;
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ High amount validation working'.green);
      }
    }
    
    // Test invalid amount (not a number)
    try {
      await makeAuthRequest('POST', '/wallet/topup', { amount: 'invalid' });
      console.log('❌ Should have failed with invalid amount'.red);
      return false;
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Invalid amount validation working'.green);
      }
    }
    
    return true;
  } catch (error) {
    console.log('❌ Topup validation test failed:'.red, error.response?.data?.error || error.message);
    return false;
  }
};

const testGetTransactions = async () => {
  try {
    console.log('\n📋 Test 7: Get transaction history'.cyan);
    
    const response = await makeAuthRequest('GET', '/wallet/transactions?page=1&limit=10');
    
    if (response.status === 200) {
      console.log('✅ Transaction history retrieved successfully'.green);
      const result = response.data.data;
      console.log(`   Total Transactions: ${result.pagination.total}`);
      console.log(`   Current Page: ${result.pagination.page}`);
      console.log(`   Total Pages: ${result.pagination.totalPages}`);
      console.log(`   Transactions on this page: ${result.transactions.length}`);
      
      if (result.transactions.length > 0) {
        const latest = result.transactions[0];
        console.log(`   Latest Transaction: ${latest.type} - ₹${latest.amount} (${latest.status})`);
      }
      
      return true;
    }
  } catch (error) {
    console.log('❌ Get transactions failed:'.red, error.response?.data?.error || error.message);
    return false;
  }
};

const testTransactionFiltering = async () => {
  try {
    console.log('\n🔍 Test 8: Transaction filtering'.cyan);
    
    // Test filtering by type
    const response = await makeAuthRequest('GET', '/wallet/transactions?type=TOPUP&limit=5');
    
    if (response.status === 200) {
      console.log('✅ Transaction filtering working'.green);
      const result = response.data.data;
      console.log(`   TOPUP Transactions: ${result.transactions.length}`);
      
      // Verify all transactions are of TOPUP type
      const allTopup = result.transactions.every(t => t.type === 'TOPUP');
      if (allTopup || result.transactions.length === 0) {
        console.log('✅ Filtering by type working correctly'.green);
      } else {
        console.log('❌ Filtering by type not working correctly'.red);
        return false;
      }
      
      return true;
    }
  } catch (error) {
    console.log('❌ Transaction filtering failed:'.red, error.response?.data?.error || error.message);
    return false;
  }
};

const testUnauthorizedAccess = async () => {
  try {
    console.log('\n🚫 Test 9: Unauthorized access'.cyan);
    
    // Test without token
    try {
      await axios.get(`${API_BASE_URL}/wallet/balance`);
      console.log('❌ Should have failed without token'.red);
      return false;
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Unauthorized access blocked'.green);
      }
    }
    
    // Test with invalid token
    try {
      await axios.get(`${API_BASE_URL}/wallet/balance`, {
        headers: { 'Authorization': 'Bearer invalid-token' }
      });
      console.log('❌ Should have failed with invalid token'.red);
      return false;
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Invalid token blocked'.green);
      }
    }
    
    return true;
  } catch (error) {
    console.log('❌ Unauthorized access test failed:'.red, error.response?.data?.error || error.message);
    return false;
  }
};

const testWebhookEndpoint = async () => {
  try {
    console.log('\n🔗 Test 10: Webhook endpoint'.cyan);
    
    // Test webhook endpoint exists
    const response = await axios.post(`${API_BASE_URL}/webhooks/test`, {
      test: 'webhook test data'
    });
    
    if (response.status === 200) {
      console.log('✅ Webhook endpoint accessible'.green);
      console.log(`   Response: ${response.data.status}`);
      return true;
    }
  } catch (error) {
    console.log('❌ Webhook endpoint test failed:'.red, error.response?.data?.error || error.message);
    return false;
  }
};

// Main test runner
const runAllWalletTests = async () => {
  console.log('🎾 MATCHIFY WALLET SYSTEM TESTS - DAY 12'.rainbow);
  console.log('=========================================='.rainbow);
  
  const tests = [
    { name: 'Register Wallet User', fn: testRegisterUser },
    { name: 'Get Wallet Balance', fn: testGetWalletBalance },
    { name: 'Get Wallet Summary', fn: testGetWalletSummary },
    { name: 'Create Topup Order', fn: testCreateTopupOrder },
    { name: 'Topup Validation', fn: testTopupValidation },
    { name: 'Get Transactions', fn: testGetTransactions },
    { name: 'Transaction Filtering', fn: testTransactionFiltering },
    { name: 'Unauthorized Access', fn: testUnauthorizedAccess },
    { name: 'Webhook Endpoint', fn: testWebhookEndpoint }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} failed with error:`.red, error.message);
      failed++;
    }
  }
  
  console.log('\n📊 WALLET SYSTEM TEST RESULTS'.rainbow);
  console.log('=============================='.rainbow);
  console.log(`✅ Passed: ${passed}`.green);
  console.log(`❌ Failed: ${failed}`.red);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`.cyan);
  
  if (failed === 0) {
    console.log('\n🎉 ALL WALLET TESTS PASSED! Wallet system is working perfectly! 🎾'.rainbow);
  } else {
    console.log('\n⚠️  Some tests failed. Please check the backend server and Razorpay configuration.'.yellow);
  }
  
  console.log('\n🔧 NEXT STEPS:'.cyan);
  console.log('1. Configure Razorpay credentials in .env file');
  console.log('2. Test with actual Razorpay test cards');
  console.log('3. Test payment verification flow');
  console.log('4. Test webhook with ngrok for local development');
  
  console.log('\n💳 RAZORPAY TEST CARDS:'.cyan);
  console.log('Card Number: 4111 1111 1111 1111');
  console.log('CVV: Any 3 digits');
  console.log('Expiry: Any future date');
};

// Run tests
runAllWalletTests().catch(error => {
  console.error('Wallet test runner failed:'.red, error.message);
  process.exit(1);
});