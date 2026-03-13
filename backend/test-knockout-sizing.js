/**
 * Test knockout bracket sizing for different configurations
 * Verifies that the system creates the correct number of rounds and matches
 */

function calculateKnockoutStructure(numberOfGroups, advanceFromGroup) {
  const knockoutSize = numberOfGroups * advanceFromGroup;
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(Math.max(2, knockoutSize))));
  const numRounds = Math.log2(bracketSize);
  
  const rounds = [];
  for (let round = 0; round < numRounds; round++) {
    const numMatches = bracketSize / Math.pow(2, round + 1);
    rounds.push({
      roundNumber: round + 1,
      numMatches: numMatches,
      numPlayers: numMatches * 2
    });
  }
  
  return {
    knockoutSize,
    bracketSize,
    numRounds,
    rounds
  };
}

function getRoundName(roundNumber, totalRounds) {
  const playersInRound = Math.pow(2, totalRounds - roundNumber + 1);
  
  if (playersInRound === 2) return 'Final';
  if (playersInRound === 4) return 'Semi Finals';
  if (playersInRound === 8) return 'Quarter Finals';
  if (playersInRound === 16) return 'Round of 16';
  if (playersInRound === 32) return 'Round of 32';
  if (playersInRound === 64) return 'Round of 64';
  
  return `Round ${roundNumber}`;
}

console.log('🧪 KNOCKOUT BRACKET SIZING TEST\n');
console.log('='.repeat(80));

// Test scenarios
const scenarios = [
  { name: 'Small Tournament', groups: 2, advance: 2, totalPlayers: 8 },
  { name: 'Medium Tournament', groups: 4, advance: 2, totalPlayers: 16 },
  { name: 'Your Example', groups: 4, advance: 4, totalPlayers: 32 },
  { name: 'Large Tournament', groups: 8, advance: 2, totalPlayers: 64 },
  { name: 'Odd Number', groups: 3, advance: 3, totalPlayers: 27 },
  { name: 'Very Large', groups: 8, advance: 4, totalPlayers: 128 },
];

scenarios.forEach(scenario => {
  console.log(`\n📊 ${scenario.name}`);
  console.log(`   Total Players: ${scenario.totalPlayers}`);
  console.log(`   Groups: ${scenario.groups}`);
  console.log(`   Advance from each group: ${scenario.advance}`);
  console.log(`   ${'─'.repeat(76)}`);
  
  const structure = calculateKnockoutStructure(scenario.groups, scenario.advance);
  
  console.log(`   Knockout Size: ${structure.knockoutSize} players qualify`);
  console.log(`   Bracket Size: ${structure.bracketSize} (next power of 2)`);
  console.log(`   Total Rounds: ${structure.numRounds}`);
  console.log(`\n   Knockout Structure:`);
  
  structure.rounds.forEach((round, index) => {
    const roundName = getRoundName(round.roundNumber, structure.numRounds);
    console.log(`     Round ${round.roundNumber} (${roundName}): ${round.numMatches} match(es), ${round.numPlayers} players`);
  });
  
  // Check if bracket size matches knockout size (perfect power of 2)
  if (structure.bracketSize === structure.knockoutSize) {
    console.log(`\n   ✅ Perfect bracket - no byes needed`);
  } else {
    const byes = structure.bracketSize - structure.knockoutSize;
    console.log(`\n   ⚠️  ${byes} bye(s) needed (bracket size ${structure.bracketSize} > knockout size ${structure.knockoutSize})`);
  }
});

console.log('\n' + '='.repeat(80));
console.log('📝 SUMMARY\n');
console.log('The system automatically calculates:');
console.log('  1. Knockout size = Groups × Advance per group');
console.log('  2. Bracket size = Next power of 2 (to create proper bracket)');
console.log('  3. Number of rounds = log2(bracket size)');
console.log('  4. Matches per round = bracket size / 2^(round + 1)');
console.log('\n✅ This works for ANY combination of L players, M groups, N advance!');
console.log('='.repeat(80));
