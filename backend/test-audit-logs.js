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

async function testAuditLogs() {
  try {
    console.log('🔍 Testing audit logs after payment approvals...\n');
    
    // Step 1: Get admin token
    const tokenObtained = await getAdminToken();
    if (!tokenObtained) {
      console.log('❌ Cannot proceed without admin token.');
      return;
    }
    
    // Step 2: Check if audit logs table exists and has data
    console.log('📊 Step 2: Checking audit logs...');
    try {
      const auditResponse = await axios.get(`${API_URL}/admin/audit-logs`, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Audit logs response:', {
        success: auditResponse.data.success,
        totalLogs: auditResponse.data.pagination?.total || 0,
        currentPage: auditResponse.data.pagination?.page || 0,
        logsCount: auditResponse.data.logs?.length || 0
      });
      
      if (auditResponse.data.logs && auditResponse.data.logs.length > 0) {
        console.log('\n📋 Recent audit log entries:');
        auditResponse.data.logs.slice(0, 5).forEach((log, index) => {
          console.log(`${index + 1}. ${log.action} on ${log.entityType} by ${log.admin?.name || 'Unknown'} at ${log.createdAt}`);
          if (log.details) {
            console.log(`   Details:`, log.details);
          }
        });
      } else {
        console.log('❌ No audit logs found!');
      }
    } catch (error) {
      console.log('❌ Audit logs error:', error.response?.data || error.message);
    }
    
    // Step 3: Check if audit logs route is working with different filters
    console.log('\n🔍 Step 3: Testing audit logs with filters...');
    try {
      const filteredResponse = await axios.get(`${API_URL}/admin/audit-logs?action=PAYMENT_APPROVED`, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Filtered audit logs (PAYMENT_APPROVED):', {
        success: filteredResponse.data.success,
        count: filteredResponse.data.logs?.length || 0
      });
    } catch (error) {
      console.log('❌ Filtered audit logs error:', error.response?.data || error.message);
    }
    
    // Step 4: Check database directly for audit logs table
    console.log('\n💾 Step 4: Let me check if audit logging is actually working...');
    
    // Let's perform a test action that should create an audit log
    try {
      console.log('🧪 Performing a test action to create audit log...');
      
      // Try to get user stats (this should create an audit log)
      const statsResponse = await axios.get(`${API_URL}/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Stats request completed');
      
      // Now check if this created an audit log
      setTimeout(async () => {
        try {
          const newAuditResponse = await axios.get(`${API_URL}/admin/audit-logs`, {
            headers: {
              'Authorization': `Bearer ${ADMIN_TOKEN}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('🔍 Audit logs after test action:', {
            totalLogs: newAuditResponse.data.pagination?.total || 0,
            logsCount: newAuditResponse.data.logs?.length || 0
          });
          
          if (newAuditResponse.data.logs && newAuditResponse.data.logs.length > 0) {
            console.log('📋 Latest audit log entry:');
            const latest = newAuditResponse.data.logs[0];
            console.log(`   Action: ${latest.action}`);
            console.log(`   Entity: ${latest.entityType}`);
            console.log(`   Admin: ${latest.admin?.name || 'Unknown'}`);
            console.log(`   Time: ${latest.createdAt}`);
          }
        } catch (error) {
          console.log('❌ Error checking audit logs after test action:', error.response?.data || error.message);
        }
      }, 1000);
      
    } catch (error) {
      console.log('❌ Test action error:', error.response?.data || error.message);
    }
    
    // Step 5: Check if the issue is with the payment verification routes
    console.log('\n🔍 Step 5: Checking if payment verification routes log actions...');
    
    // Check current pending payments
    try {
      const pendingResponse = await axios.get(`${API_URL}/admin/payment-verifications?status=pending`, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Current pending payments:', pendingResponse.data.data?.length || 0);
      
      if (pendingResponse.data.data && pendingResponse.data.data.length > 0) {
        console.log('💡 There are still pending payments - the bulk approve might not have logged properly');
      } else {
        console.log('✅ All payments have been processed');
      }
    } catch (error) {
      console.log('❌ Error checking pending payments:', error.response?.data || error.message);
    }
    
    console.log('\n✅ Audit log investigation completed!');
    
  } catch (error) {
    console.error('❌ Error during audit log testing:', error.response?.data || error.message);
  }
}

// Run the test
testAuditLogs();