// Matchify Health Check Script
import fetch from 'node-fetch';

const backendUrl = 'http://localhost:5000';
const frontendUrl = 'http://localhost:5173';
let passed = 0;
let total = 0;

console.log('');
console.log('================================================================');
console.log('         MATCHIFY HEALTH CHECK SYSTEM                          ');
console.log('================================================================');
console.log('');

// Function to check endpoint
async function testEndpoint(name, url) {
  total++;
  try {
    const response = await fetch(url, { 
      method: 'GET',
      timeout: 5000 
    });
    
    if (response.ok) {
      console.log(`✅ ${name} : OK`);
      passed++;
      return true;
    } else {
      console.log(`❌ ${name} : FAILED (Status: ${response.status})`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${name} : FAILED (${error.message})`);
    return false;
  }
}

// Run all checks
async function runHealthCheck() {
  // Backend Checks
  console.log('🔍 Checking Backend Server...');
  await testEndpoint('Health Check', `${backendUrl}/health`);
  await testEndpoint('API Root', `${backendUrl}/api`);
  await testEndpoint('Tournaments API', `${backendUrl}/api/tournaments?limit=1`);
  
  // Frontend Check
  console.log('');
  console.log('🔍 Checking Frontend Server...');
  await testEndpoint('Frontend', frontendUrl);
  
  // Summary
  console.log('');
  console.log('================================================================');
  console.log('                  HEALTH CHECK SUMMARY                          ');
  console.log('================================================================');
  console.log('');
  console.log(`Total: ${passed}/${total} checks passed`);
  
  if (passed === total) {
    console.log('');
    console.log('🎉 All systems operational! Ready to use.');
    console.log('');
  } else {
    console.log('');
    console.log('⚠️  Some systems are not responding. Check the errors above.');
    console.log('');
  }
  
  // URLs
  console.log('================================================================');
  console.log('                    ACCESS URLS                                 ');
  console.log('================================================================');
  console.log('');
  console.log(`Frontend:  ${frontendUrl}`);
  console.log(`Backend:   ${backendUrl}`);
  console.log(`API Docs:  ${backendUrl}/api`);
  console.log(`Health:    ${backendUrl}/health`);
  console.log('');
  
  process.exit(passed === total ? 0 : 1);
}

runHealthCheck();
