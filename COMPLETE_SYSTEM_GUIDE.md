# Complete Draw System Guide - All Formats

## System Overview

The draw system supports three tournament formats with stable match generation, automatic progression, and real-time standings.

## Three Tournament Formats

### 1. KNOCKOUT (Single Elimination)
- Pure knockout bracket
- Winner advances automatically
- Index-based progression
- BYE support

### 2. ROUND_ROBIN (Group Stage)
- Every player plays every other player in their group
- Automatic standings calculation
- Points system: Win = 1, Loss = 0
- Sorting: Points → Wins → Losses

### 3. ROUND_ROBIN_KNOCKOUT (Hybrid)
- Group stage first (round robin)
- Top N players from each group advance
- Knockout stage follows
- Organizer arranges qualified players

## Core Principles

✅ **Stable Structure** - Matches created once, NEVER regenerate
✅ **Index-Based** - No parent-child relationships
✅ **Automatic Updates** - Winners advance, standings calculate
✅ **Clear Status Flow** - PENDING → READY → IN_PROGRESS → COMPLETED
✅ **Flexible Configuration** - Any bracket size, any number of groups

## Complete API Reference

### Draw Management

#### Create Draw
```http
POST /api/v2/tournaments/:id/categories/:id/draw
Authorization: Bearer {token}
Content-Type: application/json

// Knockout
{
  "format": "KNOCKOUT",
  "bracketSize": 16,
  "options": {}
}

// Round Robin
{
  "format": "ROUND_ROBIN",
  "bracketSize": 16,
  "options": {
    "numberOfGroups": 4
  }
}

// Hybrid
{
  "format": "ROUND_ROBIN_KNOCKOUT",
  "bracketSize": 16,
  "options": {
    "numberOfGroups": 4,
    "advancePerGroup": 2
  }
}
```

#### Get Draw
```http
GET /api/v2/tournaments/:id/categories/:id/draw
```

#### Delete Draw
```http
DELETE /api/v2/tournaments/:id/categories/:id/draw
Authorization: Bearer {token}
```

### Player Assignment

#### Manual Assignment
```http
POST /api/v2/tournaments/:id/categories/:id/assign-players
Authorization: Bearer {token}
Content-Type: application/json

{
  "playerAssignments": [
    { "slotIndex": 0, "playerId": "uuid", "seed": 1 },
    { "slotIndex": 1, "playerId": "uuid", "seed": 2 }
  ]
}
```

#### Auto-Assign All
```http
POST /api/v2/tournaments/:id/categories/:id/auto-assign-players
Authorization: Bearer {token}
```

#### Get Confirmed Players
```http
GET /api/v2/tournaments/:id/categories/:id/confirmed-players
Authorization: Bearer {token}
```

#### Shuffle Players
```http
POST /api/v2/tournaments/:id/categories/:id/shuffle
Authorization: Bearer {token}
```

### Match Management

#### Get Matches
```http
GET /api/v2/tournaments/:id/categories/:id/matches?stage=KNOCKOUT&round=1
```

#### Complete Match
```http
POST /api/v2/matches/:id/complete
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

#### Reset Match
```http
POST /api/v2/matches/:id/reset
Authorization: Bearer {token}
```

### Round Robin & Hybrid

#### Get Group Standings
```http
GET /api/v2/tournaments/:id/categories/:id/groups/:groupIndex/standings
```

#### Get All Standings
```http
GET /api/v2/tournaments/:id/categories/:id/standings
```

#### Manual Arrange Knockout
```http
POST /api/v2/tournaments/:id/categories/:id/continue-knockout
Authorization: Bearer {token}
Content-Type: application/json

{
  "qualifiedPlayerIds": ["uuid1", "uuid2", ...]
}
```

#### Auto-Arrange Knockout
```http
POST /api/v2/tournaments/:id/categories/:id/auto-arrange-knockout
Authorization: Bearer {token}
Content-Type: application/json

{
  "advancePerGroup": 2
}
```

## Complete Workflows

### Knockout Tournament (16 players)

```javascript
// 1. Create draw
await fetch('/api/v2/tournaments/t123/categories/c456/draw', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    format: 'KNOCKOUT',
    bracketSize: 16,
    options: {}
  })
});
// Result: 15 matches created (8+4+2+1)

// 2. Auto-assign players
await fetch('/api/v2/tournaments/t123/categories/c456/auto-assign-players', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer token' }
});
// Result: Players assigned by seed, first round matches READY

// 3. Complete matches
await fetch('/api/v2/matches/match-0-id/complete', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    winnerId: 'player1-id',
    scoreJson: { set1: '21-15', set2: '21-18' }
  })
});
// Result: Winner automatically advances to next round
```

### Round Robin Tournament (16 players, 4 groups)

```javascript
// 1. Create draw
await fetch('/api/v2/tournaments/t123/categories/c456/draw', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    format: 'ROUND_ROBIN',
    bracketSize: 16,
    options: {
      numberOfGroups: 4
    }
  })
});
// Result: 24 matches created (4 groups × 6 matches)

// 2. Auto-assign players
await fetch('/api/v2/tournaments/t123/categories/c456/auto-assign-players', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer token' }
});
// Result: Players distributed across groups, matches READY

// 3. Complete group matches
// ... complete all 24 matches

