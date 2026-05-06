import fetch from 'node-fetch';

async function testLoginAPI() {
  try {
    const API_URL = 'https://matchify-probackend.vercel.app/api/auth/login';
    
    console.log('🔍 Testing login API endpoint...');
    console.log('URL:', API_URL);
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'ADMIN@gmail.com',
        password: 'ADMIN@123(123)'
      })
    });
    
    console.log('\n📡 Response status:', response.status);
    console.log('Response status text:', response.statusText);
    
    const data = await response.json();
    
    console.log('\n📦 Response data:');
    console.log(JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ LOGIN SUCCESSFUL!');
      console.log('Token received:', !!data.accessToken);
      console.log('User data received:', !!data.user);
    } else {
      console.log('\n❌ LOGIN FAILED!');
      console.log('Error:', data.error || data.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testLoginAPI();
