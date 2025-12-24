// Day 6 Frontend Authentication Testing Script
// Run this in browser console to test all functionality

console.log('🧪 STARTING DAY 6 FRONTEND AUTH TESTS');

// Test 1: Check if all components are loaded
const testComponentsLoaded = () => {
  console.log('\n1️⃣ Testing Component Loading...');
  
  // Check if navbar exists
  const navbar = document.querySelector('nav');
  console.log(navbar ? '✅ Navbar loaded' : '❌ Navbar missing');
  
  // Check if main content exists
  const main = document.querySelector('main') || document.querySelector('.min-h-screen');
  console.log(main ? '✅ Main content loaded' : '❌ Main content missing');
  
  return navbar && main;
};

// Test 2: Check localStorage for auth data
const testLocalStorage = () => {
  console.log('\n2️⃣ Testing LocalStorage...');
  
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  const user = localStorage.getItem('user');
  
  console.log(accessToken ? '✅ Access token found' : '⚠️ No access token');
  console.log(refreshToken ? '✅ Refresh token found' : '⚠️ No refresh token');
  console.log(user ? '✅ User data found' : '⚠️ No user data');
  
  if (user) {
    try {
      const userData = JSON.parse(user);
      console.log('👤 User:', userData.name, `(${userData.role})`);
      return userData;
    } catch (e) {
      console.log('❌ Invalid user data in localStorage');
      return null;
    }
  }
  
  return null;
};

// Test 3: Check API configuration
const testAPIConfig = () => {
  console.log('\n3️⃣ Testing API Configuration...');
  
  // Check if API base URL is correct
  const expectedAPI = 'http://localhost:5000/api';
  console.log(`🔗 Expected API URL: ${expectedAPI}`);
  
  // Test API health check
  fetch('http://localhost:5000/health')
    .then(response => response.json())
    .then(data => {
      console.log('✅ Backend health check:', data.status);
    })
    .catch(error => {
      console.log('❌ Backend not responding:', error.message);
    });
};

// Test 4: Test navigation
const testNavigation = () => {
  console.log('\n4️⃣ Testing Navigation...');
  
  const currentPath = window.location.pathname;
  console.log(`📍 Current path: ${currentPath}`);
  
  // Check if user is on correct page based on auth status
  const user = testLocalStorage();
  
  if (user) {
    const expectedPaths = {
      'PLAYER': '/dashboard',
      'ORGANIZER': '/organizer/dashboard',
      'UMPIRE': '/umpire/dashboard',
      'ADMIN': '/admin/dashboard'
    };
    
    const expectedPath = expectedPaths[user.role];
    if (currentPath === expectedPath) {
      console.log(`✅ User on correct dashboard for ${user.role}`);
    } else {
      console.log(`⚠️ User should be on ${expectedPath} but is on ${currentPath}`);
    }
  } else {
    const publicPaths = ['/', '/login', '/register'];
    if (publicPaths.includes(currentPath)) {
      console.log('✅ Unauthenticated user on public page');
    } else {
      console.log('⚠️ Unauthenticated user should be redirected to login');
    }
  }
};

// Test 5: Test form validation (if on login/register page)
const testFormValidation = () => {
  console.log('\n5️⃣ Testing Form Validation...');
  
  const loginForm = document.querySelector('form');
  if (loginForm) {
    console.log('✅ Form found on page');
    
    // Check for required fields
    const requiredFields = loginForm.querySelectorAll('input[required]');
    console.log(`📝 Found ${requiredFields.length} required fields`);
    
    // Check for validation attributes
    const emailField = loginForm.querySelector('input[type="email"]');
    const passwordField = loginForm.querySelector('input[type="password"]');
    
    console.log(emailField ? '✅ Email field found' : '❌ Email field missing');
    console.log(passwordField ? '✅ Password field found' : '❌ Password field missing');
  } else {
    console.log('ℹ️ No form on current page');
  }
};

// Test 6: Test responsive design
const testResponsiveDesign = () => {
  console.log('\n6️⃣ Testing Responsive Design...');
  
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  };
  
  console.log(`📱 Viewport: ${viewport.width}x${viewport.height}`);
  
  if (viewport.width < 768) {
    console.log('📱 Mobile view detected');
  } else if (viewport.width < 1024) {
    console.log('📱 Tablet view detected');
  } else {
    console.log('🖥️ Desktop view detected');
  }
  
  // Check for responsive classes
  const responsiveElements = document.querySelectorAll('[class*="sm:"], [class*="md:"], [class*="lg:"]');
  console.log(`✅ Found ${responsiveElements.length} responsive elements`);
};

// Test 7: Test error handling
const testErrorHandling = () => {
  console.log('\n7️⃣ Testing Error Handling...');
  
  // Check for error display elements
  const errorElements = document.querySelectorAll('.alert-error, .text-red-600, .bg-red-50');
  console.log(`🚨 Found ${errorElements.length} error display elements`);
  
  // Check console for any React errors
  const originalError = console.error;
  let errorCount = 0;
  
  console.error = (...args) => {
    if (args[0] && args[0].includes && args[0].includes('Warning')) {
      errorCount++;
    }
    originalError.apply(console, args);
  };
  
  setTimeout(() => {
    console.error = originalError;
    console.log(`🐛 React warnings/errors: ${errorCount}`);
  }, 1000);
};

// Run all tests
const runAllTests = () => {
  console.log('🚀 Running Day 6 Frontend Authentication Tests...');
  console.log('=' .repeat(50));
  
  testComponentsLoaded();
  testLocalStorage();
  testAPIConfig();
  testNavigation();
  testFormValidation();
  testResponsiveDesign();
  testErrorHandling();
  
  console.log('\n' + '=' .repeat(50));
  console.log('🎉 Day 6 Testing Complete!');
  console.log('\n📋 Manual Tests to Perform:');
  console.log('1. Register a new user');
  console.log('2. Login with existing credentials');
  console.log('3. Test logout functionality');
  console.log('4. Try accessing protected routes without auth');
  console.log('5. Test role-based access control');
  console.log('6. Test form validation with invalid data');
  console.log('7. Test responsive design on different screen sizes');
};

// Auto-run tests
runAllTests();

// Export for manual testing
window.matchifyTests = {
  runAllTests,
  testComponentsLoaded,
  testLocalStorage,
  testAPIConfig,
  testNavigation,
  testFormValidation,
  testResponsiveDesign,
  testErrorHandling
};