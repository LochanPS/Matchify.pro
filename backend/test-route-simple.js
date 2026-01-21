import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
const ADMIN_EMAIL = 'ADMIN@gmail.com';
const ADMIN_PASSWORD = 'ADMIN@123(123)';

async function testRouteAccess() {
  try {
    // Get admin token
    console.log('🔑 Getting admin token...');
    const loginResponse = await axios.post(`${API_URL}/multi-auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Token obtained');
    
    // Test if the bulk approve route exists
    console.log('\n🔍 Testing bulk approve route accessibility...');
    
    try {
      const response = await axios.post(`${API_URL}/admin/payment-verifications/bulk/approve`, {
        verificationIds: [] // Empty array to test route access
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Route is accessible. Response:', response.data);
    } catch (error) {
      if (error.response) {
        console.log('Route response status:', error.response.status);
        console.log('Route response data:', error.response.data);
        
        if (error.response.status === 400) {
          console.log('✅ Route is accessible (400 = validation error for empty array)');
        } else if (error.response.status === 404) {
          console.log('❌ Route not found (404)');
        } else {
          console.log('❌ Other error:', error.response.status);
        }
      } else {
        console.log('❌ Network error:', error.message);
      }
    }
    
    // Test individual route for comparison
    console.log('\n🔍 Testing individual approve route for comparison...');
    try {
      const response = await axios.post(`${API_URL}/admin/payment-verifications/fake-id/approve`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Individual route response:', response.data);
    } catch (error) {
      if (error.response) {
        console.log('Individual route status:', error.response.status);
        console.log('Individual route data:', error.response.data);
        
        if (error.response.status === 404) {
          console.log('✅ Individual route is accessible (404 = verification not found)');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testRouteAccess();