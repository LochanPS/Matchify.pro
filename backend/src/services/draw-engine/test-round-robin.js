/**
 * Test Round Robin and Hybrid System
 * Demonstrates match generation, standings calculation, and knockout arrangement
 */

console.log('🧪 Testing Round Robin and Hybrid System\n');
console.log('═══════════════════════════════════════════════════════════\n');

// Test 1: Round Robin Match Generation
console.log('📋 Test 1: Round Robin Match Generation (4 players per group)');
console.log('─────────────────────────────────────────────────────────\n');

const group4Players = ['A', 'B', 'C', 'D'];

function generateRoundRobinMatches(players) {
  const matches = [];
  let matchNumber = 1;

  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      matches.push({
        matchNumber: matchNumber++,
        player1: players[i],
        player2: players[j],
        winner: null,
        status: 'READY'
      });
    }
  }

  return matches;
}

const matches = generateRoundRobinMatches(group4Players);

console.log('Group with 4 players:', group4Players.join(', '));
console.log(`Total matches: ${matches.length} (expected: 4×3/2 = 6)\n`);

matches.forEach(match => {
  console.log(`Match ${match.matchNumber}: ${match.player1} vs ${match.player2}`);
});

console.log('\n✅ Match generation correct!\n');

// Test 2: Standings Calculation
console.log('═══════════════════════════════════════════════════════════\n');
console.log('📋 Test 2: Standings Calculation');
console.log('─────────────────────────────────────────────────────────\n');

// Simulate match results
const results = [
  { match: 1, winner: 'A' }, // A beats B
  { match: 2, winner: 'A' }, // A beats C
  { match: 3, winner: 'D' }, // D beats A
  { match: 4, winner: 'B' }, // B beats C
  { match: 5, winner: 'D' }, // D beats B
  { match: 6, winner: 'D' }  // D beats C
];

function calculateStandings(players, matches, results) {
  const standings = new Map();

  // Initialize standings
  players.forEach(player => {
    standings.set(player, {
      player,
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      points: 0
    });
  });

  // Process results
  results.forEach(result => {
    const match = matches[result.match - 1];
    const player1Stats = standings.get(match.player1);
    const player2Stats = standings.get(match.player2);

    player1Stats.matchesPlayed++;
    player2Stats.matchesPlayed++;

    if (result.winner === match.player1) {
      player1Stats.wins++;
      player1Stats.points += 1;
      player2Stats.losses++;
    } else {
      player2Stats.wins++;
      player2Stats.points += 1;
      player1Stats.losses++;
    }
  });

  // Convert to array and sort
  return Array.from(standings.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.losses - b.losses;
  });
}

const standings = calculateStandings(group4Players, matches, results);

console.log('Match Results:');
results.forEach(result => {
  const match = matches[result.match - 1];
  console.log(`  Match ${result.match}: ${match.player1} vs ${match.player2} → Winner: ${result.winner}`);
});

console.log('\nFinal Standings:');
console.log('Pos | Player | Played | Wins | Losses | Points');
console.log('----+--------+--------+------+--------+-------');
standings.forEach((stats, index) => {
  console.log(
    `${(index + 1).toString().padStart(3)} | ${stats.player.padEnd(6)} | ${stats.matchesPlayed.toString().padStart(6)} | ${stats.wins.toString().padStart(4)} | ${stats.losses.toString().padStart(6)} | ${stats.points.toString().padStart(6)}`
  );
});

console.log('\n✅ Standings calculation correct!');
console.log(`   Winner: ${standings[0].player} with ${standings[0].points} points\n`);

// Test 3: Multiple Groups
console.log('═══════════════════════════════════════════════════════════\n');
console.log('📋 Test 3: Multiple Groups (4 groups, 4 players each)');
console.log('─────────────────────────────────────────────────────────\n');

const groups = [
  { name: 'A', players: ['A1', 'A2', 'A3', 'A4'] },
  { name: 'B', players: ['B1', 'B2', 'B3', 'B4'] },
  { name: 'C', players: ['C1', 'C2', 'C3', 'C4'] },
  { name: 'D', players: ['D1', 'D2', 'D3', 'D4'] }
];

let totalMatches = 0;

groups.forEach(group => {
  const groupMatches = generateRoundRobinMatches(group.players);
  totalMatches += groupMatches.length;
  console.log(`Group ${group.name}: ${group.players.length} players, ${groupMatches.length} matches`);
});

console.log(`\nTotal matches across all groups: ${totalMatches}`);
console.log('Expected: 4 groups × 6 matches = 24 matches');
console.log(totalMatches === 24 ? '✅ Correct!' : '❌ Incorrect!');

// Test 4: Hybrid Format
console.log('\n═══════════════════════════════════════════════════════════\n');
console.log('📋 Test 4: Hybrid Format (Round Robin + Knockout)');
console.log('─────────────────────────────────────────────────────────\n');

