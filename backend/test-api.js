import fetch from 'node-fetch';

async function testAPI() {
  try {
    // First login as admin
    console.log('🔐 Logging in as admin...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@matchify.pro',
        password: 'password123'
      })
    });

    const loginData = await loginResponse.json();
    
    console.log('✅ Login successful!');
    const token = loginData.accessToken || loginData.token;

    // Now fetch users
    console.log('\n📊 Fetching users...');
    const usersResponse = await fetch('http://localhost:5000/api/admin/users?page=1&limit=20', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const usersData = await usersResponse.json();
    
    console.log('\n📋 API Response:');
    console.log(JSON.stringify(usersData, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();
