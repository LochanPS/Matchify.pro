#!/usr/bin/env node

/**
 * MATCHIFY.PRO COMPREHENSIVE UNIT TEST SUITE
 * 
 * This script performs detailed unit tests for:
 * 1. Authentication system
 * 2. Tournament management
 * 3. Registration system
 * 4. Payment processing
 * 5. Admin functions
 * 6. Database operations
 * 7. API endpoints
 * 8. Business logic validation
 */

import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';

// Test configuration
const UNIT_TEST_CONFIG = {
  API_TIMEOUT: 5000,
  TEST_USER_EMAIL: 'unittest@matchify.test',
  TEST_ADMIN_EMAIL: 'admin@matchify.test',
  TEST_ORGANIZER_EMAIL: 'organizer@matchify.test',
};

// Test results
const unitTestResults = {
  suites: {},
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  skippedTests: 0,
  errors: [],
};

// Test utilities
const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const assertEqual = (actual, expected, message) => {
  if (actual !== expected) {
    throw new Error(`${message}: Expected ${expected}, got ${actual}`);
  }
};

const assertNotNull = (value, message) => {
  if (value === null || value === undefined) {
    throw new Error(`${message}: Value is null or undefined`);
  }
};

const logUnitTest = (suiteName, testName, status, details = '') => {
  if (!unitTestResults.suites[suiteName]) {
    unitTestResults.suites[suiteName] = { passed: 0, failed: 0, skipped: 0, tests: [] };
  }
  
  unitTestResults.totalTests++;
  unitTestResults.suites[suiteName].tests.push({ name: testName, status, details });
  
  if (status === 'PASS') {
    unitTestResults.passedTests++;
    unitTestResults.suites[suiteName].passed++;
    console.log(`  ✅ ${testName}: PASSED ${details}`);
  } else if (status === 'FAIL') {
    unitTestResults.failedTests++;
    unitTestResults.suites[suiteName].failed++;
    unitTestResults.errors.push({ suite: suiteName, test: testName, error: details });
    console.log(`  ❌ ${testName}: FAILED ${details}`);
  } else if (status === 'SKIP') {
    unitTestResults.skippedTests++;
    unitTestResults.suites[suiteName].skipped++;
    console.log(`  ⏭️ ${testName}: SKIPPED ${details}`);
  }
};

// API helper
const apiCall = async (method, endpoint, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      timeout: UNIT_TEST_CONFIG.API_TIMEOUT,
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
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status || 500 
    };
  }
};

// Test suites
const testAuthenticationSystem = async () => {
  console.log('\n🔐 Testing Authentication System...');
  const suiteName = 'Authentication';
  
  // Test 1: User Registration
  try {
    const userData = {
      name: 'Unit Test User',
      email: UNIT_TEST_CONFIG.TEST_USER_EMAIL,
      phone: '9876543210',
      password: 'TestPassword123!',
      city: 'Mumbai',
      state: 'Maharashtra',
    };
    
    const result = await apiCall('POST', '/auth/register', userData);
    assert(result.success, 'Registration should succeed');
    assert(result.data.token, 'Should return JWT token');
    assert(result.data.user.email === userData.email, 'Should return correct user email');
    
    logUnitTest(suiteName, 'User Registration', 'PASS', 'User registered successfully');
    return result.data.token;
  } catch (error) {
    logUnitTest(suiteName, 'User Registration', 'FAIL', error.message);
    return null;
  }
};

const testUserLogin = async () => {
  const suiteName = 'Authentication';
  
  // Test 2: User Login
  try {
    const loginData = {
      email: UNIT_TEST_CONFIG.TEST_USER_EMAIL,
      password: 'TestPassword123!',
    };
    
    const result = await apiCall('POST', '/auth/login', loginData);
    assert(result.success, 'Login should succeed');
    assert(result.data.token, 'Should return JWT token');
    assert(result.data.user.email === loginData.email, 'Should return correct user');
    
    logUnitTest(suiteName, 'User Login', 'PASS', 'User logged in successfully');
    return result.data.token;
  } catch (error) {
    logUnitTest(suiteName, 'User Login', 'FAIL', error.message);
    return null;
  }
};

