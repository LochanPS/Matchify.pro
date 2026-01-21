import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
const ADMIN_EMAIL = 'ADMIN@gmail.com';
const ADMIN_PASSWORD = 'ADMIN@123(123)';
let ADMIN_TOKEN = null;

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

async function testCompleteBulkApproveWorkflow() {
  try {
    console.log('🚀 Testing complete bulk approve workflow...\n');
    
    // Step 1: Get admin token
    const tokenObtained = await getAdminToken();
    if (!tokenObtained) {
      console.log('❌ Cannot proceed without admin token.');
      return;
    }
    
    // Step 2: Get current pending payments count
    console.log('\n📊 Step 2: Getting current status...');
    const statusResponse = await axios.get(`${API_URL}/admin/payment-verifications?status=pending`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const totalPending = statusResponse.data.data?.length || 0;
    console.log(`✅ Current pending payments: ${totalPending}`);
    
    if (totalPending === 0) {
      console.log('✅ No pending payments to process. System is clean!');
      return;
    }
    
    // Step 3: Test bulk approve with first 5 payments
    const testCount = Math.min(5, totalPending);
    const testPayments = statusResponse.data.data.slice(0, testCount);
    const testIds = testPayments.map(p => p.id);
    
    console.log(`\n🎯 Step 3: Testing bulk approve with ${testCount} payments...`);
    console.log('Test payments:', testPayments.map(p => ({
      player: p.registration?.user?.name || 'Unknown',
      amount: p.amount,
      tournament: p.registration?.tournament?.name || 'Unknown'
    })));
    
    // Step 4: Execute bulk approve
    console.log('\n🚀 Step 4: Executing bulk approve...');
    const bulkResponse = await axios.post(`${API_URL}/admin/payment-verifications/bulk/approve`, {
      verificationIds: testIds
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
    
    // Step 5: Verify the results
    console.log('\n🔍 Step 5: Verifying results...');
    const afterResponse = await axios.get(`${API_URL}/admin/payment-verifications?status=pending`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const remainingPending = afterResponse.data.data?.length || 0;
    const processed = totalPending - remainingPending;
    
    console.log(`✅ Verification complete:`);
    console.log(`   - Before: ${totalPending} pending payments`);
    console.log(`   - Processed: ${processed} payments`);
    console.log(`   - Remaining: ${remainingPending} pending payments`);
    console.log(`   - Expected processed: ${testCount}`);
    
    if (processed === testCount) {
      console.log('🎉 SUCCESS: Bulk approve worked perfectly!');
    } else {
      console.log('⚠️ WARNING: Processed count doesn\'t match expected count');
    }
    
    // Step 6: Test bulk approve with ALL remaining payments
    if (remainingPending > 0) {
      console.log(`\n🎯 Step 6: Testing bulk approve with ALL remaining ${remainingPending} payments...`);
      
      const allIds = afterResponse.data.data.map(p => p.id);
      
      console.log('🚀 Executing bulk approve for all remaining payments...');
      const allBulkResponse = await axios.post(`${API_URL}/admin/payment-verifications/bulk/approve`, {
        verificationIds: allIds
      }, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Bulk approve ALL response:', {
        success: allBulkResponse.data.success,
        message: allBulkResponse.data.message,
        results: allBulkResponse.data.results
      });
      
      // Final verification
      const finalResponse = await axios.get(`${API_URL}/admin/payment-verifications?status=pending`, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      const finalPending = finalResponse.data.data?.length || 0;
      console.log(`\n🏁 Final status: ${finalPending} pending payments remaining`);
      
      if (finalPending === 0) {
        console.log('🎉 COMPLETE SUCCESS: All payments have been processed!');
      } else {
        console.log(`⚠️ ${finalPending} payments still pending (may have failed processing)`);
      }
    }
    
    console.log('\n✅ Bulk approve workflow test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during bulk approve workflow test:', error.response?.data || error.message);
  }
}

// Run the complete test
testCompleteBulkApproveWorkflow();