/**
 * Quick test for Day 44 features
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

async function testDay44Features() {
  console.log('🚀 Testing Day 44 Features\n');

  // Test 1: Quick status endpoint
  console.log('1️⃣ Testing quick status endpoint...');
  try {
    const response = await fetch(`${BASE_URL}/matches/12bd0602-8437-444f-969c-185992e38e46/status`);
    const data = await response.json();
    console.log('✅ Status endpoint:', response.status);
    console.log('   Match status:', data.status);
    console.log('   Duration:', data.duration, 'minutes');
    console.log('   Last updated:', data.lastUpdated);
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 2: Enhanced filtering - city
  console.log('\n2️⃣ Testing city filter...');
  try {
    const response = await fetch(`${BASE_URL}/matches/live?city=Test City`);
    const data = await response.json();
    console.log('✅ City filter:', response.status);
    console.log('   Found matches:', data.count);
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 3: Enhanced filtering - state
  console.log('\n3️⃣ Testing state filter...');
  try {
    const response = await fetch(`${BASE_URL}/matches/live?state=Test State`);
    const data = await response.json();
    console.log('✅ State filter:', response.status);
    console.log('   Found matches:', data.count);
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 4: Enhanced filtering - format
  console.log('\n4️⃣ Testing format filter...');
  try {
    const response = await fetch(`${BASE_URL}/matches/live?format=SINGLES`);
    const data = await response.json();
    console.log('✅ Format filter:', response.status);
    console.log('   Found matches:', data.count);
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 5: Combined filters
  console.log('\n5️⃣ Testing combined filters...');
  try {
    const response = await fetch(`${BASE_URL}/matches/live?city=Test City&format=SINGLES`);
    const data = await response.json();
    console.log('✅ Combined filters:', response.status);
    console.log('   Found matches:', data.count);
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 6: Access control utilities
  console.log('\n6️⃣ Testing access control utilities...');
  try {
    const { checkPrivateTournamentAccess, isMatchPublic } = await import('./src/utils/accessControl.js');
    
    const publicTournament = { privacy: 'public', organizerId: 'org-123' };
    const privateTournament = { privacy: 'private', organizerId: 'org-123' };
    const match = { player1Id: 'player-1', player2Id: 'player-2' };

    console.log('✅ Public tournament (anonymous):', checkPrivateTournamentAccess(publicTournament, match, null));
    console.log('✅ Private tournament (organizer):', checkPrivateTournamentAccess(privateTournament, match, 'org-123'));
    console.log('✅ Private tournament (participant):', checkPrivateTournamentAccess(privateTournament, match, 'player-1'));
    console.log('✅ Private tournament (unauthorized):', checkPrivateTournamentAccess(privateTournament, match, 'random'));
    console.log('✅ isMatchPublic:', isMatchPublic(publicTournament));
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  console.log('\n✅ Day 44 testing complete!');
}

testDay44Features().catch(console.error);