const testInvalidLogin = async () => {
  const suiteName = 'Authentication';
  
  // Test 3: Invalid Login
  try {
    const invalidLoginData = {
      email: UNIT_TEST_CONFIG.TEST_USER_EMAIL,
      password: 'WrongPassword',
    };
    
    const result = await apiCall('POST', '/auth/login', invalidLoginData);
    assert(!result.success, 'Invalid login should fail');
    assert(result.status === 401, 'Should return 401 status');
    
    logUnitTest(suiteName, 'Invalid Login', 'PASS', 'Invalid login correctly rejected');
  } catch (error) {
    logUnitTest(suiteName, 'Invalid Login', 'FAIL', error.message);
  }
};

const testTournamentManagement = async (userToken) => {
  console.log('\n🏆 Testing Tournament Management...');
  const suiteName = 'Tournament Management';
  
  if (!userToken) {
    logUnitTest(suiteName, 'All Tournament Tests', 'SKIP', 'No user token available');
    return null;
  }
  
  // Test 1: Create Tournament
  try {
    const tournamentData = {
      name: 'Unit Test Tournament',
      description: 'This is a unit test tournament',
      venue: 'Test Venue',
      city: 'Mumbai',
      state: 'Maharashtra',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      registrationOpenDate: new Date().toISOString().slice(0, 16),
      registrationCloseDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      maxParticipants: 64,
      entryFee: 500,
      categories: [
        {
          name: 'Men\'s Singles',
          format: 'singles',
          gender: 'male',
          ageGroup: 'open',
          entryFee: 300,
          maxParticipants: 32,
        },
      ],
    };
    
    const result = await apiCall('POST', '/tournaments', tournamentData, userToken);
    assert(result.success, 'Tournament creation should succeed');
    assert(result.data.tournament.name === tournamentData.name, 'Should return correct tournament name');
    assertNotNull(result.data.tournament.id, 'Should return tournament ID');
    
    logUnitTest(suiteName, 'Create Tournament', 'PASS', 'Tournament created successfully');
    return result.data.tournament;
  } catch (error) {
    logUnitTest(suiteName, 'Create Tournament', 'FAIL', error.message);
    return null;
  }
};

const testTournamentRetrieval = async (userToken, tournament) => {
  const suiteName = 'Tournament Management';
  
  if (!userToken || !tournament) {
    logUnitTest(suiteName, 'Tournament Retrieval', 'SKIP', 'Missing dependencies');
    return;
  }
  
  // Test 2: Get Tournament by ID
  try {
    const result = await apiCall('GET', `/tournaments/${tournament.id}`, null, userToken);
    assert(result.success, 'Tournament retrieval should succeed');
    assert(result.data.tournament.id === tournament.id, 'Should return correct tournament');
    assert(result.data.tournament.categories.length > 0, 'Should include categories');
    
    logUnitTest(suiteName, 'Get Tournament by ID', 'PASS', 'Tournament retrieved successfully');
  } catch (error) {
    logUnitTest(suiteName, 'Get Tournament by ID', 'FAIL', error.message);
  }
  
  // Test 3: List All Tournaments
  try {
    const result = await apiCall('GET', '/tournaments', null, userToken);
    assert(result.success, 'Tournament listing should succeed');
    assert(Array.isArray(result.data.tournaments), 'Should return array of tournaments');
    assert(result.data.tournaments.length > 0, 'Should return at least one tournament');
    
    logUnitTest(suiteName, 'List All Tournaments', 'PASS', `Found ${result.data.tournaments.length} tournaments`);
  } catch (error) {
    logUnitTest(suiteName, 'List All Tournaments', 'FAIL', error.message);
  }
};

const testRegistrationSystem = async (userToken, tournament) => {
  console.log('\n📝 Testing Registration System...');
  const suiteName = 'Registration System';
  
  if (!userToken || !tournament) {
    logUnitTest(suiteName, 'All Registration Tests', 'SKIP', 'Missing dependencies');
    return null;
  }
  
  // Test 1: Tournament Registration
  try {
    const registrationData = {
      tournamentId: tournament.id,
      categoryIds: [tournament.categories[0].id],
      partnerEmails: {},
    };
    
    const result = await apiCall('POST', '/registrations', registrationData, userToken);
    assert(result.success, 'Registration should succeed');
    assert(result.data.registrations.length > 0, 'Should return registration data');
    assert(result.data.totalAmount > 0, 'Should calculate total amount');
    
    logUnitTest(suiteName, 'Tournament Registration', 'PASS', `Registered for ₹${result.data.totalAmount}`);
    return result.data.registrations[0];
  } catch (error) {
    logUnitTest(suiteName, 'Tournament Registration', 'FAIL', error.message);
    return null;
  }
};

