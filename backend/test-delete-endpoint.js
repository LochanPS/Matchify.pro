import fetch from 'node-fetch';

const BACKEND_URL = 'https://matchify-backend.onrender.com';
const ADMIN_EMAIL = 'ADMIN@gmail.com';
const ADMIN_PASSWORD = 'ADMIN@123(123)';
const DELETE_PASSWORD = 'Pradyu@123(123)';

async function testDeleteEndpoint() {
  try {
    console.log('🔐 Step 1: Login as admin...');
    
    // Login
    const loginResponse = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      })
    });

    const loginData = await loginResponse.json();
    
    if (!loginData.success) {
      console.error('❌ Login failed:', loginData);
      return;
    }

    console.log('✅ Login successful');
    const token = loginData.token;

    console.log('\n🗑️  Step 2: Testing delete-all-info endpoint...');
    
    // Test delete endpoint
    const deleteResponse = await fetch(`${BACKEND_URL}/api/admin/delete-all-info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        password: DELETE_PASSWORD
      })
    });

    console.log('Response status:', deleteResponse.status);
    console.log('Response headers:', Object.fromEntries(deleteResponse.headers.entries()));

    const deleteData = await deleteResponse.json();
    console.log('\n📊 Response data:', JSON.stringify(deleteData, null, 2));

    if (deleteData.success) {
      console.log('\n✅ DELETE ALL DATA ENDPOINT WORKING!');
    } else {
      console.log('\n❌ DELETE ALL DATA ENDPOINT FAILED');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDeleteEndpoint();
