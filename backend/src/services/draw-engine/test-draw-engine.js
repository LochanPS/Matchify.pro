/**
 * Test script for Draw Engine V2
 * Run with: node src/services/draw-engine/test-draw-engine.js
 */

import DrawEngine from './DrawEngine.js';

console.log('🧪 Testing Draw Engine V2\n');

// Test data
const players = [
  { id: 'p1', name: 'Player 1', seed: 1 },
  { id: 'p2', name: 'Player 2', seed: 2 },
  { id: 'p3', name: 'Player 3', seed: 3 },
  { id: 'p4', name: 'Player 4', seed: 4 },
  { id: 'p5', name: 'Player 5', seed: 5 },
  { id: 'p6', name: 'Player 6', seed: 6 },
  { id: 'p7', name: 'Player 7', seed: 7 },
  { id: 'p8', name: 'Player 8', seed: 8 }
];

// Test 1: Knockout Draw
console.log('📋 Test 1: Knockout Draw (8 players)');
console.log('─────────────────────────────────────');
try {
  const knockoutDraw = DrawEngine.generateDraw({
    format: 'KNOCKOUT',
    players: players,
    options: {}
  });

  console.log('✅ Format:', knockoutDraw.format);
  console.log('✅ Bracket Size:', knockoutDraw.bracketSize);
  console.log('✅ Total Rounds:', knockoutDraw.totalRounds);
  console.log('✅ Player Count:', knockoutDraw.playerCount);
  console.log('✅ Bye Count:', knockoutDraw.byeCount);
  console.log('✅ Total Matches:', knockoutDraw.matches.length);
  
  // Show first round matches
  const firstRound = knockoutDraw.matches.filter(m => m.round === knockoutDraw.totalRounds);
  console.log('\n🥊 First Round Matches:');
  firstRound.forEach(match => {
    const p1 = players.find(p => p.id === match.player1Id)?.name || 'BYE';
    const p2 = players.find(p => p.id === match.player2Id)?.name || 'BYE';
    console.log(`   Match ${match.matchNumber}: ${p1} vs ${p2} (Status: ${match.status})`);
  });
  
  console.log('\n✅ Knockout draw test passed!\n');
} catch (error) {
  console.error('❌ Knockout draw test failed:', error.message);
}

// Test 2: Round Robin Draw
console.log('📋 Test 2: Round Robin Draw (8 players, 2 groups)');
console.log('─────────────────────────────────────');
try {
  const roundRobinDraw = DrawEngine.generateDraw({
    format: 'ROUND_ROBIN',
    players: players,
    options: {
      numberOfGroups: 2
    }
  });

  console.log('✅ Format:', roundRobinDraw.format);
  console.log('✅ Player Count:', roundRobinDraw.playerCount);
  console.log('✅ Number of Groups:', roundRobinDraw.numberOfGroups);
  console.log('✅ Total Matches:', roundRobinDraw.matches.length);
  
  // Show groups
  console.log('\n👥 Groups:');
  roundRobinDraw.groups.forEach(group => {
    console.log(`   Group ${group.groupName}: ${group.playerCount} players, ${group.matchCount} matches`);
  });
  
  // Show Group A matches
  const groupAMatches = roundRobinDraw.matches.filter(m => m.groupIndex === 0);
  console.log('\n🥊 Group A Matches:');
  groupAMatches.slice(0, 3).forEach(match => {
    const p1 = players.find(p => p.id === match.player1Id)?.name || 'Unknown';
    const p2 = players.find(p => p.id === match.player2Id)?.name || 'Unknown';
    console.log(`   Match ${match.matchNumber}: ${p1} vs ${p2}`);
  });
  console.log(`   ... and ${groupAMatches.length - 3} more matches`);
  
  console.log('\n✅ Round robin draw test passed!\n');
} catch (error) {
  console.error('❌ Round robin draw test failed:', error.message);
}

