#!/usr/bin/env node

/**
 * MATCHIFY.PRO LOAD TEST SIMULATION
 * 
 * This script simulates real-world tournament scenarios:
 * 1. Creates multiple tournaments simultaneously
 * 2. Simulates hundreds of users registering at the same time
 * 3. Tests admin payment verification under load
 * 4. Simulates tournament day activities
 * 5. Tests database performance under concurrent load
 */

import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';

// Load test configuration
const LOAD_TEST_CONFIG = {
  SIMULTANEOUS_TOURNAMENTS: 5,
  USERS_PER_TOURNAMENT: 50,
  CONCURRENT_REGISTRATIONS: 20,
  ADMIN_ACTIONS_PER_MINUTE: 30,
  TEST_DURATION_MINUTES: 10,
  RESPONSE_TIME_THRESHOLD: 2000, // 2 seconds
};

// Test results
const loadTestResults = {
  scenarios: {},
  performance: {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    avgResponseTime: 0,
    maxResponseTime: 0,
    minResponseTime: Infinity,
    requestsPerSecond: 0,
  },
  errors: [],
  warnings: [],
};

// Utility functions
const logLoadTest = (scenario, status, details = '') => {
  if (!loadTestResults.scenarios[scenario]) {
    loadTestResults.scenarios[scenario] = { success: 0, failure: 0, total: 0 };
  }
  
  loadTestResults.scenarios[scenario].total++;
  
  if (status === 'SUCCESS') {
    loadTestResults.scenarios[scenario].success++;
    console.log(`✅ ${scenario}: ${details}`);
  } else {
    loadTestResults.scenarios[scenario].failure++;
    loadTestResults.errors.push({ scenario, error: details });
    console.log(`❌ ${scenario}: ${details}`);
  }
};

const measurePerformance = (startTime, endTime, success) => {
  const responseTime = endTime - startTime;
  loadTestResults.performance.totalRequests++;
  
  if (success) {
    loadTestResults.performance.successfulRequests++;
  } else {
    loadTestResults.performance.failedRequests++;
  }
  
  // Update average response time
  const totalRequests = loadTestResults.performance.totalRequests;
  loadTestResults.performance.avgResponseTime = 
    (loadTestResults.performance.avgResponseTime * (totalRequests - 1) + responseTime) / totalRequests;
  
  // Update min/max response times
  loadTestResults.performance.maxResponseTime = Math.max(loadTestResults.performance.maxResponseTime, responseTime);
  loadTestResults.performance.minResponseTime = Math.min(loadTestResults.performance.minResponseTime, responseTime);
  
  // Check for slow responses
  if (responseTime > LOAD_TEST_CONFIG.RESPONSE_TIME_THRESHOLD) {
    loadTestResults.warnings.push(`Slow response: ${responseTime}ms`);
  }
  
  return responseTime;
};

const apiRequest = async (method, endpoint, data = null, token = null) => {
  const startTime = Date.now();
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      timeout: 15000, // 15 seconds for load testing
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
    measurePerformance(startTime, endTime, true);
    return { success: true, data: response.data, responseTime: endTime - startTime };
  } catch (error) {
    const endTime = Date.now();
    measurePerformance(startTime, endTime, false);
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      responseTime: endTime - startTime,
      status: error.response?.status 
    };
  }
};