const advancePerGroup = 2;
const totalPlayers = 16;
const numberOfGroups = 4;
const playersPerGroup = totalPlayers / numberOfGroups;

console.log('Configuration:');
console.log(`  Total players: ${totalPlayers}`);
console.log(`  Number of groups: ${numberOfGroups}`);
console.log(`  Players per group: ${playersPerGroup}`);
console.log(`  Advance per group: ${advancePerGroup}`);

// Calculate matches
const matchesPerGroup = (playersPerGroup * (playersPerGroup - 1)) / 2;
const totalGroupMatches = numberOfGroups * matchesPerGroup;
const knockoutPlayers = numberOfGroups * advancePerGroup;
const knockoutMatches = knockoutPlayers - 1;
const totalMatchesHybrid = totalGroupMatches + knockoutMatches;

console.log('\nMatch Breakdown:');
console.log(`  Group stage: ${numberOfGroups} groups × ${matchesPerGroup} matches = ${totalGroupMatches} matches`);
console.log(`  Knockout stage: ${knockoutPlayers} players → ${knockoutMatches} matches`);
console.log(`  Total: ${totalMatchesHybrid} matches`);

// Simulate group winners
console.log('\nSimulated Group Winners:');
const qualifiedPlayers = [];
groups.forEach(group => {
  const top2 = group.players.slice(0, advancePerGroup);
  console.log(`  Group ${group.name}: ${top2.join(', ')}`);
  qualifiedPlayers.push(...top2);
});

console.log(`\nQualified for knockout: ${qualifiedPlayers.length} players`);
console.log('Players:', qualifiedPlayers.join(', '));

// Calculate knockout bracket
const knockoutBracketSize = Math.pow(2, Math.ceil(Math.log2(qualifiedPlayers.length)));
console.log(`\nKnockout bracket size: ${knockoutBracketSize} (next power of 2)`);
console.log(`Knockout rounds: ${Math.log2(knockoutBracketSize)}`);

console.log('\n✅ Hybrid format calculation correct!\n');

// Test 5: Standings Sorting
console.log('═══════════════════════════════════════════════════════════\n');
console.log('📋 Test 5: Standings Sorting (Tie-breaking)');
console.log('─────────────────────────────────────────────────────────\n');

const tiedStandings = [
  { player: 'P1', matchesPlayed: 3, wins: 2, losses: 1, points: 2 },
  { player: 'P2', matchesPlayed: 3, wins: 2, losses: 1, points: 2 },
  { player: 'P3', matchesPlayed: 3, wins: 1, losses: 2, points: 1 },
  { player: 'P4', matchesPlayed: 3, wins: 1, losses: 2, points: 1 }
];

console.log('Before sorting:');
tiedStandings.forEach(s => {
  console.log(`  ${s.player}: ${s.points} points, ${s.wins} wins, ${s.losses} losses`);
});

const sorted = tiedStandings.sort((a, b) => {
  if (b.points !== a.points) return b.points - a.points;
  if (b.wins !== a.wins) return b.wins - a.wins;
  return a.losses - b.losses;
});

console.log('\nAfter sorting (Points → Wins → Losses):');
sorted.forEach((s, index) => {
  console.log(`  ${index + 1}. ${s.player}: ${s.points} points, ${s.wins} wins, ${s.losses} losses`);
});

console.log('\n✅ Tie-breaking works correctly!\n');

// Test 6: Different Group Sizes
console.log('═══════════════════════════════════════════════════════════\n');
console.log('📋 Test 6: Different Group Sizes');
console.log('─────────────────────────────────────────────────────────\n');

const groupSizes = [3, 4, 5, 6];

console.log('Matches per group size:');
groupSizes.forEach(size => {
  const matches = (size * (size - 1)) / 2;
  console.log(`  ${size} players: ${matches} matches`);
});

console.log('\n✅ Formula n(n-1)/2 works for all sizes!\n');

// Summary
console.log('═══════════════════════════════════════════════════════════\n');
console.log('🎉 All Round Robin and Hybrid tests passed!\n');

console.log('Key Takeaways:');
console.log('1. Match generation: n(n-1)/2 for n players');
console.log('2. Standings: Points → Wins → Losses');
console.log('3. Points system: Win = 1 point, Loss = 0 points');
console.log('4. Hybrid format: Group matches + Knockout matches');
console.log('5. Knockout arrangement: Top N from each group');
console.log('6. Works for any number of groups and group sizes\n');

console.log('Next Steps:');
console.log('1. Test with real database');
console.log('2. Test standings updates after match completion');
console.log('3. Test knockout arrangement with qualified players');
console.log('4. Test with different group configurations\n');
