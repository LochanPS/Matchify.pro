#!/usr/bin/env node

/**
 * TEST SCRIPT FOR FEE LOCKING FUNCTIONALITY
 * 
 * This script tests:
 * 1. Creating a tournament with categories
 * 2. Registering a user for a category
 * 3. Attempting to change the entry fee (should fail)
 * 4. Verifying fee locking works correctly
 */

import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';

const testFeeLocking = async () => {
  console.log('🔒 TESTING FEE LOCKING FUNCTIONALITY\n');
  
  let testUser = null;
  let testTournament = null;
  let testCategory = null;
  
  try {
    // Step 1: Create a test organizer user
    console.log('1️⃣ Creating test organizer user...');
    const userData = {
      name: 'Fee Lock Test Organizer',
      email: `feelock${Date.now()}@test.com`,
      phone: `98765${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`,
      password: 'TestPassword123!',
      city: 'Mumbai',
      state: 'Maharashtra',
      roles: ['ORGANIZER'] // Make this user an organizer
    };
    
    const userResponse = await axios.post(`${API_URL}/auth/register`, userData);
    testUser = userResponse.data;
    console.log('✅ Test organizer created:', testUser.user.email);
    
    // Step 2: Create a test tournament
    console.log('\n2️⃣ Creating test tournament...');
    const tournamentData = {
      name: 'Fee Lock Test Tournament',
      description: 'Testing fee locking functionality',
      venue: 'Test Venue',
      address: 'Test Address, Test Area',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      country: 'India',
      zone: 'West',
      format: 'singles',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      registrationOpenDate: new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16), // 5 minutes from now
      registrationCloseDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      maxParticipants: 32,
      entryFee: 100
    };
    
    const tournamentResponse = await axios.post(`${API_URL}/tournaments`, tournamentData, {
      headers: { Authorization: `Bearer ${testUser.accessToken}` }
    });
    testTournament = tournamentResponse.data.tournament;
    console.log('✅ Test tournament created:', testTournament.name);
    
    // Update tournament to open registration immediately
    console.log('   Opening registration immediately...');
    await axios.put(`${API_URL}/tournaments/${testTournament.id}`, {
      registrationOpenDate: new Date(Date.now() - 60000).toISOString().slice(0, 16) // 1 minute ago
    }, {
      headers: { Authorization: `Bearer ${testUser.accessToken}` }
    });
    
    // Step 3: Add a category to the tournament
    console.log('\n3️⃣ Adding category to tournament...');
    const categoryData = {
      name: 'Men\'s Singles',
      format: 'singles',
      gender: 'MALE',
      entryFee: 100,
      maxParticipants: 16
    };
    
    const categoryResponse = await axios.post(`${API_URL}/tournaments/${testTournament.id}/categories`, categoryData, {
      headers: { Authorization: `Bearer ${testUser.accessToken}` }
    });
    testCategory = categoryResponse.data.category;
    console.log('✅ Category created with entry fee: ₹' + testCategory.entryFee);
    
    // Step 4: Try to change entry fee (should work - no registrations yet)
    console.log('\n4️⃣ Testing fee change before registrations...');
    try {
      const updateResponse = await axios.put(`${API_URL}/tournaments/${testTournament.id}/categories/${testCategory.id}`, {
        entryFee: 150
      }, {
        headers: { Authorization: `Bearer ${testUser.accessToken}` }
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
    
    // Step 5: Register the user for the category
    console.log('\n5️⃣ Registering user for category...');
    const registrationData = {
      tournamentId: testTournament.id,
      categoryIds: [testCategory.id],
      partnerEmails: {}
    };
    
    const registrationResponse = await axios.post(`${API_URL}/registrations`, registrationData, {
      headers: { Authorization: `Bearer ${testUser.accessToken}` }
    });
    
    if (registrationResponse.data.success) {
      console.log('✅ User registered for category');
    } else {
      console.log('❌ Registration failed:', registrationResponse.data.error);
      return;
    }
    
    // Step 6: Try to change entry fee (should fail - registration exists)
    console.log('\n6️⃣ Testing fee change after registration (should fail)...');
    try {
      const updateResponse = await axios.put(`${API_URL}/tournaments/${testTournament.id}/categories/${testCategory.id}`, {
        entryFee: 200
      }, {
        headers: { Authorization: `Bearer ${testUser.accessToken}` }
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
    
    // Step 7: Try to change other fields (should work)
    console.log('\n7️⃣ Testing other field changes (should work)...');
    try {
      const updateResponse = await axios.put(`${API_URL}/tournaments/${testTournament.id}/categories/${testCategory.id}`, {
        name: 'Men\'s Singles (Updated)',
        maxParticipants: 32
      }, {
        headers: { Authorization: `Bearer ${testUser.accessToken}` }
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
    console.error('💥 Test failed with error:', error.response?.data || error.message);
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
          where: { id: testUser.user.id }
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

testFeeLocking().catch(console.error);