// Generate realistic test data
const generateRealisticUser = (index) => {
  const firstNames = ['Arjun', 'Priya', 'Rahul', 'Sneha', 'Vikram', 'Anita', 'Karan', 'Meera', 'Rohan', 'Kavya'];
  const lastNames = ['Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Jain', 'Agarwal', 'Mehta', 'Shah', 'Verma'];
  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad'];
  const states = ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'West Bengal', 'Telangana', 'Gujarat'];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const cityIndex = Math.floor(Math.random() * cities.length);
  
  return {
    name: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}${lastName.toLowerCase()}${index}@loadtest.com`,
    phone: `9${String(Math.floor(Math.random() * 1000000000)).padStart(9, '0')}`,
    password: 'LoadTest123!',
    city: cities[cityIndex],
    state: states[cityIndex],
  };
};

const generateRealisticTournament = (organizerId, index) => {
  const tournamentNames = [
    'Mumbai Open Badminton Championship',
    'Delhi State Badminton Tournament',
    'Bangalore Corporate Cup',
    'Chennai Masters Tournament',
    'Kolkata Premier League',
  ];
  
  const venues = [
    'Sports Complex Arena',
    'City Badminton Hall',
    'Olympic Sports Center',
    'Municipal Stadium',
    'University Sports Complex',
  ];
  
  return {
    name: `${tournamentNames[index % tournamentNames.length]} ${index}`,
    description: `Professional badminton tournament with multiple categories and cash prizes. Tournament ${index} in the load test series.`,
    venue: `${venues[index % venues.length]} ${index}`,
    city: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata'][index % 5],
    state: ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'West Bengal'][index % 5],
    startDate: new Date(Date.now() + (7 + index) * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    endDate: new Date(Date.now() + (9 + index) * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    registrationOpenDate: new Date().toISOString().slice(0, 16),
    registrationCloseDate: new Date(Date.now() + (5 + index) * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    maxParticipants: 128,
    entryFee: 500 + (index * 100),
    categories: [
      {
        name: 'Men\'s Singles',
        format: 'singles',
        gender: 'male',
        ageGroup: 'open',
        entryFee: 300 + (index * 50),
        maxParticipants: 32,
      },
      {
        name: 'Women\'s Singles',
        format: 'singles',
        gender: 'female',
        ageGroup: 'open',
        entryFee: 300 + (index * 50),
        maxParticipants: 32,
      },
      {
        name: 'Men\'s Doubles',
        format: 'doubles',
        gender: 'male',
        ageGroup: 'open',
        entryFee: 400 + (index * 50),
        maxParticipants: 32,
      },
      {
        name: 'Women\'s Doubles',
        format: 'doubles',
        gender: 'female',
        ageGroup: 'open',
        entryFee: 400 + (index * 50),
        maxParticipants: 32,
      },
      {
        name: 'Mixed Doubles',
        format: 'doubles',
        gender: 'mixed',
        ageGroup: 'open',
        entryFee: 450 + (index * 50),
        maxParticipants: 32,
      },
    ],
  };
};

// Load test scenarios
const simulateUserRegistrationWave = async () => {
  console.log('\n🌊 Simulating User Registration Wave...');
  
  const userCount = LOAD_TEST_CONFIG.USERS_PER_TOURNAMENT;
  const users = [];
  const registrationPromises = [];
  
  // Create users in batches to simulate realistic registration patterns
  const batchSize = 10;
  for (let batch = 0; batch < Math.ceil(userCount / batchSize); batch++) {
    const batchPromises = [];
    
    for (let i = 0; i < batchSize && (batch * batchSize + i) < userCount; i++) {
      const userIndex = batch * batchSize + i;
      const userData = generateRealisticUser(userIndex);
      
      batchPromises.push(
        apiRequest('POST', '/auth/register', userData).then(result => {
          if (result.success) {
            users.push({ ...userData, token: result.data.token, id: result.data.user.id });
            logLoadTest('User Registration', 'SUCCESS', 
              `${userData.name} registered (${result.responseTime}ms)`);
          } else {
            logLoadTest('User Registration', 'FAILURE', 
              `${userData.name}: ${result.error}`);
          }
        })
      );
    }
    
    // Execute batch and wait a bit before next batch (realistic timing)
    await Promise.all(batchPromises);
    if (batch < Math.ceil(userCount / batchSize) - 1) {
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms between batches
    }
  }
  
  console.log(`✅ User registration wave completed: ${users.length}/${userCount} users created`);
  return users;
};

const simulateSimultaneousTournamentCreation = async (users) => {
  console.log('\n🏆 Simulating Simultaneous Tournament Creation...');
  
  if (users.length === 0) {
    logLoadTest('Tournament Creation', 'FAILURE', 'No users available');
    return [];
  }
  
  const tournaments = [];
  const tournamentPromises = [];
  
  for (let i = 0; i < LOAD_TEST_CONFIG.SIMULTANEOUS_TOURNAMENTS; i++) {
    const organizer = users[i % users.length];
    const tournamentData = generateRealisticTournament(organizer.id, i);
    
    tournamentPromises.push(
      apiRequest('POST', '/tournaments', tournamentData, organizer.token).then(result => {
        if (result.success) {
          tournaments.push({ ...result.data.tournament, organizer });
          logLoadTest('Tournament Creation', 'SUCCESS', 
            `${tournamentData.name} created (${result.responseTime}ms)`);
        } else {
          logLoadTest('Tournament Creation', 'FAILURE', 
            `${tournamentData.name}: ${result.error}`);
        }
      })
    );
  }
  
  await Promise.all(tournamentPromises);
  console.log(`✅ Tournament creation completed: ${tournaments.length}/${LOAD_TEST_CONFIG.SIMULTANEOUS_TOURNAMENTS} tournaments created`);
  return tournaments;
};

const simulateConcurrentRegistrations = async (users, tournaments) => {
  console.log('\n📝 Simulating Concurrent Tournament Registrations...');
  
  if (users.length === 0 || tournaments.length === 0) {
    logLoadTest('Concurrent Registrations', 'FAILURE', 'No users or tournaments available');
    return;
  }
  
  const registrationPromises = [];
  const registrationsPerTournament = Math.min(LOAD_TEST_CONFIG.CONCURRENT_REGISTRATIONS, users.length);
  
  tournaments.forEach((tournament, tournamentIndex) => {
    for (let i = 0; i < registrationsPerTournament; i++) {
      const user = users[i];
      const categories = tournament.categories || [];
      
      if (categories.length > 0) {
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        
        registrationPromises.push(
          apiRequest('POST', '/registrations', {
            tournamentId: tournament.id,
            categoryIds: [randomCategory.id],
            partnerEmails: {}
          }, user.token).then(result => {
            if (result.success) {
              logLoadTest('Concurrent Registration', 'SUCCESS', 
                `${user.name} → ${tournament.name} (${result.responseTime}ms)`);
            } else {
              logLoadTest('Concurrent Registration', 'FAILURE', 
                `${user.name} → ${tournament.name}: ${result.error}`);
            }
          })
        );
      }
    }
  });
  
  const startTime = Date.now();
  await Promise.all(registrationPromises);
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  console.log(`✅ Concurrent registrations completed in ${totalTime}ms`);
  console.log(`📊 Registration rate: ${(registrationPromises.length / (totalTime / 1000)).toFixed(2)} registrations/second`);
};

const simulateAdminWorkload = async (users, tournaments) => {
  console.log('\n👨‍💼 Simulating Admin Workload...');
  
  if (users.length === 0) {
    logLoadTest('Admin Workload', 'FAILURE', 'No users available');
    return;
  }
  
  const admin = users[0]; // Use first user as admin
  const adminPromises = [];
  const actionsPerMinute = LOAD_TEST_CONFIG.ADMIN_ACTIONS_PER_MINUTE;
  const testDurationMs = LOAD_TEST_CONFIG.TEST_DURATION_MINUTES * 60 * 1000;
  const actionInterval = 60000 / actionsPerMinute; // ms between actions
  
  const adminActions = [
    () => apiRequest('GET', '/admin/payment-verifications', null, admin.token),
    () => apiRequest('GET', '/admin/payment-stats', null, admin.token),
    () => apiRequest('GET', '/tournaments', null, admin.token),
    () => apiRequest('GET', '/registrations/my', null, admin.token),
    () => apiRequest('GET', '/notifications', null, admin.token),
  ];
  
  const startTime = Date.now();
  let actionCount = 0;
  
  while (Date.now() - startTime < testDurationMs) {
    const action = adminActions[actionCount % adminActions.length];
    
    adminPromises.push(
      action().then(result => {
        if (result.success) {
          logLoadTest('Admin Action', 'SUCCESS', 
            `Action ${actionCount + 1} completed (${result.responseTime}ms)`);
        } else {
          logLoadTest('Admin Action', 'FAILURE', 
            `Action ${actionCount + 1}: ${result.error}`);
        }
      })
    );
    
    actionCount++;
    
    // Wait for next action
    await new Promise(resolve => setTimeout(resolve, actionInterval));
  }
  
  await Promise.all(adminPromises);
  console.log(`✅ Admin workload simulation completed: ${actionCount} actions in ${LOAD_TEST_CONFIG.TEST_DURATION_MINUTES} minutes`);
};

const simulateDatabaseStress = async () => {
  console.log('\n🗄️ Simulating Database Stress...');
  
  const dbPromises = [];
  const queryTypes = [
    () => prisma.user.count(),
    () => prisma.tournament.count(),
    () => prisma.registration.count(),
    () => prisma.user.findMany({ take: 10 }),
    () => prisma.tournament.findMany({ take: 5, include: { categories: true } }),
    () => prisma.registration.findMany({ 
      take: 10, 
      include: { user: true, tournament: true, category: true } 
    }),
  ];
  
  // Execute 100 concurrent database operations
  for (let i = 0; i < 100; i++) {
    const queryType = queryTypes[i % queryTypes.length];
    
    dbPromises.push(
      queryType().then(result => {
        logLoadTest('Database Query', 'SUCCESS', 
          `Query ${i + 1} completed`);
      }).catch(error => {
        logLoadTest('Database Query', 'FAILURE', 
          `Query ${i + 1}: ${error.message}`);
      })
    );
  }
  
  const startTime = Date.now();
  await Promise.all(dbPromises);
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  console.log(`✅ Database stress test completed in ${totalTime}ms`);
  console.log(`📊 Query rate: ${(100 / (totalTime / 1000)).toFixed(2)} queries/second`);
};

const cleanupLoadTestData = async () => {
  console.log('\n🧹 Cleaning up load test data...');
  
  try {
    // Delete in correct order
    await prisma.registration.deleteMany({
      where: {
        user: {
          email: {
            contains: '@loadtest.com'
          }
        }
      }
    });
    
    await prisma.tournament.deleteMany({
      where: {
        OR: [
          { name: { contains: 'Mumbai Open Badminton Championship' } },
          { name: { contains: 'Delhi State Badminton Tournament' } },
          { name: { contains: 'Bangalore Corporate Cup' } },
          { name: { contains: 'Chennai Masters Tournament' } },
          { name: { contains: 'Kolkata Premier League' } },
        ]
      }
    });
    
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: '@loadtest.com'
        }
      }
    });
    
    logLoadTest('Cleanup', 'SUCCESS', 'All load test data removed');
  } catch (error) {
    logLoadTest('Cleanup', 'FAILURE', error.message);
  }
};

const generateLoadTestReport = () => {
  console.log('\n📊 LOAD TEST REPORT');
  console.log('═'.repeat(80));
  
  // Calculate requests per second
  const testDurationSeconds = LOAD_TEST_CONFIG.TEST_DURATION_MINUTES * 60;
  loadTestResults.performance.requestsPerSecond = 
    loadTestResults.performance.totalRequests / testDurationSeconds;
  
  console.log(`\n📈 PERFORMANCE METRICS:`);
  console.log(`Total Requests: ${loadTestResults.performance.totalRequests}`);
  console.log(`Successful Requests: ${loadTestResults.performance.successfulRequests}`);
  console.log(`Failed Requests: ${loadTestResults.performance.failedRequests}`);
  console.log(`Success Rate: ${((loadTestResults.performance.successfulRequests / loadTestResults.performance.totalRequests) * 100).toFixed(2)}%`);
  console.log(`Average Response Time: ${loadTestResults.performance.avgResponseTime.toFixed(2)}ms`);
  console.log(`Max Response Time: ${loadTestResults.performance.maxResponseTime}ms`);
  console.log(`Min Response Time: ${loadTestResults.performance.minResponseTime}ms`);
  console.log(`Requests Per Second: ${loadTestResults.performance.requestsPerSecond.toFixed(2)}`);
  
  console.log(`\n🎯 SCENARIO RESULTS:`);
  Object.entries(loadTestResults.scenarios).forEach(([scenario, results]) => {
    const successRate = results.total > 0 ? ((results.success / results.total) * 100).toFixed(2) : 0;
    console.log(`${scenario}: ${results.success}/${results.total} (${successRate}%)`);
  });
  
  if (loadTestResults.warnings.length > 0) {
    console.log(`\n⚠️ WARNINGS (${loadTestResults.warnings.length}):`);
    const uniqueWarnings = [...new Set(loadTestResults.warnings)];
    uniqueWarnings.slice(0, 10).forEach((warning, index) => {
      console.log(`${index + 1}. ${warning}`);
    });
    if (uniqueWarnings.length > 10) {
      console.log(`... and ${uniqueWarnings.length - 10} more warnings`);
    }
  }
  
  if (loadTestResults.errors.length > 0) {
    console.log(`\n❌ ERRORS (${loadTestResults.errors.length}):`);
    const uniqueErrors = [...new Set(loadTestResults.errors.map(e => e.error))];
    uniqueErrors.slice(0, 10).forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
    if (uniqueErrors.length > 10) {
      console.log(`... and ${uniqueErrors.length - 10} more errors`);
    }
  }
  
  console.log('\n🎯 PERFORMANCE ASSESSMENT:');
  const avgResponseTime = loadTestResults.performance.avgResponseTime;
  const successRate = (loadTestResults.performance.successfulRequests / loadTestResults.performance.totalRequests) * 100;
  
  if (avgResponseTime < 500 && successRate >= 99) {
    console.log('🟢 EXCELLENT: Your app handles load exceptionally well!');
  } else if (avgResponseTime < 1000 && successRate >= 95) {
    console.log('🟡 GOOD: Your app performs well under load with minor optimization opportunities.');
  } else if (avgResponseTime < 2000 && successRate >= 90) {
    console.log('🟠 FAIR: Your app handles load adequately but needs performance improvements.');
  } else {
    console.log('🔴 POOR: Your app struggles under load and needs significant optimization.');
  }
  
  console.log('\n💡 RECOMMENDATIONS:');
  if (avgResponseTime > 1000) {
    console.log('- Consider database query optimization');
    console.log('- Implement caching for frequently accessed data');
    console.log('- Add database indexes for common queries');
  }
  if (successRate < 95) {
    console.log('- Review error handling and retry mechanisms');
    console.log('- Check for resource constraints (memory, CPU)');
    console.log('- Consider implementing rate limiting');
  }
  if (loadTestResults.performance.requestsPerSecond < 10) {
    console.log('- Consider horizontal scaling options');
    console.log('- Optimize API endpoints for better throughput');
  }
  
  console.log('\n═'.repeat(80));
};

// Main load test execution
const runLoadTest = async () => {
  console.log('⚡ STARTING MATCHIFY.PRO LOAD TEST SIMULATION');
  console.log('═'.repeat(80));
  console.log(`Configuration:`);
  console.log(`- Simultaneous Tournaments: ${LOAD_TEST_CONFIG.SIMULTANEOUS_TOURNAMENTS}`);
  console.log(`- Users Per Tournament: ${LOAD_TEST_CONFIG.USERS_PER_TOURNAMENT}`);
  console.log(`- Concurrent Registrations: ${LOAD_TEST_CONFIG.CONCURRENT_REGISTRATIONS}`);
  console.log(`- Admin Actions Per Minute: ${LOAD_TEST_CONFIG.ADMIN_ACTIONS_PER_MINUTE}`);
  console.log(`- Test Duration: ${LOAD_TEST_CONFIG.TEST_DURATION_MINUTES} minutes`);
  console.log('═'.repeat(80));
  
  const overallStartTime = Date.now();
  
  try {
    // Phase 1: User registration wave
    const users = await simulateUserRegistrationWave();
    
    // Phase 2: Simultaneous tournament creation
    const tournaments = await simulateSimultaneousTournamentCreation(users);
    
    // Phase 3: Concurrent registrations
    await simulateConcurrentRegistrations(users, tournaments);
    
    // Phase 4: Admin workload simulation
    await simulateAdminWorkload(users, tournaments);
    
    // Phase 5: Database stress test
    await simulateDatabaseStress();
    
    // Phase 6: Cleanup
    await cleanupLoadTestData();
    
  } catch (error) {
    console.error('💥 Load test failed with error:', error);
    logLoadTest('Overall Load Test', 'FAILURE', error.message);
  } finally {
    await prisma.$disconnect();
  }
  
  const overallEndTime = Date.now();
  const totalTestTime = overallEndTime - overallStartTime;
  
  console.log(`\n⏱️ Total load test time: ${(totalTestTime / 1000).toFixed(2)} seconds`);
  
  generateLoadTestReport();
};

// Export for use in other scripts
export {
  runLoadTest,
  loadTestResults,
  LOAD_TEST_CONFIG,
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runLoadTest().catch(console.error);
}