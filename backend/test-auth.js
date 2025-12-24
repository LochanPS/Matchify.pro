import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testUser = {
  email: 'testplayer@matchify.com',
  password: 'password123',
  role: 'PLAYER',
  name: 'Test Player',
  phone: '+919876543299',
  city: 'Bangalore',
  state: 'Karnataka',
  gender: 'MALE'
};

const testOrganizer = {
  email: 'testorganizer@matchify.com',
  password: 'password123',
  role: 'ORGANIZER',
  name: 'Test Organizer',
  phone: '+919876543298',
  city: 'Mumbai',
  state: 'Maharashtra'
};

let playerTokens = {};
let organizerTokens = {};

async function testAuthSystem() {
  console.log('🧪 TESTING MATCHIFY AUTHENTICATION SYSTEM\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL.replace('/api', '')}/health`);
    console.log('✅ Health check passed:', healthResponse.data.status);

    // Test 2: Register Player
    console.log('\n2️⃣ Testing Player Registration...');
    try {
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, testUser);
      console.log('✅ Player registration successful');
      console.log('   User ID:', registerResponse.data.user.id);
      console.log('   Role:', registerResponse.data.user.role);
      playerTokens = {
        accessToken: registerResponse.data.accessToken,
        refreshToken: registerResponse.data.refreshToken
      };
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('⚠️ Player already exists, trying login...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
          email: testUser.email,
          password: testUser.password
        });
        playerTokens = {
          accessToken: loginResponse.data.accessToken,
          refreshToken: loginResponse.data.refreshToken
        };
        console.log('✅ Player login successful');
      } else {
        throw error;
      }
    }

    // Test 3: Register Organizer
    console.log('\n3️⃣ Testing Organizer Registration...');
    try {
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, testOrganizer);
      console.log('✅ Organizer registration successful');
      organizerTokens = {
        accessToken: registerResponse.data.accessToken,
        refreshToken: registerResponse.data.refreshToken
      };
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('⚠️ Organizer already exists, trying login...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
          email: testOrganizer.email,
          password: testOrganizer.password
        });
        organizerTokens = {
          accessToken: loginResponse.data.accessToken,
          refreshToken: loginResponse.data.refreshToken
        };
        console.log('✅ Organizer login successful');
      } else {
        throw error;
      }
    }

    // Test 4: Login with wrong password
    console.log('\n4️⃣ Testing Login with Wrong Password...');
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: testUser.email,
        password: 'wrongpassword'
      });
      console.log('❌ Should have failed with wrong password');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly rejected wrong password');
      } else {
        throw error;
      }
    }

    // Test 5: Access protected route
    console.log('\n5️⃣ Testing Protected Route Access...');
    const protectedResponse = await axios.get(`${BASE_URL}/test/protected`, {
      headers: {
        Authorization: `Bearer ${playerTokens.accessToken}`
      }
    });
    console.log('✅ Protected route access successful');
    console.log('   Message:', protectedResponse.data.message);

    // Test 6: Test role-based access (Player accessing player-only route)
    console.log('\n6️⃣ Testing Player-Only Route with Player Token...');
    const playerOnlyResponse = await axios.get(`${BASE_URL}/test/player-only`, {
      headers: {
        Authorization: `Bearer ${playerTokens.accessToken}`
      }
    });
    console.log('✅ Player-only route access successful');

    // Test 7: Test role-based access (Player trying to access organizer route)
    console.log('\n7️⃣ Testing Organizer-Only Route with Player Token (Should Fail)...');
    try {
      await axios.get(`${BASE_URL}/test/organizer-only`, {
        headers: {
          Authorization: `Bearer ${playerTokens.accessToken}`
        }
      });
      console.log('❌ Should have been denied access');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Correctly denied access to organizer-only route');
      } else {
        throw error;
      }
    }

    // Test 8: Test organizer accessing organizer route
    console.log('\n8️⃣ Testing Organizer-Only Route with Organizer Token...');
    const organizerOnlyResponse = await axios.get(`${BASE_URL}/test/organizer-only`, {
      headers: {
        Authorization: `Bearer ${organizerTokens.accessToken}`
      }
    });
    console.log('✅ Organizer-only route access successful');

    // Test 9: Test refresh token
    console.log('\n9️⃣ Testing Refresh Token...');
    const refreshResponse = await axios.post(`${BASE_URL}/auth/refresh-token`, {
      refreshToken: playerTokens.refreshToken
    });
    console.log('✅ Token refresh successful');
    playerTokens.accessToken = refreshResponse.data.accessToken;
    playerTokens.refreshToken = refreshResponse.data.refreshToken;

    // Test 10: Test /auth/me endpoint
    console.log('\n🔟 Testing /auth/me Endpoint...');
    const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${playerTokens.accessToken}`
      }
    });
    console.log('✅ /auth/me endpoint successful');
    console.log('   User:', meResponse.data.user.name);
    console.log('   Role:', meResponse.data.user.role);

    // Test 11: Test logout
    console.log('\n1️⃣1️⃣ Testing Logout...');
    const logoutResponse = await axios.post(`${BASE_URL}/auth/logout`, {
      refreshToken: playerTokens.refreshToken
    });
    console.log('✅ Logout successful');

    // Test 12: Try to use refresh token after logout (should fail)
    console.log('\n1️⃣2️⃣ Testing Refresh Token After Logout (Should Fail)...');
    try {
      await axios.post(`${BASE_URL}/auth/refresh-token`, {
        refreshToken: playerTokens.refreshToken
      });
      console.log('❌ Should have failed after logout');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly rejected refresh token after logout');
      } else {
        throw error;
      }
    }

    console.log('\n🎉 ALL AUTHENTICATION TESTS PASSED!');
    console.log('\n📊 Test Summary:');
    console.log('   ✅ User registration');
    console.log('   ✅ User login');
    console.log('   ✅ Password validation');
    console.log('   ✅ JWT token generation');
    console.log('   ✅ Protected route access');
    console.log('   ✅ Role-based authorization');
    console.log('   ✅ Token refresh');
    console.log('   ✅ User info retrieval');
    console.log('   ✅ Logout functionality');
    console.log('   ✅ Token invalidation');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

// Run tests
testAuthSystem();