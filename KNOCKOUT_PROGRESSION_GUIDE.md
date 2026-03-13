# Knockout Progression Guide - Index-Based Logic

## Overview

The knockout progression system uses pure index-based calculations to advance winners through the bracket. No parent-child relationships are used - only matchIndex and round numbers.

## Core Progression Rules

### Rule 1: Next Match Calculation
```
nextMatchIndex = floor(currentMatchIndex / 2)
```

### Rule 2: Slot Placement
```
If currentMatchIndex is EVEN → winner goes to player1 slot
If currentMatchIndex is ODD → winner goes to player2 slot
```

### Rule 3: Match Status
```
If both player1Id AND player2Id exist → status = READY
If one or both missing → status = PENDING
```

## Visual Example: 8-Player Bracket

```
Round 3 (First Round)          Round 2 (Semi-Finals)      Round 1 (Final)
─────────────────────          ─────────────────────      ───────────────

Match 0: P1 vs P2 ─────┐
                       ├──→ Match 4: ? vs ? ────┐
Match 1: P3 vs P4 ─────┘                        │
                                                ├──→ Match 6: ? vs ?
Match 2: P5 vs P6 ─────┐                        │
                       ├──→ Match 5: ? vs ? ────┘
Match 3: P7 vs P8 ─────┘
```

### Progression Flow

**Match 0 (even) completes:**
- nextMatchIndex = floor(0 / 2) = 0... wait, that's wrong!

Actually, the calculation works within each round:

**Correct Calculation:**
1. Find position of match within its round
2. Calculate next match position: `floor(positionInRound / 2)`
3. Find match at that position in next round

**Example:**
- Match 0 is position 0 in Round 3
- Next match position = floor(0 / 2) = 0
- Match at position 0 in Round 2 = Match 4
- Position 0 is even → player1 slot
- **Result: Match 0 winner → Match 4 player1**

**Match 1:**
- Position 1 in Round 3
- Next position = floor(1 / 2) = 0
- Match at position 0 in Round 2 = Match 4
- Position 1 is odd → player2 slot
- **Result: Match 1 winner → Match 4 player2**

**Match 2:**
- Position 2 in Round 3
- Next position = floor(2 / 2) = 1
- Match at position 1 in Round 2 = Match 5
- Position 2 is even → player1 slot
- **Result: Match 2 winner → Match 5 player1**

**Match 3:**
- Position 3 in Round 3
- Next position = floor(3 / 2) = 1
- Match at position 1 in Round 2 = Match 5
- Position 3 is odd → player2 slot
- **Result: Match 3 winner → Match 5 player2**

## Complete Progression Table

### 8-Player Bracket

| Current Match | Round | Position | Next Match | Next Round | Slot |
|--------------|-------|----------|------------|------------|------|
| Match 0 | 3 | 0 | Match 4 | 2 | player1 |
| Match 1 | 3 | 1 | Match 4 | 2 | player2 |
| Match 2 | 3 | 2 | Match 5 | 2 | player1 |
| Match 3 | 3 | 3 | Match 5 | 2 | player2 |
| Match 4 | 2 | 0 | Match 6 | 1 | player1 |
| Match 5 | 2 | 1 | Match 6 | 1 | player2 |
| Match 6 | 1 | 0 | FINAL | - | - |

### 16-Player Bracket

| Current Match | Round | Position | Next Match | Next Round | Slot |
|--------------|-------|----------|------------|------------|------|
| Match 0 | 4 | 0 | Match 8 | 3 | player1 |
| Match 1 | 4 | 1 | Match 8 | 3 | player2 |
| Match 2 | 4 | 2 | Match 9 | 3 | player1 |
| Match 3 | 4 | 3 | Match 9 | 3 | player2 |
| Match 4 | 4 | 4 | Match 10 | 3 | player1 |
| Match 5 | 4 | 5 | Match 10 | 3 | player2 |
| Match 6 | 4 | 6 | Match 11 | 3 | player1 |
| Match 7 | 4 | 7 | Match 11 | 3 | player2 |
| Match 8 | 3 | 0 | Match 12 | 2 | player1 |
| Match 9 | 3 | 1 | Match 12 | 2 | player2 |
| Match 10 | 3 | 2 | Match 13 | 2 | player1 |
| Match 11 | 3 | 3 | Match 13 | 2 | player2 |
| Match 12 | 2 | 0 | Match 14 | 1 | player1 |
| Match 13 | 2 | 1 | Match 14 | 1 | player2 |
| Match 14 | 1 | 0 | FINAL | - | - |

## Implementation Details

### Match Completion Flow

```javascript
// 1. Match completes
await completeMatch(matchId, winnerId, scoreJson);

// 2. Update match status
match.status = 'COMPLETED';
match.winnerId = winnerId;
match.completedAt = new Date();

// 3. Calculate next match position
const { nextMatchIndex, winnerSlot } = calculateNextMatchPosition(
  match.matchIndex,
  match.round,
  allMatches
);

// 4. Place winner in next match
if (winnerSlot === 'player1') {
  nextMatch.player1Id = winnerId;
} else {
  nextMatch.player2Id = winnerId;
}

// 5. Update next match status
if (nextMatch.player1Id && nextMatch.player2Id) {
  nextMatch.status = 'READY';
} else {
  nextMatch.status = 'PENDING';
}
```

