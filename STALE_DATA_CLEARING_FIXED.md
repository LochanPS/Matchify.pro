# Stale Data Clearing Fixed ✅

## Issue

When assigning players to a knockout bracket, stale data from previous matches was appearing in later rounds (Semi-Finals, Finals). For example:
- Quarter Finals: Correctly assigned with new players
- Finals: Showing "Aditya Kapoor vs Akash Pandey" (stale data from previous tournament)

## Root Cause

When using "Add All Players" or "Shuffle Players", the code only updated the FIRST round but didn't clear the other rounds. This left old player data in Semi-Finals and Finals from previous tournaments or tests.

## Solution

Added comprehensive clearing logic to BOTH `bulkAssignAllPlayers` and `shuffleAssignedPlayers` functions:

### 1. Clear ALL Rounds in Bracket JSON
```javascript
// Clear all rounds in bracket JSON
bracketJson.rounds.forEach((round, roundIdx) => {
  round.matches.forEach((match, matchIdx) => {
    if (roundIdx === 0) {
      // First round: Keep slot placeholders
      match.player1 = { id: null, name: `Slot ${matchIdx * 2 + 1}`, seed: matchIdx * 2 + 1 };
      match.player2 = { id: null, name: `Slot ${matchIdx * 2 + 2}`, seed: matchIdx * 2 + 2 };
    } else {
      // Other rounds: Set to TBD
      match.player1 = { id: null, name: 'TBD', seed: null };
      match.player2 = { id: null, name: 'TBD', seed: null };
    }
    match.winner = null;
    match.winnerId = null;
    match.score1 = null;
    match.score2 = null;
  });
});
```

### 2. Clear ALL Matches in Database
```javascript
// Clear all matches in database
await prisma.match.updateMany({
  where: { tournamentId, categoryId },
  data: {
    player1Id: null,
    player2Id: null,
    player1Seed: null,
    player2Seed: null,
    winnerId: null,
    status: 'PENDING',
    scoreJson: null,
    startedAt: null,
    completedAt: null
  }
});
```

### 3. Then Assign Players to First Round
After clearing everything, assign players only to the first round (Quarter Finals).

## Changes Made

### File: `draw.controller.js`

#### `bulkAssignAllPlayers` Function (~line 1000)
**Added 3 steps before assignment:**
1. Clear all rounds in bracket JSON
2. Clear all matches in database
3. Then assign players to first round

```javascript
if (bracketJson.format === 'KNOCKOUT' && bracketJson.rounds) {
  // STEP 1: Clear ALL rounds in bracket JSON (remove stale data)
  console.log('🧹 Clearing all rounds in bracket JSON...');
  bracketJson.rounds.forEach((round, roundIdx) => {
    // Clear logic...
  });

  // STEP 2: Clear ALL matches in database
  console.log('🧹 Clearing all matches in database...');
  await prisma.match.updateMany({
    where: { tournamentId, categoryId },
    data: { /* clear all fields */ }
  });

  // STEP 3: Now assign players to first round
  const firstRound = bracketJson.rounds[0];
  // Assignment logic...
}
```

#### `shuffleAssignedPlayers` Function (~line 1200)
**Added 2 steps before shuffling:**
1. Clear non-first rounds in bracket JSON
2. Clear non-first round matches in database
3. Then shuffle first round players

```javascript
if (bracketJson.format === 'KNOCKOUT' && bracketJson.rounds) {
  // STEP 1: Clear all rounds except first (remove stale data)
  console.log('🧹 Clearing non-first rounds in bracket JSON...');
  for (let roundIdx = 1; roundIdx < bracketJson.rounds.length; roundIdx++) {
    // Clear logic...
  }

  // STEP 2: Clear non-first round matches in database
  console.log('🧹 Clearing non-first round matches in database...');
  const dbRoundNumber = bracketJson.rounds.length;
  await prisma.match.updateMany({
    where: { 
      tournamentId, 
      categoryId,
      round: { lt: dbRoundNumber } // All rounds less than first round
    },
    data: { /* clear fields */ }
  });
  
  // STEP 3: Shuffle first round players
  // Shuffle logic...
}
```

## Visual Example

### Before Fix:
```
Quarter Finals          Semi Finals         Finals
┌─────────┐
│ Player1 │─┐
│ Player2 │ │
└─────────┘ │
            ├──┐
┌─────────┐ │  │
│ Player3 │─┘  │
│ Player4 │    │
└─────────┘    │
               ├──┐
┌─────────┐    │  │      ┌─────────┐
│ Player5 │─┐  │  │      │ Aditya  │  ❌ STALE DATA!
│ Player6 │ │  │  │      │ Akash   │  ❌ From old tournament
└─────────┘ ├──┘  │      └─────────┘
┌─────────┐ │     │
│ Player7 │─┘     │
│ Player8 │       │
└─────────┘       ├──
                  │
                  │
                  └──
```

### After Fix:
```
Quarter Finals          Semi Finals         Finals
┌─────────┐
│ Player1 │─┐
│ Player2 │ │
└─────────┘ │
            ├──┐
┌─────────┐ │  │
│ Player3 │─┘  │
│ Player4 │    │
└─────────┘    │
               ├──┐
┌─────────┐    │  │      ┌─────────┐
│ Player5 │─┐  │  │      │  TBD    │  ✅ CLEAN!
│ Player6 │ │  │  │      │  TBD    │  ✅ No stale data
└─────────┘ ├──┘  │      └─────────┘
┌─────────┐ │     │
│ Player7 │─┘     │
│ Player8 │       │
└─────────┘       ├──
                  │
                  │
                  └──
```

## Why This Happens

Stale data can appear when:
1. Testing with same tournament multiple times
2. Completing matches then resetting
3. Assigning players, then reassigning different players
4. Database has old match data that wasn't cleared

## Testing

### Test Stale Data Clearing:
1. Create knockout tournament (8 players)
2. Register 8 players
3. Click "Add All Players"
4. **Verify**: Quarter Finals have players, Semi-Finals and Finals show "TBD vs TBD"
5. Complete some Quarter Final matches
6. **Verify**: Winners advance to Semi-Finals
7. Click "Add All Players" again (reassign)
8. **Verify**: Semi-Finals and Finals are cleared back to "TBD vs TBD"
9. Click "Shuffle All Players"
10. **Verify**: Semi-Finals and Finals remain "TBD vs TBD"

### Test Different Scenarios:
- [ ] Fresh tournament - no stale data
- [ ] After completing matches - clears properly
- [ ] After multiple reassignments - always clean
- [ ] After shuffle - other rounds stay clean

## Status: COMPLETE ✅

- ✅ Added clearing logic to `bulkAssignAllPlayers`
- ✅ Added clearing logic to `shuffleAssignedPlayers`
- ✅ Clears both bracket JSON and database
- ✅ Backend restarted and running
- ✅ Ready for testing

## Next Steps

1. Create new knockout tournament
2. Click "Add All Players"
3. Verify Finals shows "TBD vs TBD" (not stale player names)
4. Complete Quarter Finals
5. Verify winners advance to Semi-Finals
6. Complete Semi-Finals
7. Verify winners advance to Finals
8. Finals should now have the actual finalists (not stale data)

The bracket should now always be clean with no stale data from previous tournaments!
