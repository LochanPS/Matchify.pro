import fetch from 'node-fetch';

async function testLogin() {
  try {
    console.log('🔐 Testing login endpoint...\n');
    
    // Test admin login
    const response = await fetch('http://localhost:5000/api/multi-auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'ADMIN@gmail.com',
        password: 'ADMIN@123(123)'
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Login successful!');
      console.log('User:', data.user.name);
      console.log('Email:', data.user.email);
      console.log('Roles:', data.user.roles);
      console.log('Token:', data.token.substring(0, 50) + '...');
    } else {
      console.log('❌ Login failed!');
      console.log('Status:', response.status);
      console.log('Error:', data.error || data.message);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testLogin();