const testRegistrationRetrieval = async (userToken) => {
  const suiteName = 'Registration System';
  
  if (!userToken) {
    logUnitTest(suiteName, 'Registration Retrieval', 'SKIP', 'No user token');
    return;
  }
  
  // Test 2: Get My Registrations
  try {
    const result = await apiCall('GET', '/registrations/my', null, userToken);
    assert(result.success, 'Registration retrieval should succeed');
    assert(Array.isArray(result.data.registrations), 'Should return array of registrations');
    
    logUnitTest(suiteName, 'Get My Registrations', 'PASS', `Found ${result.data.registrations.length} registrations`);
  } catch (error) {
    logUnitTest(suiteName, 'Get My Registrations', 'FAIL', error.message);
  }
};

const testDuplicateRegistration = async (userToken, tournament) => {
  const suiteName = 'Registration System';
  
  if (!userToken || !tournament) {
    logUnitTest(suiteName, 'Duplicate Registration Prevention', 'SKIP', 'Missing dependencies');
    return;
  }
  
  // Test 3: Prevent Duplicate Registration
  try {
    const registrationData = {
      tournamentId: tournament.id,
      categoryIds: [tournament.categories[0].id],
      partnerEmails: {},
    };
    
    const result = await apiCall('POST', '/registrations', registrationData, userToken);
    assert(!result.success, 'Duplicate registration should fail');
    assert(result.status === 400, 'Should return 400 status');
    
    logUnitTest(suiteName, 'Duplicate Registration Prevention', 'PASS', 'Duplicate registration correctly prevented');
  } catch (error) {
    logUnitTest(suiteName, 'Duplicate Registration Prevention', 'FAIL', error.message);
  }
};

const testPaymentSystem = async (userToken) => {
  console.log('\n💰 Testing Payment System...');
  const suiteName = 'Payment System';
  
  if (!userToken) {
    logUnitTest(suiteName, 'All Payment Tests', 'SKIP', 'No user token');
    return;
  }
  
  // Test 1: Get Payment Verifications (Admin endpoint)
  try {
    const result = await apiCall('GET', '/admin/payment-verifications', null, userToken);
    // This might fail if user is not admin, which is expected
    if (result.success) {
      assert(Array.isArray(result.data.data), 'Should return array of verifications');
      logUnitTest(suiteName, 'Get Payment Verifications', 'PASS', `Found ${result.data.data.length} verifications`);
    } else if (result.status === 403) {
      logUnitTest(suiteName, 'Get Payment Verifications', 'PASS', 'Correctly denied non-admin access');
    } else {
      throw new Error(`Unexpected error: ${result.error}`);
    }
  } catch (error) {
    logUnitTest(suiteName, 'Get Payment Verifications', 'FAIL', error.message);
  }
  
  // Test 2: Get Payment Stats (Admin endpoint)
  try {
    const result = await apiCall('GET', '/admin/payment-stats', null, userToken);
    if (result.success) {
      assertNotNull(result.data, 'Should return payment stats');
      logUnitTest(suiteName, 'Get Payment Stats', 'PASS', 'Payment stats retrieved');
    } else if (result.status === 403) {
      logUnitTest(suiteName, 'Get Payment Stats', 'PASS', 'Correctly denied non-admin access');
    } else {
      throw new Error(`Unexpected error: ${result.error}`);
    }
  } catch (error) {
    logUnitTest(suiteName, 'Get Payment Stats', 'FAIL', error.message);
  }
};

const testNotificationSystem = async (userToken) => {
  console.log('\n🔔 Testing Notification System...');
  const suiteName = 'Notification System';
  
  if (!userToken) {
    logUnitTest(suiteName, 'All Notification Tests', 'SKIP', 'No user token');
    return;
  }
  
  // Test 1: Get Notifications
  try {
    const result = await apiCall('GET', '/notifications', null, userToken);
    assert(result.success, 'Notification retrieval should succeed');
    assert(Array.isArray(result.data.notifications), 'Should return array of notifications');
    
    logUnitTest(suiteName, 'Get Notifications', 'PASS', `Found ${result.data.notifications.length} notifications`);
  } catch (error) {
    logUnitTest(suiteName, 'Get Notifications', 'FAIL', error.message);
  }
  
  // Test 2: Get Unread Count
  try {
    const result = await apiCall('GET', '/notifications/unread-count', null, userToken);
    assert(result.success, 'Unread count retrieval should succeed');
    assert(typeof result.data.count === 'number', 'Should return numeric count');
    
    logUnitTest(suiteName, 'Get Unread Count', 'PASS', `Unread count: ${result.data.count}`);
  } catch (error) {
    logUnitTest(suiteName, 'Get Unread Count', 'FAIL', error.message);
  }
};

