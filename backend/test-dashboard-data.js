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

async function testDashboardData() {
  try {
    console.log('🚀 Testing dashboard data endpoints...\n');
    
    // Step 1: Get admin token
    const tokenObtained = await getAdminToken();
    if (!tokenObtained) {
      console.log('❌ Cannot proceed without admin token.');
      return;
    }
    
    // Step 2: Test payment dashboard data
    console.log('📊 Step 2: Testing payment dashboard data...');
    try {
      const dashboardResponse = await axios.get(`${API_URL}/admin/payment/dashboard`, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Payment dashboard response:', {
        success: dashboardResponse.data.success,
        data: dashboardResponse.data.data
      });
    } catch (error) {
      console.log('❌ Payment dashboard error:', error.response?.data || error.message);
    }
    
    // Step 3: Test quick stats
    console.log('\n📈 Step 3: Testing quick stats...');
    try {
      const statsResponse = await axios.get(`${API_URL}/admin/payment/quick-stats`, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Quick stats response:', {
        success: statsResponse.data.success,
        data: statsResponse.data.data
      });
    } catch (error) {
      console.log('❌ Quick stats error:', error.response?.data || error.message);
    }
    
    // Step 4: Test payment notifications
    console.log('\n🔔 Step 4: Testing payment notifications...');
    try {
      const notificationsResponse = await axios.get(`${API_URL}/admin/payment/notifications`, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Payment notifications response:', {
        success: notificationsResponse.data.success,
        count: notificationsResponse.data.data?.length || 0,
        sampleData: notificationsResponse.data.data?.slice(0, 2) || []
      });
    } catch (error) {
      console.log('❌ Payment notifications error:', error.response?.data || error.message);
    }
    
    // Step 5: Test current payment verification status
    console.log('\n🔍 Step 5: Testing current payment verification status...');
    try {
      const verificationResponse = await axios.get(`${API_URL}/admin/payment-verifications?status=pending`, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Payment verifications response:', {
        success: verificationResponse.data.success,
        pendingCount: verificationResponse.data.data?.length || 0
      });
    } catch (error) {
      console.log('❌ Payment verifications error:', error.response?.data || error.message);
    }
    
    // Step 6: Test current database status
    console.log('\n💾 Step 6: Testing current database status...');
    try {
      const statsResponse = await axios.get(`${API_URL}/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ General stats response:', {
        success: statsResponse.data.success,
        data: statsResponse.data.data
      });
    } catch (error) {
      console.log('❌ General stats error:', error.response?.data || error.message);
    }
    
    console.log('\n✅ Dashboard data testing completed!');
    
  } catch (error) {
    console.error('❌ Error during dashboard data testing:', error.response?.data || error.message);
  }
}

// Run the test
testDashboardData();