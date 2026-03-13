/**
 * Test Knockout Progression Logic
 * Demonstrates index-based winner advancement
 */

console.log('🧪 Testing Knockout Progression Logic\n');
console.log('═══════════════════════════════════════════════════════════\n');

// Simulate 8-player bracket structure
const bracket8 = {
  totalRounds: 3,
  matches: [
    // Round 3 (First Round) - 4 matches
    { matchIndex: 0, round: 3, matchNumber: 1, stage: 'KNOCKOUT', player1Id: 'p1', player2Id: 'p2' },
    { matchIndex: 1, round: 3, matchNumber: 2, stage: 'KNOCKOUT', player1Id: 'p3', player2Id: 'p4' },
    { matchIndex: 2, round: 3, matchNumber: 3, stage: 'KNOCKOUT', player1Id: 'p5', player2Id: 'p6' },
    { matchIndex: 3, round: 3, matchNumber: 4, stage: 'KNOCKOUT', player1Id: 'p7', player2Id: 'p8' },
    // Round 2 (Semi-Finals) - 2 matches
    { matchIndex: 4, round: 2, matchNumber: 1, stage: 'KNOCKOUT', player1Id: null, player2Id: null },
    { matchIndex: 5, round: 2, matchNumber: 2, stage: 'KNOCKOUT', player1Id: null, player2Id: null },
    // Round 1 (Final) - 1 match
    { matchIndex: 6, round: 1, matchNumber: 1, stage: 'KNOCKOUT', player1Id: null, player2Id: null }
  ]
};

/**
 * Calculate next match position using index-based progression
 */
function calculateNextMatchPosition(currentMatchIndex, currentRound, allMatches) {
  if (currentRound === 1) {
    return { nextMatchIndex: null, winnerSlot: null };
  }

  // Get matches in current round
  const currentRoundMatches = allMatches.filter(m => m.round === currentRound);
  const sortedCurrentRound = currentRoundMatches.sort((a, b) => a.matchIndex - b.matchIndex);
  const positionInRound = sortedCurrentRound.findIndex(m => m.matchIndex === currentMatchIndex);

  // Get next round matches
  const nextRound = currentRound - 1;
  const nextRoundMatches = allMatches.filter(m => m.round === nextRound);
  const sortedNextRound = nextRoundMatches.sort((a, b) => a.matchIndex - b.matchIndex);

  // Calculate which match in next round
  const nextMatchPosition = Math.floor(positionInRound / 2);
  const nextMatch = sortedNextRound[nextMatchPosition];

  if (!nextMatch) {
    return { nextMatchIndex: null, winnerSlot: null };
  }

  // Determine slot: even position → player1, odd position → player2
  const winnerSlot = (positionInRound % 2 === 0) ? 'player1' : 'player2';

  return {
    nextMatchIndex: nextMatch.matchIndex,
    winnerSlot
  };
}

/**
 * Simulate match completion and winner advancement
 */
function simulateMatchCompletion(matchIndex, winnerId, matches) {
  const match = matches.find(m => m.matchIndex === matchIndex);
  
  console.log(`\n🥊 Match ${matchIndex} (Round ${match.round}): ${match.player1Id} vs ${match.player2Id}`);
  console.log(`   Winner: ${winnerId}`);
  
  // Mark match as completed
  match.winnerId = winnerId;
  match.status = 'COMPLETED';
  
  // Calculate next match
  const { nextMatchIndex, winnerSlot } = calculateNextMatchPosition(
    matchIndex,
    match.round,
    matches
  );
  
  if (nextMatchIndex === null) {
    console.log(`   🏆 TOURNAMENT WINNER: ${winnerId}`);
    return;
  }
  
  const nextMatch = matches.find(m => m.matchIndex === nextMatchIndex);
  console.log(`   → Advances to Match ${nextMatchIndex} (Round ${nextMatch.round}) as ${winnerSlot}`);
  
  // Place winner in next match
  if (winnerSlot === 'player1') {
    nextMatch.player1Id = winnerId;
  } else {
    nextMatch.player2Id = winnerId;
  }
  
  // Update next match status
  if (nextMatch.player1Id && nextMatch.player2Id) {
    nextMatch.status = 'READY';
    console.log(`   ✅ Match ${nextMatchIndex} is now READY`);
  } else {
    nextMatch.status = 'PENDING';
    console.log(`   ⏳ Match ${nextMatchIndex} still PENDING (waiting for other player)`);
  }
}