const testDatabaseIntegrity = async () => {
  console.log('\n🗄️ Testing Database Integrity...');
  const suiteName = 'Database Integrity';
  
  // Test 1: Database Connection
  try {
    await prisma.$connect();
    logUnitTest(suiteName, 'Database Connection', 'PASS', 'Connected successfully');
  } catch (error) {
    logUnitTest(suiteName, 'Database Connection', 'FAIL', error.message);
    return;
  }
  
  // Test 2: User Model
  try {
    const userCount = await prisma.user.count();
    assert(typeof userCount === 'number', 'User count should be a number');
    logUnitTest(suiteName, 'User Model Query', 'PASS', `Found ${userCount} users`);
  } catch (error) {
    logUnitTest(suiteName, 'User Model Query', 'FAIL', error.message);
  }
  
  // Test 3: Tournament Model
  try {
    const tournamentCount = await prisma.tournament.count();
    assert(typeof tournamentCount === 'number', 'Tournament count should be a number');
    logUnitTest(suiteName, 'Tournament Model Query', 'PASS', `Found ${tournamentCount} tournaments`);
  } catch (error) {
    logUnitTest(suiteName, 'Tournament Model Query', 'FAIL', error.message);
  }
  
  // Test 4: Registration Model
  try {
    const registrationCount = await prisma.registration.count();
    assert(typeof registrationCount === 'number', 'Registration count should be a number');
    logUnitTest(suiteName, 'Registration Model Query', 'PASS', `Found ${registrationCount} registrations`);
  } catch (error) {
    logUnitTest(suiteName, 'Registration Model Query', 'FAIL', error.message);
  }
  
  // Test 5: Complex Join Query
  try {
    const complexQuery = await prisma.registration.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        tournament: {
          select: { id: true, name: true }
        },
        category: {
          select: { id: true, name: true }
        }
      },
      take: 5
    });
    
    assert(Array.isArray(complexQuery), 'Complex query should return array');
    logUnitTest(suiteName, 'Complex Join Query', 'PASS', `Retrieved ${complexQuery.length} records with joins`);
  } catch (error) {
    logUnitTest(suiteName, 'Complex Join Query', 'FAIL', error.message);
  }
};

const testInputValidation = async () => {
  console.log('\n🛡️ Testing Input Validation...');
  const suiteName = 'Input Validation';
  
  // Test 1: Invalid Email Registration
  try {
    const invalidUserData = {
      name: 'Test User',
      email: 'invalid-email',
      phone: '9876543210',
      password: 'TestPassword123!',
      city: 'Mumbai',
      state: 'Maharashtra',
    };
    
    const result = await apiCall('POST', '/auth/register', invalidUserData);
    assert(!result.success, 'Invalid email should be rejected');
    logUnitTest(suiteName, 'Invalid Email Validation', 'PASS', 'Invalid email correctly rejected');
  } catch (error) {
    logUnitTest(suiteName, 'Invalid Email Validation', 'FAIL', error.message);
  }
  
  // Test 2: Weak Password Registration
  try {
    const weakPasswordData = {
      name: 'Test User',
      email: 'test@example.com',
      phone: '9876543210',
      password: '123',
      city: 'Mumbai',
      state: 'Maharashtra',
    };
    
    const result = await apiCall('POST', '/auth/register', weakPasswordData);
    assert(!result.success, 'Weak password should be rejected');
    logUnitTest(suiteName, 'Weak Password Validation', 'PASS', 'Weak password correctly rejected');
  } catch (error) {
    logUnitTest(suiteName, 'Weak Password Validation', 'FAIL', error.message);
  }
  
  // Test 3: Missing Required Fields
  try {
    const incompleteData = {
      name: 'Test User',
      // Missing email, phone, password
    };
    
    const result = await apiCall('POST', '/auth/register', incompleteData);
    assert(!result.success, 'Incomplete data should be rejected');
    logUnitTest(suiteName, 'Required Fields Validation', 'PASS', 'Missing fields correctly rejected');
  } catch (error) {
    logUnitTest(suiteName, 'Required Fields Validation', 'FAIL', error.message);
  }
};