// 4. Get final standings
const standings = await fetch(
  '/api/v2/tournaments/t123/categories/c456/standings'
).then(r => r.json());
// Result: Standings for all 4 groups
```

### Hybrid Tournament (16 players, 4 groups, top 2 advance)

```javascript
// 1. Create draw
await fetch('/api/v2/tournaments/t123/categories/c456/draw', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    format: 'ROUND_ROBIN_KNOCKOUT',
    bracketSize: 16,
    options: {
      numberOfGroups: 4,
      advancePerGroup: 2
    }
  })
});
// Result: 24 group matches + 7 knockout matches = 31 total

// 2. Auto-assign players
await fetch('/api/v2/tournaments/t123/categories/c456/auto-assign-players', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer token' }
});
// Result: Players in groups, group matches READY, knockout PENDING

// 3. Complete all group matches
// ... complete 24 group matches

// 4. Auto-arrange knockout
await fetch('/api/v2/tournaments/t123/categories/c456/auto-arrange-knockout', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    advancePerGroup: 2
  })
});
// Result: Top 2 from each group placed in knockout, matches READY

// 5. Complete knockout stage
// ... complete 7 knockout matches
// Winners advance automatically
```

## Match Count Calculations

### Knockout
```
Matches = bracketSize - 1
```
- 4 players: 3 matches
- 8 players: 7 matches
- 16 players: 15 matches
- 32 players: 31 matches

### Round Robin
```
Matches per group = n(n-1)/2
Total = numberOfGroups × matchesPerGroup
```
- 16 players, 4 groups: 4 × 6 = 24 matches
- 20 players, 4 groups: 4 × 10 = 40 matches

### Hybrid
```
Total = Group matches + Knockout matches
Knockout matches = (numberOfGroups × advancePerGroup) - 1
```
- 16 players, 4 groups, top 2: 24 + 7 = 31 matches
- 16 players, 4 groups, top 1: 24 + 3 = 27 matches

## Progression Logic

### Knockout Progression
```javascript
// Calculate next match
positionInRound = current match position within round
nextMatchPosition = floor(positionInRound / 2)
winnerSlot = (positionInRound % 2 === 0) ? 'player1' : 'player2'
```

**Example:**
- Match 0 (position 0) → Match 4 player1
- Match 1 (position 1) → Match 4 player2
- Match 2 (position 2) → Match 5 player1
- Match 3 (position 3) → Match 5 player2

### Round Robin Standings
```javascript
// Calculate standings
for each completed match:
  winner.wins++
  winner.points += 1
  loser.losses++

// Sort standings
sort by:
  1. points (descending)
  2. wins (descending)
  3. losses (ascending)
```

## Database Schema

### Match Model
```prisma
model Match {
  id             String     @id @default(uuid())
  tournamentId   String
  categoryId     String
  matchIndex     Int?       // Index-based position
  round          Int        // Round number
  matchNumber    Int        // Display number
  stage          String?    // 'GROUP' or 'KNOCKOUT'
  groupIndex     Int?       // Group number
  groupName      String?    // Group letter (A, B, C)
  slot1Index     Int?       // Slot index for player 1
  slot2Index     Int?       // Slot index for player 2
  player1Id      String?
  player2Id      String?
  player1Seed    Int?
  player2Seed    Int?
  winnerId       String?
  status         String     // PENDING, READY, IN_PROGRESS, COMPLETED
  scoreJson      String?
  completedAt    DateTime?
}
```

## Testing

### Run All Tests
```bash
# Knockout progression
node backend/src/services/draw-engine/test-progression.js

# Round robin and hybrid
node backend/src/services/draw-engine/test-round-robin.js

# Draw engine
node backend/src/services/draw-engine/test-draw-engine.js
```

## Documentation Files

- **COMPLETE_SYSTEM_GUIDE.md** - This file (overview of all formats)
- **KNOCKOUT_PROGRESSION_GUIDE.md** - Detailed knockout logic
- **ROUND_ROBIN_GUIDE.md** - Round robin and hybrid details
- **ORGANIZER_WORKFLOW_GUIDE.md** - Frontend integration examples
- **DRAW_SYSTEM_FINAL.md** - Implementation summary
- **DRAW_SYSTEM_V2_COMPLETE.md** - API reference

## Installation

### 1. Run Migration
```bash
cd backend
npx prisma migrate dev --name add_draw_engine_v2_fields
```

### 2. Add Routes
In `backend/src/app.js`:
```javascript
import drawV2Routes from './routes/draw-v2.routes.js';
app.use('/api/v2', drawV2Routes);
```

### 3. Start Server
```bash
npm run dev
```

## Key Benefits

✅ **Three Formats** - Knockout, Round Robin, Hybrid
✅ **Stable Structure** - Matches never regenerate
✅ **Automatic Progression** - Winners advance, standings update
✅ **Index-Based Logic** - No complex relationships
✅ **BYE Support** - Automatic advancement
✅ **Reset Support** - Clean downstream clearing
✅ **Flexible Configuration** - Any size, any groups
✅ **Clear Status Flow** - Four distinct states
✅ **Easy to Debug** - Simple, predictable behavior

## Status

✅ **Production Ready**

All three formats are fully implemented and tested:
- Knockout with index-based progression
- Round Robin with automatic standings
- Hybrid with knockout arrangement
- Complete API endpoints
- Comprehensive documentation
- Test files included

## Support

For questions:
1. Check format-specific guides
2. Run test files
3. Review code comments
4. Contact development team
