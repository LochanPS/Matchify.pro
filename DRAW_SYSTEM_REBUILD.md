# Draw System Rebuild - Complete Guide

## Overview

The draw system has been completely rebuilt from scratch with a clean, maintainable architecture. The new system supports three tournament formats with stable match generation and index-based progression.

## What Changed

### Old System Issues
- Complex parent-child relationships
- Unstable match generation
- Difficult to debug
- Mixed logic across multiple files
- Inconsistent match advancement

### New System Benefits
- ✅ Clean separation of concerns
- ✅ Index-based progression (no parent-child)
- ✅ Stable match generation
- ✅ Easy to maintain and debug
- ✅ Consistent API
- ✅ Better error handling

## Architecture

```
backend/src/services/draw-engine/
├── DrawEngine.js       # Core draw generation logic
├── MatchGenerator.js   # Database operations
├── PlayerSeeder.js     # Player seeding/ranking
├── DrawService.js      # Main orchestrator
└── README.md          # Detailed documentation
```

## Three Tournament Formats

### 1. KNOCKOUT
Pure single elimination bracket with automatic bye handling.

**Use Case**: Standard tournament, fastest format

**Features**:
- Automatic bracket sizing (power of 2)
- Top seeds get byes
- Winner advances automatically

### 2. ROUND_ROBIN
Group stage where everyone plays everyone in their group.

**Use Case**: League format, ensures all players get multiple matches

**Features**:
- Configurable number of groups
- Custom group sizes
- Automatic standings calculation

### 3. ROUND_ROBIN_KNOCKOUT
Hybrid format with group stage followed by knockout.

**Use Case**: Professional tournaments, combines fairness with excitement

**Features**:
- Group stage first
- Organizer selects advancing players
- Knockout stage follows

## Installation Steps

### Step 1: Database Migration

```bash
cd backend
npx prisma migrate dev --name add_draw_engine_v2_fields
```

This adds:
- `matchIndex` field to Match model
- `groupIndex` field to Match model
- `groupName` field to Match model
- Indexes for performance

### Step 2: Update Server Routes

Add to your `backend/src/app.js` or main server file:

```javascript
import drawV2Routes from './routes/draw-v2.routes.js';

// Add this line with your other routes
app.use('/api/v2', drawV2Routes);
```

### Step 3: Test the System

```bash
# Start your server
npm run dev

# Test with curl or Postman
curl -X POST http://localhost:5000/api/v2/tournaments/{tournamentId}/categories/{categoryId}/draw \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "format": "KNOCKOUT",
    "options": {}
  }'
```

## API Reference

### Base URL
All new endpoints use `/api/v2` prefix

### Create Draw
```http
POST /api/v2/tournaments/:tournamentId/categories/:categoryId/draw
Authorization: Bearer {token}
Content-Type: application/json

{
  "format": "KNOCKOUT" | "ROUND_ROBIN" | "ROUND_ROBIN_KNOCKOUT",
  "options": {
    "numberOfGroups": 4,           // For ROUND_ROBIN formats
    "advancePerGroup": 2,          // For ROUND_ROBIN_KNOCKOUT
    "customGroupSizes": [4, 4, 3]  // Optional
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Draw created successfully",
  "data": {
    "draw": { /* Draw record */ },
    "structure": { /* Complete bracket structure */ }
  }
}
```

### Get Draw
```http
GET /api/v2/tournaments/:tournamentId/categories/:categoryId/draw
```

### Delete Draw
```http
DELETE /api/v2/tournaments/:tournamentId/categories/:categoryId/draw
Authorization: Bearer {token}
```

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

### Continue to Knockout
```http
POST /api/v2/tournaments/:tournamentId/categories/:categoryId/continue-knockout
Authorization: Bearer {token}
Content-Type: application/json

{
  "qualifiedPlayerIds": ["player1-id", "player2-id", ...]
}
```

### Get Group Standings
```http
GET /api/v2/tournaments/:tournamentId/categories/:categoryId/groups/:groupIndex/standings
```

### Shuffle Players
```http
POST /api/v2/tournaments/:tournamentId/categories/:categoryId/shuffle
Authorization: Bearer {token}
```

### Get Matches
```http
GET /api/v2/tournaments/:tournamentId/categories/:categoryId/matches?stage=KNOCKOUT&round=1
```

## Usage Examples

### Example 1: Create 8-Player Knockout Tournament

```javascript
// 1. Create draw
const response = await fetch('/api/v2/tournaments/t123/categories/c456/draw', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    format: 'KNOCKOUT',
    options: {}
  })
});

const { data } = await response.json();
console.log('Draw created:', data.structure);

// 2. Complete first match
await fetch('/api/v2/matches/m789/complete', {
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
// Winner automatically advances to next round
```