const cleanupUnitTestData = async () => {
  console.log('\n🧹 Cleaning up unit test data...');
  const suiteName = 'Cleanup';
  
  try {
    // Delete test registrations
    await prisma.registration.deleteMany({
      where: {
        user: {
          email: {
            contains: '@matchify.test'
          }
        }
      }
    });
    
    // Delete test tournaments
    await prisma.tournament.deleteMany({
      where: {
        name: {
          contains: 'Unit Test Tournament'
        }
      }
    });
    
    // Delete test users
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: '@matchify.test'
        }
      }
    });
    
    logUnitTest(suiteName, 'Test Data Cleanup', 'PASS', 'All unit test data removed');
  } catch (error) {
    logUnitTest(suiteName, 'Test Data Cleanup', 'FAIL', error.message);
  }
};

const generateUnitTestReport = () => {
  console.log('\n📊 UNIT TEST REPORT');
  console.log('═'.repeat(80));
  
  console.log(`\n📈 OVERALL RESULTS:`);
  console.log(`Total Tests: ${unitTestResults.totalTests}`);
  console.log(`Passed: ${unitTestResults.passedTests} (${((unitTestResults.passedTests / unitTestResults.totalTests) * 100).toFixed(2)}%)`);
  console.log(`Failed: ${unitTestResults.failedTests} (${((unitTestResults.failedTests / unitTestResults.totalTests) * 100).toFixed(2)}%)`);
  console.log(`Skipped: ${unitTestResults.skippedTests} (${((unitTestResults.skippedTests / unitTestResults.totalTests) * 100).toFixed(2)}%)`);
  
  console.log(`\n📋 TEST SUITES:`);
  Object.entries(unitTestResults.suites).forEach(([suiteName, suite]) => {
    const total = suite.passed + suite.failed + suite.skipped;
    const passRate = total > 0 ? ((suite.passed / total) * 100).toFixed(2) : 0;
    console.log(`${suiteName}: ${suite.passed}/${total} passed (${passRate}%)`);
  });
  
  if (unitTestResults.errors.length > 0) {
    console.log(`\n❌ FAILED TESTS (${unitTestResults.errors.length}):`);
    unitTestResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.suite} - ${error.test}: ${error.error}`);
    });
  }
  
  console.log('\n🎯 QUALITY ASSESSMENT:');
  const passRate = (unitTestResults.passedTests / unitTestResults.totalTests) * 100;
  if (passRate >= 95) {
    console.log('🟢 EXCELLENT: Your app has excellent test coverage and quality!');
  } else if (passRate >= 85) {
    console.log('🟡 GOOD: Your app has good quality with minor issues to address.');
  } else if (passRate >= 70) {
    console.log('🟠 FAIR: Your app needs improvement in several areas.');
  } else {
    console.log('🔴 POOR: Your app has significant issues that need immediate attention.');
  }
  
  console.log('\n═'.repeat(80));
};

// Main unit test execution
const runUnitTests = async () => {
  console.log('🧪 STARTING MATCHIFY.PRO COMPREHENSIVE UNIT TESTS');
  console.log('═'.repeat(80));
  
  const overallStartTime = Date.now();
  
  try {
    // Phase 1: Database integrity tests
    await testDatabaseIntegrity();
    
    // Phase 2: Input validation tests
    await testInputValidation();
    
    // Phase 3: Authentication system tests
    const userToken = await testAuthenticationSystem();
    await testUserLogin();
    await testInvalidLogin();
    
    // Phase 4: Tournament management tests
    const tournament = await testTournamentManagement(userToken);
    await testTournamentRetrieval(userToken, tournament);
    
    // Phase 5: Registration system tests
    const registration = await testRegistrationSystem(userToken, tournament);
    await testRegistrationRetrieval(userToken);
    await testDuplicateRegistration(userToken, tournament);
    
    // Phase 6: Payment system tests
    await testPaymentSystem(userToken);
    
    // Phase 7: Notification system tests
    await testNotificationSystem(userToken);
    
    // Phase 8: Cleanup
    await cleanupUnitTestData();
    
  } catch (error) {
    console.error('💥 Unit tests failed with error:', error);
    logUnitTest('Overall', 'Unit Test Suite', 'FAIL', error.message);
  } finally {
    await prisma.$disconnect();
  }
  
  const overallEndTime = Date.now();
  const totalTestTime = overallEndTime - overallStartTime;
  
  console.log(`\n⏱️ Total test execution time: ${(totalTestTime / 1000).toFixed(2)} seconds`);
  
  generateUnitTestReport();
};

// Export for use in other scripts
export {
  runUnitTests,
  unitTestResults,
  UNIT_TEST_CONFIG,
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runUnitTests().catch(console.error);
}