# Draw System V2 - Complete Implementation

## What Was Built

A complete draw system rebuild that matches the exact organizer workflow with proper separation between draw creation and player assignment.

## Two-Step Workflow

### Step 1: Create Draw Structure
- Organizer clicks "Create Draw"
- Specifies format, bracket size, and options
- **Empty draw structure created** (no players assigned)
- All matches exist with status = PENDING

### Step 2: Assign Players
- Organizer uses one of three methods:
  1. **Manual Placement** - Assign specific players to specific slots
  2. **Auto Add All** - Automatically assign all confirmed players by seed
  3. **Shuffle Players** - Randomly shuffle assigned players
- Player slots in matches update
- Match status changes to READY when both players assigned

## Match Status Flow

```
PENDING → READY → IN_PROGRESS → COMPLETED
```

- **PENDING**: Match exists, missing one or both players
- **READY**: Both players assigned, can start
- **IN_PROGRESS**: Match started (umpire scoring)
- **COMPLETED**: Match finished with winner

## API Endpoints

### Create Empty Draw
```
POST /api/v2/tournaments/:id/categories/:id/draw
Body: { format, bracketSize, options }
```

### Assign Players
```
POST /api/v2/tournaments/:id/categories/:id/assign-players
Body: { playerAssignments: [{slotIndex, playerId, seed}] }
```

### Auto-Assign All Players
```
POST /api/v2/tournaments/:id/categories/:id/auto-assign-players
```

### Get Confirmed Players
```
GET /api/v2/tournaments/:id/categories/:id/confirmed-players
```

### Shuffle Players
```
POST /api/v2/tournaments/:id/categories/:id/shuffle
```

### Get Draw
```
GET /api/v2/tournaments/:id/categories/:id/draw
```

### Delete Draw
```
DELETE /api/v2/tournaments/:id/categories/:id/draw
```

### Complete Match
```
POST /api/v2/matches/:id/complete
Body: { winnerId, scoreJson }
```

## Database Schema Updates

Added to Match model:
- `matchIndex` - Index-based position
- `groupIndex` - Group number (for round robin)
- `groupName` - Group letter (A, B, C)
- `slot1Index` - Slot index for player 1 (round robin)
- `slot2Index` - Slot index for player 2 (round robin)
- `slotNumber` - Slot number (knockout first round)

## File Structure

```
backend/src/
├── services/draw-engine/
│   ├── DrawEngine.js          # Core logic (generates empty structures)
│   ├── MatchGenerator.js      # Database operations
│   ├── PlayerSeeder.js        # Player seeding
│   ├── DrawService.js         # Main orchestrator
│   └── README.md
├── controllers/
│   └── draw-v2.controller.js  # API controllers
└── routes/
    └── draw-v2.routes.js      # API routes

Documentation:
├── ORGANIZER_WORKFLOW_GUIDE.md  # Complete workflow guide
├── DRAW_SYSTEM_V2_COMPLETE.md   # This file
└── DRAW_SYSTEM_REBUILD.md       # Technical details
```

## Key Changes from V1

| Feature | V1 | V2 |
|---------|----|----|
| Draw Creation | With players | Empty structure |
| Player Assignment | Automatic | Separate step |
| Match Generation | Regenerates | Stable, never regenerates |
| Status Management | Basic | Full flow (4 states) |
| Workflow | Single step | Two steps |

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

### 3. Test
```bash
# Start server
npm run dev

# Test create draw
curl -X POST http://localhost:5000/api/v2/tournaments/{id}/categories/{id}/draw \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"format":"KNOCKOUT","bracketSize":16,"options":{}}'

# Test auto-assign
curl -X POST http://localhost:5000/api/v2/tournaments/{id}/categories/{id}/auto-assign-players \
  -H "Authorization: Bearer TOKEN"
```

## Example Usage

### Knockout Tournament
```javascript
// 1. Create empty draw
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

// 2. Auto-assign all players
await fetch('/api/v2/tournaments/t123/categories/c456/auto-assign-players', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer token' }
});

// 3. Matches are now READY
```

### Round Robin Tournament
```javascript
// 1. Create empty draw with 4 groups
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

// 2. Auto-assign players
await fetch('/api/v2/tournaments/t123/categories/c456/auto-assign-players', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer token' }
});
```

### Manual Assignment
```javascript
// Get confirmed players
const playersRes = await fetch(
  '/api/v2/tournaments/t123/categories/c456/confirmed-players',
  { headers: { 'Authorization': 'Bearer token' } }
);
const { players } = await playersRes.json();

// Manually assign players to specific slots
await fetch('/api/v2/tournaments/t123/categories/c456/assign-players', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    playerAssignments: [
      { slotIndex: 0, playerId: players[0].id, seed: 1 },
      { slotIndex: 1, playerId: players[1].id, seed: 2 },
      { slotIndex: 2, playerId: players[2].id, seed: 3 },
      // ... more assignments
    ]
  })
});
```

## Frontend Integration

### Create Draw Button
```jsx
<button onClick={handleCreateDraw}>
  Create Draw
</button>
```

### Assign Players Section
```jsx
<div>
  <button onClick={handleAutoAssign}>Auto Add All Players</button>
  <button onClick={handleShuffle}>Shuffle Players</button>
  <button onClick={handleManualAssign}>Manual Assignment</button>
</div>
```

### Match Status Display
```jsx
<div className={`match status-${match.status.toLowerCase()}`}>
  <div>Match {match.matchNumber}</div>
  <div>{match.player1Id ? 'Player 1' : 'Empty'}</div>
  <div>vs</div>
  <div>{match.player2Id ? 'Player 2' : 'Empty'}</div>
  <div>Status: {match.status}</div>
</div>
```

## Benefits

✅ **Matches Never Regenerate** - Stable structure throughout tournament
✅ **Clear Workflow** - Two distinct steps (create, then assign)
✅ **Flexible Assignment** - Manual, auto, or shuffle
✅ **Proper Status Management** - Four clear states
✅ **Easy to Debug** - Simple, predictable logic
✅ **Maintainable** - Clean separation of concerns

## Testing Checklist

- [ ] Create knockout draw (16 players)
- [ ] Auto-assign all players
- [ ] Verify matches are READY
- [ ] Create round robin draw (4 groups)
- [ ] Auto-assign players to groups
- [ ] Verify group matches are READY
- [ ] Create hybrid draw
- [ ] Auto-assign to groups
- [ ] Complete group stage
- [ ] Continue to knockout
- [ ] Manual player assignment
- [ ] Shuffle players
- [ ] Complete match and verify winner advances
- [ ] Delete and recreate draw

## Documentation

- **Organizer Workflow**: `ORGANIZER_WORKFLOW_GUIDE.md`
- **Technical Details**: `DRAW_SYSTEM_REBUILD.md`
- **API Reference**: `backend/src/services/draw-engine/README.md`
- **This Summary**: `DRAW_SYSTEM_V2_COMPLETE.md`

## Support

For questions:
1. Check `ORGANIZER_WORKFLOW_GUIDE.md` for workflow details
2. Check `DRAW_SYSTEM_REBUILD.md` for technical details
3. Review code comments in DrawEngine.js
4. Test with provided examples

## Status

✅ **Complete and Ready for Integration**

The draw system is fully implemented and ready to integrate with your existing UI. All that's needed is:
1. Run the database migration
2. Add the routes to your server
3. Update frontend to use the new two-step workflow