### BYE Handling

When a player has no opponent (BYE):

```javascript
// During player assignment
if (player1 && !player2) {
  match.status = 'COMPLETED';
  match.winnerId = player1.id;
  
  // Automatically advance to next round
  advanceWinner(tournamentId, categoryId, match.matchIndex, player1.id);
}
```

### Match Reset Flow

When a match result is reset:

```javascript
// 1. Clear match result
match.winnerId = null;
match.scoreJson = null;
match.status = 'READY'; // or 'PENDING' if players missing
match.completedAt = null;

// 2. Clear downstream matches
// Find all matches affected by this reset
const affectedMatches = getAffectedMatches(match.matchIndex, match.round);

// 3. Clear each affected match
for (const affectedMatch of affectedMatches) {
  // Clear the player slot that came from reset match
  if (winnerSlot === 'player1') {
    affectedMatch.player1Id = null;
  } else {
    affectedMatch.player2Id = null;
  }
  
  // Clear result
  affectedMatch.winnerId = null;
  affectedMatch.scoreJson = null;
  affectedMatch.status = 'PENDING';
}
```

## API Usage

### Complete Match
```http
POST /api/v2/matches/:matchId/complete
Authorization: Bearer {token}
Content-Type: application/json

{
  "winnerId": "player-uuid",
  "scoreJson": {
    "set1": "21-15",
    "set2": "21-18"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Match completed successfully",
  "data": {
    "match": {
      "id": "match-uuid",
      "matchIndex": 0,
      "round": 3,
      "status": "COMPLETED",
      "winnerId": "player-uuid"
    }
  }
}
```

**What Happens:**
1. Match 0 marked as COMPLETED
2. Winner automatically placed in Match 4 player1 slot
3. If Match 4 now has both players, status → READY

### Reset Match
```http
POST /api/v2/matches/:matchId/reset
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Match reset successfully. Downstream matches cleared.",
  "data": {
    "match": {
      "id": "match-uuid",
      "matchIndex": 0,
      "round": 3,
      "status": "READY",
      "winnerId": null
    }
  }
}
```

**What Happens:**
1. Match 0 result cleared
2. Match 4 player1 slot cleared (came from Match 0)
3. Match 4 status → PENDING
4. If Match 4 was completed, it's also reset
5. Cascade continues up the bracket

## Testing

Run the progression test:
```bash
node backend/src/services/draw-engine/test-progression.js
```

This demonstrates:
- 8-player bracket progression
- 16-player bracket progression
- BYE handling
- Index calculations
- Status updates

## Edge Cases

### Case 1: Both Semi-Final Winners Advance Simultaneously
```
Match 4 completes → Match 6 player1 filled → status PENDING
Match 5 completes → Match 6 player2 filled → status READY
```

### Case 2: Reset Semi-Final After Final Started
```
Reset Match 4 → Clear Match 6 player1 → Match 6 status PENDING
If Match 6 was completed → Also reset Match 6
```

### Case 3: Multiple BYEs
```
Match 0: P1 vs [EMPTY] → P1 advances to Match 4 player1
Match 1: P2 vs [EMPTY] → P2 advances to Match 4 player2
Match 4: P1 vs P2 → status READY (both present)
```

### Case 4: All Players in One Half Get BYEs
```
Matches 0, 1 have BYEs → Match 4 fills immediately
Match 4 completes → Winner advances to Match 6
Match 6 waits for Match 5 winner
```

## Benefits

✅ **No Parent-Child References** - Pure index-based calculations
✅ **Predictable** - Same formula works for any bracket size
✅ **Easy to Debug** - Simple math, no complex relationships
✅ **Stable Structure** - Bracket never regenerates
✅ **Automatic Advancement** - Winners flow through bracket
✅ **BYE Support** - Automatic advancement for BYEs
✅ **Reset Support** - Clean downstream clearing

## Troubleshooting

### Issue: Winner not advancing
**Check:**
1. Match status is COMPLETED
2. winnerId is set
3. Match stage is 'KNOCKOUT'
4. Next match exists (not final)

### Issue: Next match not becoming READY
**Check:**
1. Both player1Id and player2Id are set
2. Status update logic is running
3. No errors in advancement logic

### Issue: Wrong player slot
**Check:**
1. Position in round calculation
2. Even/odd logic (even → player1, odd → player2)
3. Match sorting by matchIndex

## Summary

The knockout progression system uses simple, predictable index-based calculations:

1. **Calculate position** within current round
2. **Divide by 2** to get next match position
3. **Even/odd** determines player slot
4. **Update status** based on player presence

This works for any bracket size and requires no parent-child relationships.
