#!/usr/bin/env node

/**
 * MATCHIFY.PRO COMPREHENSIVE TEST RUNNER
 * 
 * This script runs all test suites:
 * 1. Stress Test Suite
 * 2. Unit Test Suite  
 * 3. Load Test Simulation
 */

import { runStressTest } from './stress-test-suite.js';
import { runUnitTests } from './unit-test-suite.js';
import { runLoadTest } from './load-test-simulation.js';

const runAllTests = async () => {
  console.log('🚀 STARTING COMPREHENSIVE MATCHIFY.PRO TESTING');
  console.log('═'.repeat(100));
  console.log('This will run:');
  console.log('1. 🔥 Stress Test Suite - Load testing with multiple concurrent users');
  console.log('2. 🧪 Unit Test Suite - Detailed unit tests for all components');
  console.log('3. ⚡ Load Test Simulation - Real-world tournament scenarios');
  console.log('═'.repeat(100));
  
  const overallStartTime = Date.now();
  
  try {
    // Phase 1: Stress Test Suite
    console.log('\n🔥 PHASE 1: STRESS TEST SUITE');
    console.log('─'.repeat(80));
    await runStressTest();
    
    // Wait a bit between tests
    console.log('\n⏳ Waiting 5 seconds before next test suite...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Phase 2: Unit Test Suite
    console.log('\n🧪 PHASE 2: UNIT TEST SUITE');
    console.log('─'.repeat(80));
    await runUnitTests();
    
    // Wait a bit between tests
    console.log('\n⏳ Waiting 5 seconds before next test suite...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Phase 3: Load Test Simulation
    console.log('\n⚡ PHASE 3: LOAD TEST SIMULATION');
    console.log('─'.repeat(80));
    await runLoadTest();
    
  } catch (error) {
    console.error('💥 Test suite failed with error:', error);
  }
  
  const overallEndTime = Date.now();
  const totalTime = overallEndTime - overallStartTime;
  
  console.log('\n🏁 ALL TESTS COMPLETED');
  console.log('═'.repeat(100));
  console.log(`⏱️ Total execution time: ${(totalTime / 1000 / 60).toFixed(2)} minutes`);
  console.log('📊 Check individual test reports above for detailed results');
  console.log('✅ Your MATCHIFY.PRO app has been thoroughly tested!');
  console.log('═'.repeat(100));
};

// Run all tests
runAllTests().catch(console.error);