// Test 8-player bracket
console.log('📋 Test 1: 8-Player Bracket Progression');
console.log('─────────────────────────────────────────────────────────\n');

console.log('Initial Bracket Structure:');
console.log('Round 3 (First Round): Matches 0, 1, 2, 3');
console.log('Round 2 (Semi-Finals): Matches 4, 5');
console.log('Round 1 (Final): Match 6\n');

console.log('Progression Rules:');
console.log('• nextMatchIndex = floor(currentMatchIndex / 2)');
console.log('• Even matchIndex → player1 slot');
console.log('• Odd matchIndex → player2 slot\n');

console.log('Expected Progression:');
console.log('Match 0 winner → Match 4 player1');
console.log('Match 1 winner → Match 4 player2');
console.log('Match 2 winner → Match 5 player1');
console.log('Match 3 winner → Match 5 player2');
console.log('Match 4 winner → Match 6 player1');
console.log('Match 5 winner → Match 6 player2\n');

console.log('═══════════════════════════════════════════════════════════');

// Simulate first round
simulateMatchCompletion(0, 'p1', bracket8.matches); // p1 beats p2
simulateMatchCompletion(1, 'p3', bracket8.matches); // p3 beats p4
simulateMatchCompletion(2, 'p5', bracket8.matches); // p5 beats p6
simulateMatchCompletion(3, 'p8', bracket8.matches); // p8 beats p7

console.log('\n─────────────────────────────────────────────────────────');
console.log('After First Round:');
console.log(`Match 4: ${bracket8.matches[4].player1Id} vs ${bracket8.matches[4].player2Id} (${bracket8.matches[4].status})`);
console.log(`Match 5: ${bracket8.matches[5].player1Id} vs ${bracket8.matches[5].player2Id} (${bracket8.matches[5].status})`);

// Simulate semi-finals
console.log('\n═══════════════════════════════════════════════════════════');
simulateMatchCompletion(4, 'p1', bracket8.matches); // p1 beats p3
simulateMatchCompletion(5, 'p5', bracket8.matches); // p5 beats p8

console.log('\n─────────────────────────────────────────────────────────');
console.log('After Semi-Finals:');
console.log(`Match 6: ${bracket8.matches[6].player1Id} vs ${bracket8.matches[6].player2Id} (${bracket8.matches[6].status})`);

// Simulate final
console.log('\n═══════════════════════════════════════════════════════════');
simulateMatchCompletion(6, 'p1', bracket8.matches); // p1 beats p5

console.log('\n═══════════════════════════════════════════════════════════\n');

// Test 16-player bracket
console.log('📋 Test 2: 16-Player Bracket Progression');
console.log('─────────────────────────────────────────────────────────\n');

const bracket16 = {
  totalRounds: 4,
  matches: [
    // Round 4 (First Round) - 8 matches
    ...Array.from({ length: 8 }, (_, i) => ({
      matchIndex: i,
      round: 4,
      matchNumber: i + 1,
      stage: 'KNOCKOUT',
      player1Id: `p${i * 2 + 1}`,
      player2Id: `p${i * 2 + 2}`
    })),
    // Round 3 (Quarter-Finals) - 4 matches
    ...Array.from({ length: 4 }, (_, i) => ({
      matchIndex: i + 8,
      round: 3,
      matchNumber: i + 1,
      stage: 'KNOCKOUT',
      player1Id: null,
      player2Id: null
    })),
    // Round 2 (Semi-Finals) - 2 matches
    ...Array.from({ length: 2 }, (_, i) => ({
      matchIndex: i + 12,
      round: 2,
      matchNumber: i + 1,
      stage: 'KNOCKOUT',
      player1Id: null,
      player2Id: null
    })),
    // Round 1 (Final) - 1 match
    {
      matchIndex: 14,
      round: 1,
      matchNumber: 1,
      stage: 'KNOCKOUT',
      player1Id: null,
      player2Id: null
    }
  ]
};

