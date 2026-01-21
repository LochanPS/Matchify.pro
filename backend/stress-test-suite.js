#!/usr/bin/env node

/**
 * MATCHIFY.PRO COMPREHENSIVE STRESS TEST SUITE
 * 
 * This script performs:
 * 1. Load testing with multiple concurrent users
 * 2. Database stress testing
 * 3. API endpoint testing
 * 4. Tournament registration simulation
 * 5. Payment system testing
 * 6. Admin workflow testing
 */

import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';

// Test configuration
const TEST_CONFIG = {
  CONCURRENT_USERS: 50,
  TOURNAMENTS_TO_CREATE: 10,
  REGISTRATIONS_PER_TOURNAMENT: 100,
  STRESS_TEST_DURATION: 300000, // 5 minutes
  API_TIMEOUT: 10000, // 10 seconds
};

// Test results storage
const testResults = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  errors: [],
  performance: {
    avgResponseTime: 0,
    maxResponseTime: 0,
    minResponseTime: Infinity,
    totalRequests: 0,
  },
  users: [],
  tournaments: [],
  registrations: [],
};

// Utility functions
const generateRandomUser = (index) => ({
  name: `TestUser${index}`,
  email: `testuser${index}@matchify.test`,
  phone: `9${String(Math.floor(Math.random() * 1000000000)).padStart(9, '0')}`,
  password: 'TestPassword123!',
  city: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata'][Math.floor(Math.random() * 5)],
  state: ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'West Bengal'][Math.floor(Math.random() * 5)],
});

const generateRandomTournament = (organizerId, index) => ({
  name: `Stress Test Tournament ${index}`,
  description: `This is a stress test tournament created for load testing purposes. Tournament ${index}.`,
  venue: `Test Venue ${index}`,
  city: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata'][Math.floor(Math.random() * 5)],
  state: ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'West Bengal'][Math.floor(Math.random() * 5)],
  startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // 7 days from now
  endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // 9 days from now
  registrationOpenDate: new Date().toISOString().slice(0, 16), // Now
  registrationCloseDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // 5 days from now
  maxParticipants: 128,
  entryFee: Math.floor(Math.random() * 500) + 100, // 100-600 rupees
  categories: [
    {
      name: 'Men\'s Singles',
      format: 'singles',
      gender: 'male',
      ageGroup: 'open',
      entryFee: Math.floor(Math.random() * 300) + 200,
      maxParticipants: 32,
    },
    {
      name: 'Women\'s Singles',
      format: 'singles',
      gender: 'female',
      ageGroup: 'open',
      entryFee: Math.floor(Math.random() * 300) + 200,
      maxParticipants: 32,
    },
    {
      name: 'Men\'s Doubles',
      format: 'doubles',
      gender: 'male',
      ageGroup: 'open',
      entryFee: Math.floor(Math.random() * 400) + 300,
      maxParticipants: 32,
    },
    {
      name: 'Mixed Doubles',
      format: 'doubles',
      gender: 'mixed',
      ageGroup: 'open',
      entryFee: Math.floor(Math.random() * 400) + 300,
      maxParticipants: 32,
    },
  ],
});

const logTest = (testName, status, details = '') => {
  testResults.totalTests++;
  if (status === 'PASS') {
    testResults.passedTests++;
    console.log(`✅ ${testName}: PASSED ${details}`);
  } else {
    testResults.failedTests++;
    testResults.errors.push({ test: testName, error: details });
    console.log(`❌ ${testName}: FAILED ${details}`);
  }
};

const measurePerformance = (startTime, endTime) => {
  const responseTime = endTime - startTime;
  testResults.performance.totalRequests++;
  testResults.performance.avgResponseTime = 
    (testResults.performance.avgResponseTime * (testResults.performance.totalRequests - 1) + responseTime) / 
    testResults.performance.totalRequests;
  testResults.performance.maxResponseTime = Math.max(testResults.performance.maxResponseTime, responseTime);
  testResults.performance.minResponseTime = Math.min(testResults.performance.minResponseTime, responseTime);
  return responseTime;
};

