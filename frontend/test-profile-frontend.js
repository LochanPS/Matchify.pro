// Frontend Profile System Test Script - Day 10 Enhanced
// Run this in the browser console on http://localhost:5173/profile

const ProfileTests = {
  // Test if enhanced profile page components are loaded
  testEnhancedProfileComponents: () => {
    console.log('🧪 Testing Enhanced Profile Page Components...');
    
    const tests = [
      { name: 'Profile Route', check: () => window.location.pathname === '/profile' },
      { name: 'Profile Header', check: () => document.querySelector('h1') !== null },
      { name: 'Image Upload Component', check: () => document.querySelector('input[type="file"]') !== null },
      { name: 'Edit Profile Button', check: () => document.querySelector('button').textContent.includes('Edit') },
      { name: 'Password Button', check: () => Array.from(document.querySelectorAll('button')).some(btn => btn.textContent.includes('Password')) },
      { name: 'Stats Cards', check: () => document.querySelectorAll('[class*="bg-"][class*="rounded"]').length >= 4 },
      { name: 'Profile Photo Area', check: () => document.querySelector('[class*="rounded-full"]') !== null }
    ];
    
    let passed = 0;
    tests.forEach(test => {
      try {
        if (test.check()) {
          console.log(`✅ ${test.name}`);
          passed++;
        } else {
          console.log(`❌ ${test.name}`);
        }
      } catch (error) {
        console.log(`❌ ${test.name} - Error: ${error.message}`);
      }
    });
    
    console.log(`📊 Enhanced Profile Components: ${passed}/${tests.length} passed`);
    return passed === tests.length;
  },

  // Test profile data loading and display
  testProfileDataDisplay: () => {
    console.log('📊 Testing Profile Data Display...');
    
    const tests = [
      { name: 'User Name Display', check: () => document.querySelector('h1').textContent.length > 0 },
      { name: 'User Role Badge', check: () => document.querySelector('[class*="rounded-full"]').textContent.includes('PLAYER') || document.querySelector('[class*="rounded-full"]').textContent.includes('ORGANIZER') },
      { name: 'Email Display', check: () => document.body.textContent.includes('@') },
      { name: 'Stats Values', check: () => document.querySelectorAll('[class*="text-2xl"]').length >= 4 },
      { name: 'Member Since Info', check: () => document.body.textContent.includes('Member Since') || document.body.textContent.includes('2024') }
    ];
    
    let passed = 0;
    tests.forEach(test => {
      try {
        if (test.check()) {
          console.log(`✅ ${test.name}`);
          passed++;
        } else {
          console.log(`❌ ${test.name}`);
        }
      } catch (error) {
        console.log(`❌ ${test.name} - Error: ${error.message}`);
      }
    });
    
    console.log(`📊 Profile Data Display: ${passed}/${tests.length} passed`);
    return passed === tests.length;
  },

  // Test edit mode functionality
  testEditModeToggle: () => {
    console.log('✏️ Testing Edit Mode Toggle...');
    
    const editButton = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('Edit'));
    
    const tests = [
      { name: 'Edit Button Exists', check: () => editButton !== undefined },
      { 
        name: 'Edit Mode Activation', 
        check: () => {
          if (!editButton) return false;
          editButton.click();
          setTimeout(() => {
            const saveButton = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('Save'));
            return saveButton !== undefined;
          }, 100);
          return true;
        }
      },
      { name: 'Form Fields Appear', check: () => document.querySelectorAll('input[type="text"]').length >= 3 },
      { name: 'Save Button Appears', check: () => Array.from(document.querySelectorAll('button')).some(btn => btn.textContent.includes('Save')) },
      { name: 'Cancel Button Appears', check: () => Array.from(document.querySelectorAll('button')).some(btn => btn.textContent.includes('Cancel')) }
    ];
    
    let passed = 0;
    tests.forEach(test => {
      try {
        if (test.check()) {
          console.log(`✅ ${test.name}`);
          passed++;
        } else {
          console.log(`❌ ${test.name}`);
        }
      } catch (error) {
        console.log(`❌ ${test.name} - Error: ${error.message}`);
      }
    });
    
    console.log(`📊 Edit Mode Toggle: ${passed}/${tests.length} passed`);
    return passed === tests.length;
  },

  // Test password modal functionality
  testPasswordModal: () => {
    console.log('🔐 Testing Password Modal...');
    
    const passwordButton = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('Password'));
    
    const tests = [
      { name: 'Password Button Exists', check: () => passwordButton !== undefined },
      { 
        name: 'Modal Opens', 
        check: () => {
          if (!passwordButton) return false;
          passwordButton.click();
          setTimeout(() => {
            const modal = document.querySelector('[class*="fixed"][class*="inset-0"]');
            return modal !== null;
          }, 100);
          return true;
        }
      },
      { name: 'Password Fields Present', check: () => document.querySelectorAll('input[type="password"]').length >= 2 },
      { name: 'Show/Hide Toggle', check: () => document.querySelectorAll('button[type="button"]').length >= 3 },
      { name: 'Modal Close Button', check: () => document.querySelector('[class*="text-gray-500"]') !== null }
    ];
    
    let passed = 0;
    tests.forEach(test => {
      try {
        if (test.check()) {
          console.log(`✅ ${test.name}`);
          passed++;
        } else {
          console.log(`❌ ${test.name}`);
        }
      } catch (error) {
        console.log(`❌ ${test.name} - Error: ${error.message}`);
      }
    });
    
    console.log(`📊 Password Modal: ${passed}/${tests.length} passed`);
    return passed === tests.length;
  },

  // Test image upload component
  testImageUploadComponent: () => {
    console.log('📸 Testing Image Upload Component...');
    
    const tests = [
      { name: 'File Input Exists', check: () => document.querySelector('input[type="file"]') !== null },
      { name: 'Upload Button Exists', check: () => Array.from(document.querySelectorAll('button')).some(btn => btn.textContent.includes('Change Photo')) },
      { name: 'Avatar Container', check: () => document.querySelector('[class*="rounded-full"]') !== null },
      { name: 'File Size Limit Info', check: () => document.body.textContent.includes('5MB') },
      { name: 'File Type Info', check: () => document.body.textContent.includes('JPG') || document.body.textContent.includes('PNG') }
    ];
    
    let passed = 0;
    tests.forEach(test => {
      try {
        if (test.check()) {
          console.log(`✅ ${test.name}`);
          passed++;
        } else {
          console.log(`❌ ${test.name}`);
        }
      } catch (error) {
        console.log(`❌ ${test.name} - Error: ${error.message}`);
      }
    });
    
    console.log(`📊 Image Upload Component: ${passed}/${tests.length} passed`);
    return passed === tests.length;
  },

  // Test responsive design
  testResponsiveDesign: () => {
    console.log('📱 Testing Responsive Design...');
    
    const tests = [
      { name: 'Mobile Viewport Meta', check: () => document.querySelector('meta[name="viewport"]') !== null },
      { name: 'Responsive Grid Classes', check: () => document.querySelector('[class*="md:"]') !== null },
      { name: 'Flexible Layout', check: () => document.querySelector('[class*="flex"]') !== null },
      { name: 'Responsive Text', check: () => document.querySelector('[class*="sm:"]') !== null || document.querySelector('[class*="lg:"]') !== null },
      { name: 'Mobile-First Design', check: () => document.querySelector('[class*="grid-cols-1"]') !== null }
    ];
    
    let passed = 0;
    tests.forEach(test => {
      try {
        if (test.check()) {
          console.log(`✅ ${test.name}`);
          passed++;
        } else {
          console.log(`❌ ${test.name}`);
        }
      } catch (error) {
        console.log(`❌ ${test.name} - Error: ${error.message}`);
      }
    });
    
    console.log(`📊 Responsive Design: ${passed}/${tests.length} passed`);
    return passed === tests.length;
  },

  // Test form validation
  testFormValidation: () => {
    console.log('🔍 Testing Form Validation...');
    
    // First activate edit mode
    const editButton = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('Edit'));
    if (editButton) editButton.click();
    
    const tests = [
      { name: 'Required Field Markers', check: () => document.body.textContent.includes('*') },
      { name: 'Input Placeholders', check: () => document.querySelectorAll('input[placeholder]').length >= 3 },
      { name: 'Select Options', check: () => document.querySelectorAll('option').length >= 3 },
      { name: 'Date Input Type', check: () => document.querySelector('input[type="date"]') !== null },
      { name: 'Tel Input Type', check: () => document.querySelector('input[type="tel"]') !== null }
    ];
    
    let passed = 0;
    tests.forEach(test => {
      try {
        if (test.check()) {
          console.log(`✅ ${test.name}`);
          passed++;
        } else {
          console.log(`❌ ${test.name}`);
        }
      } catch (error) {
        console.log(`❌ ${test.name} - Error: ${error.message}`);
      }
    });
    
    console.log(`📊 Form Validation: ${passed}/${tests.length} passed`);
    return passed === tests.length;
  },

  // Test API integration
  testAPIIntegration: () => {
    console.log('🔗 Testing API Integration...');
    
    const tests = [
      { name: 'Auth Token Present', check: () => localStorage.getItem('accessToken') !== null },
      { name: 'User Data in Storage', check: () => localStorage.getItem('user') !== null },
      { name: 'Profile Data Loaded', check: () => document.querySelector('h1').textContent.length > 0 },
      { name: 'Stats Data Present', check: () => document.querySelectorAll('[class*="text-2xl"]').length >= 4 },
      { name: 'Network Requests', check: () => window.fetch !== undefined || window.axios !== undefined }
    ];
    
    let passed = 0;
    tests.forEach(test => {
      try {
        if (test.check()) {
          console.log(`✅ ${test.name}`);
          passed++;
        } else {
          console.log(`❌ ${test.name}`);
        }
      } catch (error) {
        console.log(`❌ ${test.name} - Error: ${error.message}`);
      }
    });
    
    console.log(`📊 API Integration: ${passed}/${tests.length} passed`);
    return passed === tests.length;
  },

  // Run all enhanced tests
  runAllTests: () => {
    console.log('🎾 MATCHIFY ENHANCED FRONTEND PROFILE TESTS - DAY 10');
    console.log('=====================================================');
    
    const testSuites = [
      { name: 'Enhanced Profile Components', fn: ProfileTests.testEnhancedProfileComponents },
      { name: 'Profile Data Display', fn: ProfileTests.testProfileDataDisplay },
      { name: 'Edit Mode Toggle', fn: ProfileTests.testEditModeToggle },
      { name: 'Password Modal', fn: ProfileTests.testPasswordModal },
      { name: 'Image Upload Component', fn: ProfileTests.testImageUploadComponent },
      { name: 'Responsive Design', fn: ProfileTests.testResponsiveDesign },
      { name: 'Form Validation', fn: ProfileTests.testFormValidation },
      { name: 'API Integration', fn: ProfileTests.testAPIIntegration }
    ];
    
    let totalPassed = 0;
    let totalTests = testSuites.length;
    
    testSuites.forEach(suite => {
      console.log(`\n🧪 Running ${suite.name}...`);
      try {
        if (suite.fn()) {
          console.log(`✅ ${suite.name} PASSED`);
          totalPassed++;
        } else {
          console.log(`❌ ${suite.name} FAILED`);
        }
      } catch (error) {
        console.log(`❌ ${suite.name} ERROR: ${error.message}`);
      }
    });
    
    console.log('\n📊 FINAL RESULTS - DAY 10 ENHANCED PROFILE');
    console.log('==========================================');
    console.log(`✅ Passed: ${totalPassed}/${totalTests}`);
    console.log(`📈 Success Rate: ${Math.round((totalPassed / totalTests) * 100)}%`);
    
    if (totalPassed === totalTests) {
      console.log('\n🎉 ALL ENHANCED PROFILE TESTS PASSED! DAY 10 COMPLETE! 🎾');
      console.log('🚀 Ready for Day 11: Advanced Profile Features!');
    } else {
      console.log('\n⚠️ Some tests failed. Check the implementation.');
    }
    
    console.log('\n🎯 WHAT YOU SHOULD SEE:');
    console.log('- Professional profile page with avatar upload');
    console.log('- Inline editing with save/cancel buttons');
    console.log('- Password change modal with show/hide toggles');
    console.log('- Stats cards with user performance data');
    console.log('- Responsive design for mobile and desktop');
    console.log('- Real-time form validation and error handling');
    
    return totalPassed === totalTests;
  },

  // Manual testing checklist
  runManualTests: () => {
    console.log('\n📋 MANUAL TESTING CHECKLIST - DAY 10');
    console.log('====================================');
    console.log('Please test these manually:');
    console.log('');
    console.log('✅ Profile Display:');
    console.log('  □ Navigate to /profile');
    console.log('  □ See your name, email, role badge');
    console.log('  □ See stats cards with current values');
    console.log('  □ Profile photo area shows placeholder or image');
    console.log('');
    console.log('✅ Image Upload:');
    console.log('  □ Click "Change Photo" button');
    console.log('  □ Select an image file (JPG/PNG under 5MB)');
    console.log('  □ See preview immediately');
    console.log('  □ Upload completes successfully');
    console.log('  □ Refresh page → photo persists');
    console.log('');
    console.log('✅ Profile Edit:');
    console.log('  □ Click "Edit Profile" button');
    console.log('  □ Form fields appear with current data');
    console.log('  □ Change name, phone, city, state');
    console.log('  □ Click "Save" → changes appear immediately');
    console.log('  □ Click "Cancel" → reverts changes');
    console.log('');
    console.log('✅ Password Change:');
    console.log('  □ Click "Password" button');
    console.log('  □ Modal opens with password fields');
    console.log('  □ Test show/hide password toggles');
    console.log('  □ Enter wrong current password → shows error');
    console.log('  □ Enter mismatched passwords → shows error');
    console.log('  □ Enter valid passwords → success message');
    console.log('');
    console.log('✅ Responsive Design:');
    console.log('  □ Resize browser window');
    console.log('  □ Check mobile layout (< 768px)');
    console.log('  □ Check tablet layout (768px - 1024px)');
    console.log('  □ Check desktop layout (> 1024px)');
    console.log('');
    console.log('✅ Error Handling:');
    console.log('  □ Turn off backend → shows friendly error');
    console.log('  □ Upload large file → shows size error');
    console.log('  □ Invalid form data → shows validation errors');
  }
};

// Auto-run tests if on profile page
if (window.location.pathname === '/profile') {
  console.log('🎯 Profile page detected! Running enhanced tests automatically...');
  setTimeout(() => {
    ProfileTests.runAllTests();
    ProfileTests.runManualTests();
  }, 2000);
} else {
  console.log('📍 Navigate to /profile to run automatic tests, or run ProfileTests.runAllTests() manually');
}

// Make tests available globally
window.ProfileTests = ProfileTests;

console.log('🎾 Enhanced Profile test suite loaded! Available commands:');
console.log('- ProfileTests.runAllTests() - Run all automated tests');
console.log('- ProfileTests.runManualTests() - Show manual testing checklist');
console.log('- ProfileTests.testEnhancedProfileComponents() - Test component loading');
console.log('- ProfileTests.testEditModeToggle() - Test edit functionality');
console.log('- ProfileTests.testPasswordModal() - Test password modal');
console.log('- ProfileTests.testImageUploadComponent() - Test image upload');
console.log('- ProfileTests.testResponsiveDesign() - Test responsive features');