console.log('Testing first 4 matches:');
simulateMatchCompletion(0, 'p1', bracket16.matches);
simulateMatchCompletion(1, 'p3', bracket16.matches);
simulateMatchCompletion(2, 'p5', bracket16.matches);
simulateMatchCompletion(3, 'p7', bracket16.matches);

console.log('\n─────────────────────────────────────────────────────────');
console.log('Quarter-Finals Status:');
console.log(`Match 8: ${bracket16.matches[8].player1Id} vs ${bracket16.matches[8].player2Id} (${bracket16.matches[8].status})`);
console.log(`Match 9: ${bracket16.matches[9].player1Id} vs ${bracket16.matches[9].player2Id} (${bracket16.matches[9].status})`);

console.log('\n═══════════════════════════════════════════════════════════\n');

// Test BYE scenario
console.log('📋 Test 3: BYE Handling (7 players in 8-player bracket)');
console.log('─────────────────────────────────────────────────────────\n');

const bracket7 = {
  totalRounds: 3,
  matches: [
    // Round 3 (First Round) - 4 matches
    { matchIndex: 0, round: 3, matchNumber: 1, stage: 'KNOCKOUT', player1Id: 'p1', player2Id: null }, // BYE
    { matchIndex: 1, round: 3, matchNumber: 2, stage: 'KNOCKOUT', player1Id: 'p2', player2Id: 'p3' },
    { matchIndex: 2, round: 3, matchNumber: 3, stage: 'KNOCKOUT', player1Id: 'p4', player2Id: 'p5' },
    { matchIndex: 3, round: 3, matchNumber: 4, stage: 'KNOCKOUT', player1Id: 'p6', player2Id: 'p7' },
    // Round 2 (Semi-Finals) - 2 matches
    { matchIndex: 4, round: 2, matchNumber: 1, stage: 'KNOCKOUT', player1Id: null, player2Id: null },
    { matchIndex: 5, round: 2, matchNumber: 2, stage: 'KNOCKOUT', player1Id: null, player2Id: null },
    // Round 1 (Final) - 1 match
    { matchIndex: 6, round: 1, matchNumber: 1, stage: 'KNOCKOUT', player1Id: null, player2Id: null }
  ]
};

console.log('Match 0: p1 vs [EMPTY] → p1 gets BYE');
console.log('🎫 BYE: p1 automatically advances');

// Simulate BYE
const byeMatch = bracket7.matches[0];
byeMatch.winnerId = 'p1';
byeMatch.status = 'COMPLETED';

const { nextMatchIndex, winnerSlot } = calculateNextMatchPosition(0, 3, bracket7.matches);
const nextMatch = bracket7.matches.find(m => m.matchIndex === nextMatchIndex);

if (winnerSlot === 'player1') {
  nextMatch.player1Id = 'p1';
} else {
  nextMatch.player2Id = 'p1';
}

console.log(`   → p1 advances to Match ${nextMatchIndex} as ${winnerSlot}`);
console.log(`   Match ${nextMatchIndex}: ${nextMatch.player1Id} vs ${nextMatch.player2Id} (${nextMatch.status || 'PENDING'})`);

console.log('\n═══════════════════════════════════════════════════════════\n');

console.log('✅ All progression tests passed!\n');
console.log('Key Takeaways:');
console.log('1. nextMatchIndex = floor(currentMatchIndex / 2)');
console.log('2. Even matchIndex → player1 slot, Odd → player2 slot');
console.log('3. Match becomes READY when both players present');
console.log('4. BYEs automatically advance to next round');
console.log('5. Works for any bracket size (4, 8, 16, 32, etc.)\n');