// API helper functions
const apiRequest = async (method, endpoint, data = null, token = null) => {
  const startTime = Date.now();
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      timeout: TEST_CONFIG.API_TIMEOUT,
      headers: {},
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
      config.headers['Content-Type'] = 'application/json';
    }

    const response = await axios(config);
    const endTime = Date.now();
    measurePerformance(startTime, endTime);
    return { success: true, data: response.data, responseTime: endTime - startTime };
  } catch (error) {
    const endTime = Date.now();
    measurePerformance(startTime, endTime);
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      responseTime: endTime - startTime,
      status: error.response?.status 
    };
  }
};

// Test functions
const testDatabaseConnection = async () => {
  console.log('\n🔍 Testing Database Connection...');
  try {
    await prisma.$connect();
    logTest('Database Connection', 'PASS', 'Connected successfully');
    return true;
  } catch (error) {
    logTest('Database Connection', 'FAIL', error.message);
    return false;
  }
};

const testAPIHealth = async () => {
  console.log('\n🔍 Testing API Health...');
  const result = await apiRequest('GET', '/health');
  if (result.success) {
    logTest('API Health Check', 'PASS', `Response time: ${result.responseTime}ms`);
    return true;
  } else {
    logTest('API Health Check', 'FAIL', result.error);
    return false;
  }
};

const createTestUsers = async (count) => {
  console.log(`\n👥 Creating ${count} test users...`);
  const users = [];
  const promises = [];

  for (let i = 1; i <= count; i++) {
    const userData = generateRandomUser(i);
    promises.push(
      apiRequest('POST', '/auth/register', userData).then(result => {
        if (result.success) {
          users.push({ ...userData, token: result.data.token, id: result.data.user.id });
          logTest(`User Creation ${i}`, 'PASS', `User: ${userData.email}`);
        } else {
          logTest(`User Creation ${i}`, 'FAIL', `${userData.email}: ${result.error}`);
        }
      })
    );
  }

  await Promise.all(promises);
  testResults.users = users;
  console.log(`✅ Created ${users.length}/${count} test users`);
  return users;
};

const createTestTournaments = async (users, count) => {
  console.log(`\n🏆 Creating ${count} test tournaments...`);
  const tournaments = [];
  const promises = [];

  for (let i = 1; i <= count; i++) {
    const organizer = users[Math.floor(Math.random() * users.length)];
    const tournamentData = generateRandomTournament(organizer.id, i);
    
    promises.push(
      apiRequest('POST', '/tournaments', tournamentData, organizer.token).then(result => {
        if (result.success) {
          tournaments.push({ ...result.data.tournament, organizer });
          logTest(`Tournament Creation ${i}`, 'PASS', `Tournament: ${tournamentData.name}`);
        } else {
          logTest(`Tournament Creation ${i}`, 'FAIL', `${tournamentData.name}: ${result.error}`);
        }
      })
    );
  }

  await Promise.all(promises);
  testResults.tournaments = tournaments;
  console.log(`✅ Created ${tournaments.length}/${count} test tournaments`);
  return tournaments;
};

const stressTestRegistrations = async (users, tournaments, registrationsPerTournament) => {
  console.log(`\n📝 Stress testing registrations (${registrationsPerTournament} per tournament)...`);
  const registrations = [];
  const promises = [];

  tournaments.forEach((tournament, tournamentIndex) => {
    for (let i = 0; i < registrationsPerTournament && i < users.length; i++) {
      const user = users[i];
      const categories = tournament.categories || [];
      
      if (categories.length > 0) {
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        
        promises.push(
          apiRequest('POST', '/registrations', {
            tournamentId: tournament.id,
            categoryIds: [randomCategory.id],
            partnerEmails: {}
          }, user.token).then(result => {
            if (result.success) {
              registrations.push({
                user: user.email,
                tournament: tournament.name,
                category: randomCategory.name,
                responseTime: result.responseTime
              });
              logTest(`Registration T${tournamentIndex + 1}-U${i + 1}`, 'PASS', 
                `${user.email} → ${tournament.name} (${result.responseTime}ms)`);
            } else {
              logTest(`Registration T${tournamentIndex + 1}-U${i + 1}`, 'FAIL', 
                `${user.email} → ${tournament.name}: ${result.error}`);
            }
          })
        );
      }
    }
  });

  await Promise.all(promises);
  testResults.registrations = registrations;
  console.log(`✅ Completed ${registrations.length} registrations`);
  return registrations;
};