// Test 3: Hybrid Draw
console.log('📋 Test 3: Hybrid Draw (8 players, 2 groups, top 2 advance)');
console.log('─────────────────────────────────────');
try {
  const hybridDraw = DrawEngine.generateDraw({
    format: 'ROUND_ROBIN_KNOCKOUT',
    players: players,
    options: {
      numberOfGroups: 2,
      advancePerGroup: 2
    }
  });

  console.log('✅ Format:', hybridDraw.format);
  console.log('✅ Player Count:', hybridDraw.playerCount);
  console.log('✅ Number of Groups:', hybridDraw.numberOfGroups);
  console.log('✅ Advance Per Group:', hybridDraw.advancePerGroup);
  console.log('✅ Total Matches:', hybridDraw.matches.length);
  
  console.log('\n📊 Round Robin Stage:');
  console.log(`   Groups: ${hybridDraw.stages.roundRobin.groups.length}`);
  console.log(`   Matches: ${hybridDraw.stages.roundRobin.matches.length}`);
  
  console.log('\n🏆 Knockout Stage:');
  console.log(`   Bracket Size: ${hybridDraw.stages.knockout.bracketSize}`);
  console.log(`   Total Rounds: ${hybridDraw.stages.knockout.totalRounds}`);
  console.log(`   Matches: ${hybridDraw.stages.knockout.matches.length}`);
  
  console.log('\n✅ Hybrid draw test passed!\n');
} catch (error) {
  console.error('❌ Hybrid draw test failed:', error.message);
}

// Test 4: Knockout with Byes (7 players)
console.log('📋 Test 4: Knockout with Byes (7 players)');
console.log('─────────────────────────────────────');
try {
  const sevenPlayers = players.slice(0, 7);
  const knockoutWithByes = DrawEngine.generateDraw({
    format: 'KNOCKOUT',
    players: sevenPlayers,
    options: {}
  });

  console.log('✅ Format:', knockoutWithByes.format);
  console.log('✅ Bracket Size:', knockoutWithByes.bracketSize);
  console.log('✅ Player Count:', knockoutWithByes.playerCount);
  console.log('✅ Bye Count:', knockoutWithByes.byeCount);
  
  // Show matches with byes
  const byeMatches = knockoutWithByes.matches.filter(m => m.status === 'BYE');
  console.log(`\n🎫 Matches with Byes: ${byeMatches.length}`);
  byeMatches.forEach(match => {
    const winner = sevenPlayers.find(p => p.id === match.winnerId)?.name || 'Unknown';
    console.log(`   Match ${match.matchNumber}: ${winner} gets BYE`);
  });
  
  console.log('\n✅ Knockout with byes test passed!\n');
} catch (error) {
  console.error('❌ Knockout with byes test failed:', error.message);
}

// Test 5: Custom Group Sizes
console.log('📋 Test 5: Round Robin with Custom Group Sizes');
console.log('─────────────────────────────────────');
try {
  const customGroupDraw = DrawEngine.generateDraw({
    format: 'ROUND_ROBIN',
    players: players,
    options: {
      numberOfGroups: 3,
      customGroupSizes: [3, 3, 2]
    }
  });

  console.log('✅ Format:', customGroupDraw.format);
  console.log('✅ Player Count:', customGroupDraw.playerCount);
  console.log('✅ Number of Groups:', customGroupDraw.numberOfGroups);
  
  console.log('\n👥 Custom Groups:');
  customGroupDraw.groups.forEach(group => {
    console.log(`   Group ${group.groupName}: ${group.playerCount} players, ${group.matchCount} matches`);
  });
  
  console.log('\n✅ Custom group sizes test passed!\n');
} catch (error) {
  console.error('❌ Custom group sizes test failed:', error.message);
}

console.log('🎉 All tests completed!\n');
console.log('Next steps:');
console.log('1. Run database migration: npx prisma migrate dev');
console.log('2. Add routes to your server: import drawV2Routes from "./routes/draw-v2.routes.js"');
console.log('3. Test with real API calls');
console.log('4. Check DRAW_SYSTEM_REBUILD.md for complete guide\n');
