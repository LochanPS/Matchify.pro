# Draw Engine V2 - Clean Tournament Draw System

A complete rebuild of the tournament draw system with clean architecture, index-based progression, and support for three tournament formats.

## Architecture Overview

```
DrawService (Orchestrator)
    ├── DrawEngine (Core Logic)
    ├── MatchGenerator (Database Operations)
    └── PlayerSeeder (Player Ranking)
```

## Supported Formats

### 1. KNOCKOUT (Single Elimination)
- Pure knockout bracket
- Automatic bye handling for non-power-of-2 player counts
- Top seeds receive byes
- Winner advances automatically to next round

### 2. ROUND_ROBIN (Group Stage)
- Players divided into groups
- Everyone plays everyone in their group
- Supports custom group sizes
- Standings calculated automatically

### 3. ROUND_ROBIN_KNOCKOUT (Hybrid)
- Group stage first (round robin)
- Top N players from each group advance
- Knockout stage follows
- Organizer selects advancing players

## Key Features

### Index-Based Progression
- No parent-child relationships
- Pure index-based match advancement
- Predictable and debuggable
- Easy to maintain

### Stable Match Generation
- Matches created once and never regenerated
- Player assignments can be updated
- Match structure remains stable

### Clear Player Progression
- Automatic winner advancement in knockout
- Group standings for round robin
- Manual selection for hybrid format

### Seeding System
- Based on player statistics
- Considers: total points, win rate, tournament participation
- Guest players get default seed

## API Endpoints

### Create Draw
```
POST /api/v2/tournaments/:tournamentId/categories/:categoryId/draw
Body: {
  format: "KNOCKOUT" | "ROUND_ROBIN" | "ROUND_ROBIN_KNOCKOUT",
  options: {
    numberOfGroups: 4,           // For ROUND_ROBIN formats
    advancePerGroup: 2,          // For ROUND_ROBIN_KNOCKOUT
    customGroupSizes: [4, 4, 3]  // Optional custom sizes
  }
}
```

### Get Draw
```
GET /api/v2/tournaments/:tournamentId/categories/:categoryId/draw
```

### Delete Draw
```
DELETE /api/v2/tournaments/:tournamentId/categories/:categoryId/draw
```

### Complete Match
```
POST /api/v2/matches/:matchId/complete
Body: {
  winnerId: "player-uuid",
  scoreJson: { /* score data */ }
}
```

### Continue to Knockout (Hybrid Format)
```
POST /api/v2/tournaments/:tournamentId/categories/:categoryId/continue-knockout
Body: {
  qualifiedPlayerIds: ["player1-id", "player2-id", ...]
}
```

### Get Group Standings
```
GET /api/v2/tournaments/:tournamentId/categories/:categoryId/groups/:groupIndex/standings
```

### Shuffle Players
```
POST /api/v2/tournaments/:tournamentId/categories/:categoryId/shuffle
```

### Get Matches
```
GET /api/v2/tournaments/:tournamentId/categories/:categoryId/matches?stage=KNOCKOUT&round=1
```

## Database Schema

### Match Model Fields
- `matchIndex`: Index-based position (used for progression)
- `round`: Round number (Finals=1, SF=2, QF=3, etc.)
- `matchNumber`: Display number within round
- `stage`: 'GROUP' or 'KNOCKOUT'
- `groupIndex`: Group number (for round robin)
- `groupName`: Group letter (A, B, C, etc.)
- `player1Id`, `player2Id`: Player identifiers
- `player1Seed`, `player2Seed`: Seeding positions
- `winnerId`: Winner identifier
- `status`: 'PENDING', 'READY', 'COMPLETED', 'BYE'

### Draw Model
- `format`: Tournament format
- `bracketJson`: Complete draw structure (JSON)

## Usage Examples

### Example 1: Create Knockout Draw
```javascript
const result = await DrawService.createDraw(
  tournamentId,
  categoryId,
  'KNOCKOUT',
  {} // No options needed
);
```

### Example 2: Create Round Robin Draw
```javascript
const result = await DrawService.createDraw(
  tournamentId,
  categoryId,
  'ROUND_ROBIN',
  {
    numberOfGroups: 4,
    customGroupSizes: [4, 4, 4, 3] // Optional
  }
);
```