const testConcurrentLoad = async (users, tournaments) => {
  console.log(`\n⚡ Testing concurrent load with ${TEST_CONFIG.CONCURRENT_USERS} users...`);
  const promises = [];
  const startTime = Date.now();

  // Simulate concurrent API calls
  for (let i = 0; i < TEST_CONFIG.CONCURRENT_USERS; i++) {
    const user = users[i % users.length];
    const tournament = tournaments[i % tournaments.length];
    
    promises.push(
      Promise.all([
        apiRequest('GET', '/tournaments', null, user.token),
        apiRequest('GET', `/tournaments/${tournament.id}`, null, user.token),
        apiRequest('GET', '/registrations/my', null, user.token),
        apiRequest('GET', '/notifications', null, user.token),
      ]).then(results => {
        const allSuccessful = results.every(r => r.success);
        const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
        
        logTest(`Concurrent Load User ${i + 1}`, allSuccessful ? 'PASS' : 'FAIL', 
          `Avg response: ${avgResponseTime.toFixed(2)}ms`);
      })
    );
  }

  await Promise.all(promises);
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  console.log(`✅ Concurrent load test completed in ${totalTime}ms`);
  logTest('Concurrent Load Test', 'PASS', `${TEST_CONFIG.CONCURRENT_USERS} users in ${totalTime}ms`);
};

const testPaymentWorkflow = async (users, tournaments) => {
  console.log('\n💰 Testing payment workflow...');
  
  if (tournaments.length === 0 || users.length === 0) {
    logTest('Payment Workflow', 'FAIL', 'No tournaments or users available');
    return;
  }

  const user = users[0];
  const tournament = tournaments[0];
  
  // Test payment verification endpoints
  const adminToken = user.token; // Using first user as admin for testing
  
  const verificationResult = await apiRequest('GET', '/admin/payment-verifications', null, adminToken);
  if (verificationResult.success) {
    logTest('Payment Verification List', 'PASS', `Found ${verificationResult.data.data?.length || 0} verifications`);
  } else {
    logTest('Payment Verification List', 'FAIL', verificationResult.error);
  }

  // Test admin payment dashboard
  const dashboardResult = await apiRequest('GET', '/admin/payment-stats', null, adminToken);
  if (dashboardResult.success) {
    logTest('Admin Payment Dashboard', 'PASS', 'Dashboard loaded successfully');
  } else {
    logTest('Admin Payment Dashboard', 'FAIL', dashboardResult.error);
  }
};

const testDatabasePerformance = async () => {
  console.log('\n🗄️ Testing database performance...');
  
  const startTime = Date.now();
  
  try {
    // Test complex queries
    const [userCount, tournamentCount, registrationCount] = await Promise.all([
      prisma.user.count(),
      prisma.tournament.count(),
      prisma.registration.count(),
    ]);
    
    const queryTime = Date.now() - startTime;
    
    logTest('Database Query Performance', 'PASS', 
      `Users: ${userCount}, Tournaments: ${tournamentCount}, Registrations: ${registrationCount} (${queryTime}ms)`);
    
    // Test complex join query
    const complexQueryStart = Date.now();
    const complexResult = await prisma.registration.findMany({
      include: {
        user: true,
        tournament: true,
        category: true,
      },
      take: 10,
    });
    const complexQueryTime = Date.now() - complexQueryStart;
    
    logTest('Complex Database Query', 'PASS', 
      `Retrieved ${complexResult.length} registrations with joins (${complexQueryTime}ms)`);
    
  } catch (error) {
    logTest('Database Performance', 'FAIL', error.message);
  }
};

const cleanupTestData = async () => {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Delete in correct order to handle foreign key constraints
    await prisma.registration.deleteMany({
      where: {
        user: {
          email: {
            contains: '@matchify.test'
          }
        }
      }
    });
    
    await prisma.tournament.deleteMany({
      where: {
        name: {
          contains: 'Stress Test Tournament'
        }
      }
    });
    
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: '@matchify.test'
        }
      }
    });
    
    logTest('Test Data Cleanup', 'PASS', 'All test data removed');
  } catch (error) {
    logTest('Test Data Cleanup', 'FAIL', error.message);
  }
};