### Example 2: Create Round Robin Tournament

```javascript
const response = await fetch('/api/v2/tournaments/t123/categories/c456/draw', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    format: 'ROUND_ROBIN',
    options: {
      numberOfGroups: 4,
      customGroupSizes: [4, 4, 4, 3] // Optional: 4+4+4+3 = 15 players
    }
  })
});

// Get standings for Group A (index 0)
const standings = await fetch(
  '/api/v2/tournaments/t123/categories/c456/groups/0/standings'
);
```

### Example 3: Create Hybrid Tournament

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
    options: {
      numberOfGroups: 4,
      advancePerGroup: 2  // Top 2 from each group = 8 players in knockout
    }
  })
});

// 2. Complete all group matches...

// 3. Get standings and select advancing players
const groupAStandings = await fetch(
  '/api/v2/tournaments/t123/categories/c456/groups/0/standings'
).then(r => r.json());

const groupBStandings = await fetch(
  '/api/v2/tournaments/t123/categories/c456/groups/1/standings'
).then(r => r.json());

// ... get all group standings

// 4. Continue to knockout with top players
const qualifiedIds = [
  ...groupAStandings.data.standings.slice(0, 2).map(s => s.playerId),
  ...groupBStandings.data.standings.slice(0, 2).map(s => s.playerId),
  // ... from all groups
];

await fetch('/api/v2/tournaments/t123/categories/c456/continue-knockout', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    qualifiedPlayerIds: qualifiedIds
  })
});

// 5. Knockout stage is now ready
```

## Migration Strategy

### Option 1: Gradual Migration (Recommended)
1. Keep old system running
2. Use new system for new tournaments
3. Test thoroughly
4. Migrate existing tournaments one by one
5. Remove old system after 100% migration

### Option 2: Immediate Switch
1. Run database migration
2. Update all API calls to use `/api/v2`
3. Test all tournament formats
4. Deploy

## Testing Checklist

Before deploying to production:

- [ ] Create knockout draw with power-of-2 players (8, 16, 32)
- [ ] Create knockout draw with non-power-of-2 players (7, 15, 31)
- [ ] Verify byes are assigned to top seeds
- [ ] Complete matches and verify winner advancement
- [ ] Create round robin with equal group sizes
- [ ] Create round robin with custom group sizes
- [ ] Complete group matches and verify standings
- [ ] Create hybrid format
- [ ] Complete all group matches
- [ ] Select advancing players
- [ ] Verify knockout stage population
- [ ] Complete knockout matches
- [ ] Shuffle players before tournament starts
- [ ] Delete and recreate draw
- [ ] Test with guest players
- [ ] Test with mixed user/guest players

## Troubleshooting

### Issue: Winner not advancing to next match
**Solution**: Check match status and matchIndex values
```javascript
const matches = await prisma.match.findMany({
  where: { tournamentId, categoryId },
  orderBy: { matchIndex: 'asc' }
});
console.log(matches.map(m => ({
  index: m.matchIndex,
  round: m.round,
  player1: m.player1Id,
  player2: m.player2Id,
  winner: m.winnerId
})));
```

### Issue: Group standings not calculating
**Solution**: Verify all matches have stage='GROUP' and groupIndex set
```javascript
const groupMatches = await prisma.match.findMany({
  where: {
    tournamentId,
    categoryId,
    stage: 'GROUP',
    groupIndex: 0
  }
});
console.log('Group A matches:', groupMatches.length);
```

### Issue: Knockout stage not populating
**Solution**: Check qualified player IDs and match structure
```javascript
const knockoutMatches = await prisma.match.findMany({
  where: {
    tournamentId,
    categoryId,
    stage: 'KNOCKOUT'
  },
  orderBy: { round: 'desc' }
});
console.log('Knockout matches:', knockoutMatches.length);
console.log('First round:', knockoutMatches.filter(m => m.round === Math.max(...knockoutMatches.map(m => m.round))));
```

## Performance Notes

- Match creation uses bulk insert (`createMany`)
- Index-based queries are fast (no recursive lookups)
- Group standings calculated on-demand (cached in frontend)
- Minimal database updates per match completion

## Support

For questions or issues:
1. Check the detailed README in `backend/src/services/draw-engine/README.md`
2. Review code comments in DrawEngine.js
3. Test with the provided examples
4. Check database match records

## Future Enhancements

Planned features:
- Double elimination format
- Swiss system format
- Automatic court scheduling
- Match time predictions
- Real-time bracket updates via WebSocket
- Player availability tracking
- Bracket visualization improvements
