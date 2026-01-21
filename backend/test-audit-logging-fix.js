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

async function testAuditLoggingFix() {
  try {
    console.log('🔧 Testing audit logging fix...\n');
    
    // Step 1: Get admin token
    const tokenObtained = await getAdminToken();
    if (!tokenObtained) {
      console.log('❌ Cannot proceed without admin token.');
      return;
    }
    
    // Step 2: Check current audit logs count
    console.log('📊 Step 2: Checking current audit logs count...');
    try {
      const beforeResponse = await axios.get(`${API_URL}/admin/audit-logs`, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      const beforeCount = beforeResponse.data.pagination?.total || 0;
      console.log(`✅ Current audit logs count: ${beforeCount}`);
      
      // Step 3: Create a test payment verification to approve
      console.log('\n🧪 Step 3: Creating a test payment verification...');
      
      // First, let's create a test user and registration
      const testUser = await axios.post(`${API_URL}/multi-auth/register`, {
        name: 'Test Audit User',
        email: `audit-test-${Date.now()}@test.com`,
        phone: '9999999999',
        password: 'password123',
        city: 'Test City',
        state: 'Test State',
        roles: ['PLAYER']
      });
      
      console.log('✅ Test user created');
      
      // Get a tournament to register for
      const tournamentsResponse = await axios.get(`${API_URL}/tournaments?status=upcoming&limit=1`);
      
      if (!tournamentsResponse.data.data || tournamentsResponse.data.data.length === 0) {
        console.log('❌ No tournaments available for testing');
        return;
      }
      
      const tournament = tournamentsResponse.data.data[0];
      console.log(`✅ Using tournament: ${tournament.name}`);
      
      // Create a registration and payment verification manually
      // This is a simplified approach for testing
      console.log('🔧 Creating test payment verification entry...');
      
      // Step 4: Test a simple audit log creation first
      console.log('\n🧪 Step 4: Testing direct audit log creation...');
      
      // Let's test the audit logging by making a request that should create a log
      // We'll use the export audit logs endpoint which should log the export action
      try {
        const exportResponse = await axios.get(`${API_URL}/admin/audit-logs/export`, {
          headers: {
            'Authorization': `Bearer ${ADMIN_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Export request completed');
        
        // Wait a moment for the log to be created
        setTimeout(async () => {
          try {
            const afterResponse = await axios.get(`${API_URL}/admin/audit-logs`, {
              headers: {
                'Authorization': `Bearer ${ADMIN_TOKEN}`,
                'Content-Type': 'application/json'
              }
            });
            
            const afterCount = afterResponse.data.pagination?.total || 0;
            console.log(`✅ Audit logs count after export: ${afterCount}`);
            
            if (afterCount > beforeCount) {
              console.log('🎉 SUCCESS: Audit logging is working!');
              console.log('📋 Latest audit log entries:');
              afterResponse.data.logs.slice(0, 3).forEach((log, index) => {
                console.log(`${index + 1}. ${log.action} on ${log.entityType} by ${log.admin?.name || 'Unknown'} at ${log.createdAt}`);
              });
            } else {
              console.log('❌ Audit logging still not working - no new entries created');
            }
          } catch (error) {
            console.log('❌ Error checking audit logs after export:', error.response?.data || error.message);
          }
        }, 2000);
        
      } catch (error) {
        console.log('❌ Export request error:', error.response?.data || error.message);
      }
      
    } catch (error) {
      console.log('❌ Error checking audit logs:', error.response?.data || error.message);
    }
    
    console.log('\n✅ Audit logging fix test completed!');
    
  } catch (error) {
    console.error('❌ Error during audit logging fix test:', error.response?.data || error.message);
  }
}

// Run the test
testAuditLoggingFix();