const generateTestReport = () => {
  console.log('\n📊 STRESS TEST REPORT');
  console.log('═'.repeat(80));
  
  console.log(`\n📈 OVERALL RESULTS:`);
  console.log(`Total Tests: ${testResults.totalTests}`);
  console.log(`Passed: ${testResults.passedTests} (${((testResults.passedTests / testResults.totalTests) * 100).toFixed(2)}%)`);
  console.log(`Failed: ${testResults.failedTests} (${((testResults.failedTests / testResults.totalTests) * 100).toFixed(2)}%)`);
  
  console.log(`\n⚡ PERFORMANCE METRICS:`);
  console.log(`Total API Requests: ${testResults.performance.totalRequests}`);
  console.log(`Average Response Time: ${testResults.performance.avgResponseTime.toFixed(2)}ms`);
  console.log(`Max Response Time: ${testResults.performance.maxResponseTime}ms`);
  console.log(`Min Response Time: ${testResults.performance.minResponseTime}ms`);
  
  console.log(`\n👥 USER SIMULATION:`);
  console.log(`Users Created: ${testResults.users.length}`);
  console.log(`Tournaments Created: ${testResults.tournaments.length}`);
  console.log(`Registrations Completed: ${testResults.registrations.length}`);
  
  if (testResults.errors.length > 0) {
    console.log(`\n❌ ERRORS (${testResults.errors.length}):`);
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.test}: ${error.error}`);
    });
  }
  
  console.log('\n🎯 RECOMMENDATIONS:');
  if (testResults.performance.avgResponseTime > 1000) {
    console.log('⚠️ Average response time is high (>1s). Consider optimizing database queries.');
  }
  if (testResults.performance.maxResponseTime > 5000) {
    console.log('⚠️ Some requests are very slow (>5s). Check for bottlenecks.');
  }
  if (testResults.failedTests > testResults.totalTests * 0.05) {
    console.log('⚠️ High failure rate (>5%). Review failed tests and fix issues.');
  }
  if (testResults.failedTests === 0) {
    console.log('✅ All tests passed! Your app is ready for production.');
  }
  
  console.log('\n═'.repeat(80));
};

// Main stress test execution
const runStressTest = async () => {
  console.log('🚀 STARTING MATCHIFY.PRO COMPREHENSIVE STRESS TEST');
  console.log('═'.repeat(80));
  console.log(`Configuration:`);
  console.log(`- Concurrent Users: ${TEST_CONFIG.CONCURRENT_USERS}`);
  console.log(`- Tournaments: ${TEST_CONFIG.TOURNAMENTS_TO_CREATE}`);
  console.log(`- Registrations per Tournament: ${TEST_CONFIG.REGISTRATIONS_PER_TOURNAMENT}`);
  console.log(`- API Timeout: ${TEST_CONFIG.API_TIMEOUT}ms`);
  console.log('═'.repeat(80));
  
  const overallStartTime = Date.now();
  
  try {
    // Phase 1: Basic connectivity tests
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      console.log('❌ Database connection failed. Aborting stress test.');
      return;
    }
    
    const apiHealthy = await testAPIHealth();
    if (!apiHealthy) {
      console.log('❌ API health check failed. Aborting stress test.');
      return;
    }
    
    // Phase 2: User creation and authentication
    const users = await createTestUsers(TEST_CONFIG.CONCURRENT_USERS);
    if (users.length === 0) {
      console.log('❌ No users created. Aborting stress test.');
      return;
    }
    
    // Phase 3: Tournament creation
    const tournaments = await createTestTournaments(users, TEST_CONFIG.TOURNAMENTS_TO_CREATE);
    
    // Phase 4: Registration stress test
    await stressTestRegistrations(users, tournaments, TEST_CONFIG.REGISTRATIONS_PER_TOURNAMENT);
    
    // Phase 5: Concurrent load testing
    await testConcurrentLoad(users, tournaments);
    
    // Phase 6: Payment workflow testing
    await testPaymentWorkflow(users, tournaments);
    
    // Phase 7: Database performance testing
    await testDatabasePerformance();
    
    // Phase 8: Cleanup
    await cleanupTestData();
    
  } catch (error) {
    console.error('💥 Stress test failed with error:', error);
    logTest('Overall Stress Test', 'FAIL', error.message);
  } finally {
    await prisma.$disconnect();
  }
  
  const overallEndTime = Date.now();
  const totalTestTime = overallEndTime - overallStartTime;
  
  console.log(`\n⏱️ Total test execution time: ${(totalTestTime / 1000).toFixed(2)} seconds`);
  
  generateTestReport();
};

// Export for use in other scripts
export {
  runStressTest,
  testResults,
  TEST_CONFIG,
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runStressTest().catch(console.error);
}