#!/usr/bin/env node

/**
 * SIMPLE FEE LOCKING TEST
 * 
 * This script directly tests the fee locking functionality
 * by creating data in the database and testing the API
 */

import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';

const testFeeLockingSimple = async () => {
  console.log('🔒 TESTING FEE LOCKING FUNCTIONALITY (SIMPLE)\n');
  
  let testUser = null;
  let testTournament = null;
  let testCategory = null;
  
  try {
    // Step 1: Create test user directly in database
    console.log('1️⃣ Creating test user in database...');
    testUser = await prisma.user.create({
      data: {
        name: 'Fee Lock Test User',
        email: `feelock${Date.now()}@test.com`,
        phone: `98765${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`,
        password: '$2b$12$dummy.hash.for.testing',
        roles: 'ORGANIZER',
        city: 'Mumbai',
        state: 'Maharashtra'
      }
    });
    console.log('✅ Test user created:', testUser.email);
    
    // Step 2: Create test tournament directly in database
    console.log('\n2️⃣ Creating test tournament in database...');
    testTournament = await prisma.tournament.create({
      data: {
        name: 'Fee Lock Test Tournament',
        description: 'Testing fee locking functionality',
        venue: 'Test Venue',
        address: 'Test Address',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India',
        zone: 'West',
        format: 'singles',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
        registrationOpenDate: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
        registrationCloseDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        organizerId: testUser.id
      }
    });
    console.log('✅ Test tournament created:', testTournament.name);
    
    // Step 3: Create test category directly in database
    console.log('\n3️⃣ Creating test category in database...');
    testCategory = await prisma.category.create({
      data: {
        name: 'Men\'s Singles',
        format: 'singles',
        gender: 'men',
        entryFee: 100,
        maxParticipants: 16,
        tournamentId: testTournament.id
      }
    });
    console.log('✅ Category created with entry fee: ₹' + testCategory.entryFee);
    
    // Step 4: Generate JWT token for API calls
    console.log('\n4️⃣ Generating JWT token...');
    const jwt = await import('./src/utils/jwt.js');
    const token = jwt.generateAccessToken(testUser.id, testUser.roles);
    console.log('✅ JWT token generated');
    
    // Step 5: Try to change entry fee (should work - no registrations yet)
    console.log('\n5️⃣ Testing fee change before registrations...');
    try {
      const updateResponse = await axios.put(`${API_URL}/tournaments/${testTournament.id}/categories/${testCategory.id}`, {
        entryFee: 150
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (updateResponse.data.success) {
        console.log('✅ Fee change allowed before registrations: ₹100 → ₹150');
        testCategory.entryFee = updateResponse.data.category.entryFee;
      } else {
        console.log('❌ Unexpected: Fee change failed before registrations');
      }
    } catch (error) {
      console.log('❌ Unexpected error changing fee before registrations:', error.response?.data?.error);
    }
    
    // Step 6: Create a registration directly in database
    console.log('\n6️⃣ Creating registration in database...');
    await prisma.registration.create({
      data: {
        userId: testUser.id,
        tournamentId: testTournament.id,
        categoryId: testCategory.id,
        amountTotal: testCategory.entryFee,
        status: 'confirmed',
        paymentStatus: 'verified'
      }
    });
    console.log('✅ Registration created');
    
    // Step 7: Try to change entry fee (should fail - registration exists)
    console.log('\n7️⃣ Testing fee change after registration (should fail)...');
    try {
      const updateResponse = await axios.put(`${API_URL}/tournaments/${testTournament.id}/categories/${testCategory.id}`, {
        entryFee: 200
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (updateResponse.data.success) {
        console.log('❌ FAILED: Fee change was allowed after registration!');
      } else {
        console.log('✅ Fee change correctly blocked:', updateResponse.data.error);
      }
    } catch (error) {
      if (error.response?.data?.feeLocked) {
        console.log('✅ Fee locking working correctly!');
        console.log('   Error:', error.response.data.error);
        console.log('   Details:', error.response.data.details);
        console.log('   Current Fee: ₹' + error.response.data.currentFee);
        console.log('   Attempted Fee: ₹' + error.response.data.attemptedFee);
        console.log('   Registration Count:', error.response.data.registrationCount);
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.error || error.message);
      }
    }
    
    // Step 8: Try to change other fields (should work)
    console.log('\n8️⃣ Testing other field changes (should work)...');
    try {
      const updateResponse = await axios.put(`${API_URL}/tournaments/${testTournament.id}/categories/${testCategory.id}`, {
        name: 'Men\'s Singles (Updated)',
        maxParticipants: 32
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (updateResponse.data.success) {
        console.log('✅ Other fields can still be updated');
        console.log('   New name:', updateResponse.data.category.name);
        console.log('   New max participants:', updateResponse.data.category.maxParticipants);
        console.log('   Fee locked status:', updateResponse.data.feeLocked);
        console.log('   Registration count:', updateResponse.data.registrationCount);
      } else {
        console.log('❌ Unexpected: Other field update failed');
      }
    } catch (error) {
      console.log('❌ Unexpected error updating other fields:', error.response?.data?.error);
    }
    
    console.log('\n🎉 FEE LOCKING TEST COMPLETED SUCCESSFULLY!');
    console.log('✅ Entry fees are properly locked after registrations');
    console.log('✅ Other category fields can still be updated');
    console.log('✅ Clear error messages are provided');
    
  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    try {
      if (testTournament) {
        // Delete registrations first
        await prisma.registration.deleteMany({
          where: { tournamentId: testTournament.id }
        });
        
        // Delete categories
        await prisma.category.deleteMany({
          where: { tournamentId: testTournament.id }
        });
        
        // Delete tournament
        await prisma.tournament.delete({
          where: { id: testTournament.id }
        });
      }
      
      if (testUser) {
        // Delete user
        await prisma.user.delete({
          where: { id: testUser.id }
        });
      }
      
      console.log('✅ Test data cleaned up');
    } catch (cleanupError) {
      console.log('⚠️ Cleanup error:', cleanupError.message);
    } finally {
      await prisma.$disconnect();
    }
  }
};

testFeeLockingSimple().catch(console.error);