### Example 3: Create Hybrid Draw
```javascript
const result = await DrawService.createDraw(
  tournamentId,
  categoryId,
  'ROUND_ROBIN_KNOCKOUT',
  {
    numberOfGroups: 4,
    advancePerGroup: 2 // Top 2 from each group
  }
);
```

### Example 4: Complete Match and Advance Winner
```javascript
const match = await DrawService.completeMatch(
  matchId,
  winnerId,
  { set1: '21-15', set2: '21-18' }
);
// Winner automatically advances to next round
```

### Example 5: Continue to Knockout Stage
```javascript
// After group stage completes
const standings = await DrawService.getGroupStandings(
  tournamentId,
  categoryId,
  0 // Group A
);

// Select top 2 players
const qualifiedIds = standings.slice(0, 2).map(s => s.playerId);

// Populate knockout stage
await DrawService.continueToKnockout(
  tournamentId,
  categoryId,
  qualifiedIds
);
```

## Match Progression Logic

### Knockout Format
1. Match completes with winner
2. System calculates next match index
3. Winner placed in next match (player1 or player2)
4. Next match status updated to 'READY' when both players present

### Round Robin Format
1. Match completes with winner
2. Group standings updated
3. No automatic progression (manual selection for knockout)

### Hybrid Format
1. Group stage: Same as round robin
2. After all groups complete: Organizer selects advancing players
3. Knockout stage: Same as knockout format

## Index Calculation

### Next Match Index Formula
```javascript
// For knockout matches
const matchesInCurrentRound = Math.pow(2, currentRound - 1);
const matchesBeforeCurrentRound = Math.pow(2, currentRound) - 2;
const positionInRound = currentMatchIndex - matchesBeforeCurrentRound;
const nextRoundStartIndex = matchesBeforeCurrentRound + matchesInCurrentRound;
const nextMatchIndex = nextRoundStartIndex + Math.floor(positionInRound / 2);
```

### Winner Position Formula
```javascript
// Determines if winner goes to player1 or player2 slot
const position = (matchIndex % 2 === 0) ? 1 : 2;
```

## Migration from Old System

### Step 1: Run Database Migration
```bash
npx prisma migrate dev --name add_match_index_fields
```

### Step 2: Update Routes
```javascript
// In your main app.js or routes file
import drawV2Routes from './routes/draw-v2.routes.js';
app.use('/api/v2', drawV2Routes);
```

### Step 3: Test with New Endpoints
Use `/api/v2/` prefix for all new draw operations

### Step 4: Gradual Migration
- Keep old system running
- Test new system thoroughly
- Migrate tournaments one by one
- Remove old system when confident

## Debugging

### Check Match Structure
```javascript
const { matches } = await DrawService.getDraw(tournamentId, categoryId);
console.log(matches.map(m => ({
  index: m.matchIndex,
  round: m.round,
  stage: m.stage,
  status: m.status
})));
```

### Verify Progression
```javascript
// After completing a match
const allMatches = await prisma.match.findMany({
  where: { tournamentId, categoryId },
  orderBy: { matchIndex: 'asc' }
});

// Check if winner advanced
const nextMatch = allMatches.find(m => 
  m.player1Id === winnerId || m.player2Id === winnerId
);
```

## Testing

### Unit Tests
```bash
npm test -- draw-engine
```

### Integration Tests
```bash
npm test -- draw-integration
```

### Manual Testing Checklist
- [ ] Create knockout draw with 8 players
- [ ] Create knockout draw with 7 players (byes)
- [ ] Complete matches and verify advancement
- [ ] Create round robin with 4 groups
- [ ] Complete group matches and check standings
- [ ] Create hybrid format
- [ ] Complete group stage
- [ ] Select advancing players
- [ ] Complete knockout stage
- [ ] Shuffle players before tournament
- [ ] Delete and recreate draw

## Performance Considerations

- Bulk match creation using `createMany`
- Index-based queries (no recursive lookups)
- Minimal database updates per match completion
- Efficient group standings calculation

## Future Enhancements

- [ ] Double elimination support
- [ ] Swiss system format
- [ ] Automatic scheduling
- [ ] Court assignment optimization
- [ ] Real-time bracket updates
- [ ] Match time predictions
- [ ] Player availability tracking

## Support

For issues or questions:
1. Check this documentation
2. Review code comments in DrawEngine.js
3. Check existing matches in database
4. Contact development team
