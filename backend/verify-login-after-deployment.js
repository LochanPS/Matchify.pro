import fetch from 'node-fetch';

async function verifyLoginAfterDeployment() {
  console.log('🔍 VERIFYING LOGIN AFTER DEPLOYMENT\n');
  console.log('=' .repeat(60));
  
  const API_URL = 'https://matchify-probackend.vercel.app/api/auth/login';
  const credentials = {
    email: 'ADMIN@gmail.com',
    password: 'ADMIN@123(123)'
  };
  
  console.log('\n📡 Testing API Endpoint:');
  console.log('   URL:', API_URL);
  console.log('   Email:', credentials.email);
  console.log('   Password:', credentials.password);
  
  try {
    console.log('\n⏳ Sending login request...');
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    });
    
    console.log('\n📊 Response Status:', response.status, response.statusText);
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('\n✅ LOGIN SUCCESSFUL!\n');
      console.log('=' .repeat(60));
      
      // Check user data
      console.log('\n👤 User Data:');
      console.log('   ID:', data.user.id);
      console.log('   Email:', data.user.email);
      console.log('   Name:', data.user.name);
      console.log('   Roles:', JSON.stringify(data.user.roles));
      console.log('   Roles Type:', Array.isArray(data.user.roles) ? '✅ ARRAY' : '❌ STRING');
      console.log('   Current Role:', data.user.currentRole);
      console.log('   Is Admin:', data.user.isAdmin);
      
      // Check tokens
      console.log('\n🔑 Tokens:');
      console.log('   Access Token:', data.accessToken ? '✅ Present' : '❌ Missing');
      console.log('   Refresh Token:', data.refreshToken ? '✅ Present' : '❌ Missing');
      
      // Verify roles is array
      console.log('\n🔍 Verification:');
      if (Array.isArray(data.user.roles)) {
        console.log('   ✅ Roles is an array');
        console.log('   ✅ Roles contains:', data.user.roles.join(', '));
        if (data.user.roles.includes('ADMIN')) {
          console.log('   ✅ ADMIN role found in array');
        } else {
          console.log('   ❌ ADMIN role NOT found in array');
        }
      } else {
        console.log('   ❌ Roles is NOT an array (still a string)');
        console.log('   ❌ FIX NOT DEPLOYED YET - Wait for Vercel deployment');
      }
      
      if (data.user.isAdmin === true) {
        console.log('   ✅ isAdmin flag is true');
      } else {
        console.log('   ❌ isAdmin flag is not true');
      }
      
      if (data.user.currentRole === 'ADMIN') {
        console.log('   ✅ currentRole is ADMIN');
      } else {
        console.log('   ❌ currentRole is not ADMIN');
      }
      
      console.log('\n' + '=' .repeat(60));
      
      if (Array.isArray(data.user.roles) && data.user.isAdmin && data.user.currentRole === 'ADMIN') {
        console.log('\n🎉 ALL CHECKS PASSED! LOGIN SHOULD WORK ON FRONTEND!\n');
        console.log('Next steps:');
        console.log('1. Open: https://matchify-ebbzod065-destroyerforevers-projects.vercel.app/login');
        console.log('2. Login with: ADMIN@gmail.com / ADMIN@123(123)');
        console.log('3. Should redirect to /admin-dashboard');
        console.log('4. All admin features should be visible');
      } else {
        console.log('\n⚠️  SOME CHECKS FAILED - DEPLOYMENT MAY NOT BE COMPLETE YET\n');
        console.log('Wait 1-2 minutes and run this script again.');
      }
      
    } else {
      console.log('\n❌ LOGIN FAILED!\n');
      console.log('=' .repeat(60));
      console.log('\nError:', data.error || data.message || 'Unknown error');
      console.log('\nFull response:');
      console.log(JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.log('\nPossible reasons:');
    console.log('- Backend is not deployed yet');
    console.log('- Network connection issue');
    console.log('- API endpoint is down');
  }
  
  console.log('\n' + '=' .repeat(60));
}

verifyLoginAfterDeployment();
