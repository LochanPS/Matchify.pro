import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
let ADMIN_TOKEN = null;

// Admin credentials
const ADMIN_EMAIL = 'ADMIN@gmail.com';
const ADMIN_PASSWORD = 'ADMIN@123(123)';

// Function to get admin token
async function getAdminToken() {
  try {
    console.log('🔑 Getting admin token...');
    const response = await axios.post(`${API_URL}/multi-auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    if (response.data.token || response.data.accessToken) {
      ADMIN_TOKEN = response.data.token || response.data.accessToken;
      console.log('✅ Admin token obtained successfully');
      return true;
    } else {
      console.log('❌ No access token in response:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to get admin token:', error.response?.data || error.message);
    return false;
  }
}

async function testBulkApprove() {
  try {
    console.log('🔍 Testing bulk approve functionality...');
    console.log('API URL:', API_URL);
    
    // Step 1: Get pending payments
    console.log('\n📋 Step 1: Fetching pending payments...');
    const response = await axios.get(`${API_URL}/admin/payment-verifications?status=pending`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Pending payments response:', {
      success: response.data.success,
      count: response.data.data?.length || 0,
      totalPages: response.data.pagination?.totalPages || 0
    });
    
    if (!response.data.data || response.data.data.length === 0) {
      console.log('❌ No pending payments found. Cannot test bulk approve.');
      return;
    }
    
    // Step 2: Test with first 3 payments
    const samplePayments = response.data.data.slice(0, 3);
    const verificationIds = samplePayments.map(v => v.id);
    
    console.log('\n🎯 Step 2: Testing bulk approve with sample payments...');
    console.log('Sample payments:', samplePayments.map(p => ({
      id: p.id,
      playerName: p.registration?.user?.name || 'Unknown',
      amount: p.amount,
      status: p.status
    })));
    
    console.log('Verification IDs to approve:', verificationIds);
    
    // Step 3: Send bulk approve request
    console.log('\n🚀 Step 3: Sending bulk approve request...');
    
    // First, let's verify these IDs exist by checking them individually
    console.log('🔍 Verifying IDs exist individually first...');
    for (let i = 0; i < Math.min(3, verificationIds.length); i++) {
      const id = verificationIds[i];
      try {
        const checkResponse = await axios.get(`${API_URL}/admin/payment-verifications`, {
          headers: {
            'Authorization': `Bearer ${ADMIN_TOKEN}`,
            'Content-Type': 'application/json'
          },
          params: { status: 'pending' }
        });
        
        const found = checkResponse.data.data?.find(v => v.id === id);
        console.log(`ID ${id}: ${found ? '✅ Found' : '❌ Not found'}`);
        if (found) {
          console.log(`  - Player: ${found.registration?.user?.name}`);
          console.log(`  - Status: ${found.status}`);
        }
      } catch (error) {
        console.log(`ID ${id}: ❌ Error checking - ${error.message}`);
      }
    }
    
    console.log('\n🚀 Now sending bulk approve request...');
    const bulkResponse = await axios.post(`${API_URL}/admin/payment-verifications/bulk/approve`, {
      verificationIds: verificationIds
    }, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Bulk approve response:', {
      success: bulkResponse.data.success,
      message: bulkResponse.data.message,
      results: bulkResponse.data.results
    });
    
    if (bulkResponse.data.success) {
      console.log('🎉 Bulk approve test SUCCESSFUL!');
      console.log('Results:', bulkResponse.data.results);
    } else {
      console.log('❌ Bulk approve test FAILED!');
      console.log('Error:', bulkResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ Error during bulk approve test:');
    
    if (error.response) {
      // Server responded with error status
      console.error('Status:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('Response Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received. Request details:', error.request);
      console.error('Possible causes:');
      console.error('- Server is not running');
      console.error('- Wrong API URL');
      console.error('- Network connectivity issues');
    } else {
      // Something else happened
      console.error('Error message:', error.message);
      console.error('Error config:', error.config);
    }
  }
}

// Additional function to test individual approve for comparison
async function testIndividualApprove() {
  try {
    console.log('\n🔍 Testing individual approve for comparison...');
    
    // Get one pending payment (use the last one to avoid conflicts with bulk test)
    const response = await axios.get(`${API_URL}/admin/payment-verifications?status=pending`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.data && response.data.data.length > 3) {
      // Use the last payment to avoid conflicts with bulk test
      const payment = response.data.data[response.data.data.length - 1];
      console.log('Testing individual approve for:', {
        id: payment.id,
        playerName: payment.registration?.user?.name || 'Unknown',
        amount: payment.amount
      });
      
      const approveResponse = await axios.post(`${API_URL}/admin/payment-verifications/${payment.id}/approve`, {}, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Individual approve response:', {
        success: approveResponse.data.success,
        message: approveResponse.data.message
      });
      
      if (approveResponse.data.success) {
        console.log('🎉 Individual approve test SUCCESSFUL!');
      } else {
        console.log('❌ Individual approve test FAILED!');
      }
    } else {
      console.log('❌ Not enough pending payments for individual test (need at least 4).');
    }
    
  } catch (error) {
    console.error('❌ Error during individual approve test:', error.response?.data || error.message);
  }
}

// Run tests
async function runAllTests() {
  console.log('🚀 Starting bulk approve debug tests...\n');
  
  // First get admin token
  const tokenObtained = await getAdminToken();
  if (!tokenObtained) {
    console.log('❌ Cannot proceed without admin token. Make sure server is running and admin credentials are correct.');
    return;
  }
  
  // Skip individual test and focus on bulk approve
  console.log('⏭️ Skipping individual test to focus on bulk approve issue...\n');
  
  // Test bulk approve
  await testBulkApprove();
  
  console.log('\n✅ All tests completed!');
}

runAllTests();