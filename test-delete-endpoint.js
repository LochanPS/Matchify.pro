/**
 * Test script to verify the delete all data endpoint is deployed
 * Run this to check if Render has deployed the latest code
 */

const BACKEND_URL = 'https://matchify-backend.onrender.com';

async function testDeleteEndpoint() {
  console.log('🔍 Testing Delete All Data Endpoint...\n');
  
  // Test 1: Check if test endpoint exists
  console.log('Test 1: Checking test endpoint...');
  try {
    const testResponse = await fetch(`${BACKEND_URL}/api/admin/delete-all-info/test`);
    const testData = await testResponse.json();
    
    if (testResponse.ok) {
      console.log('✅ Test endpoint is working!');
      console.log('   Response:', testData);
    } else {
      console.log('❌ Test endpoint returned error:', testResponse.status);
      console.log('   Response:', testData);
    }
  } catch (error) {
    console.log('❌ Test endpoint failed:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 2: Check if main endpoint exists (without auth)
  console.log('Test 2: Checking main endpoint (should return 401)...');
  try {
    const mainResponse = await fetch(`${BACKEND_URL}/api/admin/delete-all-info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password: 'test' })
    });
    const mainData = await mainResponse.json();
    
    if (mainResponse.status === 401) {
      console.log('✅ Main endpoint exists (returned 401 as expected without token)');
      console.log('   Response:', mainData);
    } else if (mainResponse.status === 404) {
      console.log('❌ Main endpoint NOT FOUND - Render hasn\'t deployed yet!');
      console.log('   Response:', mainData);
    } else {
      console.log('⚠️  Unexpected status:', mainResponse.status);
      console.log('   Response:', mainData);
    }
  } catch (error) {
    console.log('❌ Main endpoint failed:', error.message);
  }
  
  console.log('\n---\n');
  console.log('📝 Summary:');
  console.log('   - If test endpoint works: Route is deployed ✅');
  console.log('   - If main endpoint returns 401: Route is working, needs auth ✅');
  console.log('   - If both return 404: Render hasn\'t deployed the latest code yet ⏳');
  console.log('\n   Latest commit should be: c08b01b');
  console.log('   Check Render dashboard for deployment status');
}

testDeleteEndpoint();
