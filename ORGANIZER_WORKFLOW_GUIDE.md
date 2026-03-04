# Organizer Workflow Guide - Draw System V2

## Complete Workflow

The new draw system follows a clear two-step process that matches the organizer's natural workflow.

### Step 1: Create Draw Structure

Organizer clicks "Create Draw" and specifies:
- Tournament format (Knockout, Round Robin, or Hybrid)
- Bracket size (number of slots)
- Additional options (groups, advancement rules, etc.)

**Result**: Empty draw structure is created with all matches, but NO players assigned yet.

### Step 2: Assign Players

Organizer has three options to assign players:
1. **Manual Placement** - Drag and drop players into specific slots
2. **Auto Add All** - Automatically assign all confirmed players by seed
3. **Shuffle Players** - Randomly shuffle assigned players

**Result**: Player slots in matches are updated, matches become "READY" when both players are assigned.

## Match Status Flow

```
PENDING → READY → IN_PROGRESS → COMPLETED
```

- **PENDING**: Match exists but missing one or both players
- **READY**: Both players assigned, match can start
- **IN_PROGRESS**: Match has started (umpire scoring)
- **COMPLETED**: Match finished with winner

## API Workflow

### 1. Create Empty Draw

```http
POST /api/v2/tournaments/:tournamentId/categories/:categoryId/draw
Authorization: Bearer {token}
Content-Type: application/json

{
  "format": "KNOCKOUT",
  "bracketSize": 16,
  "options": {}
}
```

**Response**:
```json
{
  "success": true,
  "message": "Draw structure created successfully. Now assign players.",
  "data": {
    "draw": {
      "id": "draw-uuid",
      "format": "KNOCKOUT",
      "bracketJson": "..."
    },
    "structure": {
      "format": "KNOCKOUT",
      "bracketSize": 16,
      "totalRounds": 4,
      "totalSlots": 16,
      "matches": [
        {
          "matchIndex": 0,
          "round": 4,
          "matchNumber": 1,
          "stage": "KNOCKOUT",
          "player1Id": null,
          "player2Id": null,
          "status": "PENDING"
        }
        // ... more matches
      ]
    }
  }
}
```

### 2. Get Confirmed Players

```http
GET /api/v2/tournaments/:tournamentId/categories/:categoryId/confirmed-players
Authorization: Bearer {token}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "players": [
      {
        "id": "player-uuid",
        "name": "John Doe",
        "email": "john@example.com",
        "seed": 1,
        "seedScore": 1250
      }
      // ... more players
    ],
    "count": 16
  }
}
```

### 3a. Manual Player Assignment

```http
POST /api/v2/tournaments/:tournamentId/categories/:categoryId/assign-players
Authorization: Bearer {token}
Content-Type: application/json

{
  "playerAssignments": [
    {
      "slotIndex": 0,
      "playerId": "player-uuid-1",
      "seed": 1
    },
    {
      "slotIndex": 1,
      "playerId": "player-uuid-2",
      "seed": 2
    }
    // ... more assignments
  ]
}
```

### 3b. Auto-Assign All Players

```http
POST /api/v2/tournaments/:tournamentId/categories/:categoryId/auto-assign-players
Authorization: Bearer {token}
```

This automatically assigns all confirmed players by seed order.

### 3c. Shuffle Players

```http
POST /api/v2/tournaments/:tournamentId/categories/:categoryId/shuffle
Authorization: Bearer {token}
```

This randomly shuffles already-assigned players.

## Format-Specific Workflows

### Knockout Tournament

```javascript
// 1. Create draw
const drawResponse = await fetch('/api/v2/tournaments/t123/categories/c456/draw', {
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

// 3. Matches are now READY to start
```

### Round Robin Tournament

```javascript
// 1. Create draw with 4 groups
const drawResponse = await fetch('/api/v2/tournaments/t123/categories/c456/draw', {
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
      // Each group will have 4 players
    }
  })
});

// 2. Auto-assign players
await fetch('/api/v2/tournaments/t123/categories/c456/auto-assign-players', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer token' }
});

// 3. Group matches are now READY
```

### Hybrid Tournament (Round Robin + Knockout)

```javascript
// 1. Create draw
const drawResponse = await fetch('/api/v2/tournaments/t123/categories/c456/draw', {
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
      advancePerGroup: 2  // Top 2 from each group = 8 in knockout
    }
  })
});

// 2. Auto-assign players to groups
await fetch('/api/v2/tournaments/t123/categories/c456/auto-assign-players', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer token' }
});

// 3. Group stage matches are READY
// 4. After group stage completes, continue to knockout
// (See "Continue to Knockout" section below)
```

## Frontend Implementation Guide

### Create Draw UI

```jsx
function CreateDrawModal({ tournamentId, categoryId }) {
  const [format, setFormat] = useState('KNOCKOUT');
  const [bracketSize, setBracketSize] = useState(16);
  const [numberOfGroups, setNumberOfGroups] = useState(4);
  const [advancePerGroup, setAdvancePerGroup] = useState(2);

  const handleCreateDraw = async () => {
    const options = {};
    
    if (format === 'ROUND_ROBIN' || format === 'ROUND_ROBIN_KNOCKOUT') {
      options.numberOfGroups = numberOfGroups;
    }
    
    if (format === 'ROUND_ROBIN_KNOCKOUT') {
      options.advancePerGroup = advancePerGroup;
    }

    const response = await fetch(
      `/api/v2/tournaments/${tournamentId}/categories/${categoryId}/draw`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          format,
          bracketSize,
          options
        })
      }
    );

    const data = await response.json();
    
    if (data.success) {
      // Show success message
      alert('Draw created! Now assign players.');
      // Navigate to player assignment
      navigateToAssignPlayers();
    }
  };

  return (
    <div>
      <h2>Create Draw</h2>
      
      <select value={format} onChange={e => setFormat(e.target.value)}>
        <option value="KNOCKOUT">Knockout</option>
        <option value="ROUND_ROBIN">Round Robin</option>
        <option value="ROUND_ROBIN_KNOCKOUT">Round Robin + Knockout</option>
      </select>

      <input
        type="number"
        value={bracketSize}
        onChange={e => setBracketSize(parseInt(e.target.value))}
        placeholder="Bracket Size"
      />

      {(format === 'ROUND_ROBIN' || format === 'ROUND_ROBIN_KNOCKOUT') && (
        <input
          type="number"
          value={numberOfGroups}
          onChange={e => setNumberOfGroups(parseInt(e.target.value))}
          placeholder="Number of Groups"
        />
      )}

      {format === 'ROUND_ROBIN_KNOCKOUT' && (
        <input
          type="number"
          value={advancePerGroup}
          onChange={e => setAdvancePerGroup(parseInt(e.target.value))}
          placeholder="Advance Per Group"
        />
      )}

      <button onClick={handleCreateDraw}>Create Draw</button>
    </div>
  );
}
```

### Assign Players UI

```jsx
function AssignPlayersPage({ tournamentId, categoryId }) {
  const [confirmedPlayers, setConfirmedPlayers] = useState([]);
  const [draw, setDraw] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Get confirmed players
    const playersRes = await fetch(
      `/api/v2/tournaments/${tournamentId}/categories/${categoryId}/confirmed-players`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const playersData = await playersRes.json();
    setConfirmedPlayers(playersData.data.players);

    // Get draw
    const drawRes = await fetch(
      `/api/v2/tournaments/${tournamentId}/categories/${categoryId}/draw`
    );
    const drawData = await drawRes.json();
    setDraw(drawData.data);
  };

  const handleAutoAssign = async () => {
    const response = await fetch(
      `/api/v2/tournaments/${tournamentId}/categories/${categoryId}/auto-assign-players`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    if (response.ok) {
      alert('Players assigned automatically!');
      loadData(); // Reload to show assignments
    }
  };

  const handleShuffle = async () => {
    const response = await fetch(
      `/api/v2/tournaments/${tournamentId}/categories/${categoryId}/shuffle`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    if (response.ok) {
      alert('Players shuffled!');
      loadData();
    }
  };

  const handleManualAssign = async (slotIndex, playerId) => {
    // Build assignments array
    const assignments = [{ slotIndex, playerId, seed: slotIndex + 1 }];

    const response = await fetch(
      `/api/v2/tournaments/${tournamentId}/categories/${categoryId}/assign-players`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ playerAssignments: assignments })
      }
    );

    if (response.ok) {
      loadData();
    }
  };

  return (
    <div>
      <h2>Assign Players</h2>
      
      <div>
        <button onClick={handleAutoAssign}>Auto Add All Players</button>
        <button onClick={handleShuffle}>Shuffle Players</button>
      </div>

      <div>
        <h3>Available Players ({confirmedPlayers.length})</h3>
        {confirmedPlayers.map(player => (
          <div key={player.id}>
            {player.name} (Seed: {player.seed})
          </div>
        ))}
      </div>

      <div>
        <h3>Draw Slots</h3>
        {draw?.matches
          .filter(m => m.round === Math.max(...draw.matches.map(m => m.round)))
          .map((match, index) => (
            <div key={match.matchIndex}>
              <div>Slot {index * 2}: {match.player1Id || 'Empty'}</div>
              <div>Slot {index * 2 + 1}: {match.player2Id || 'Empty'}</div>
              <div>Status: {match.status}</div>
            </div>
          ))}
      </div>
    </div>
  );
}
```

## Match Status Management

### When Match Becomes READY

A match automatically becomes READY when:
1. Both player1Id and player2Id are assigned
2. Status is updated from PENDING to READY

```javascript
// This happens automatically in the backend
if (player1 && player2) {
  updateData.status = 'READY';
} else {
  updateData.status = 'PENDING';
}
```

### Starting a Match

```javascript
// Umpire starts match
await fetch(`/api/v2/matches/${matchId}/start`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});
// Status: READY → IN_PROGRESS
```

### Completing a Match

```javascript
// Umpire completes match
await fetch(`/api/v2/matches/${matchId}/complete`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    winnerId: 'player-uuid',
    scoreJson: {
      set1: '21-15',
      set2: '21-18'
    }
  })
});
// Status: IN_PROGRESS → COMPLETED
// Winner automatically advances to next round (knockout only)
```

## Key Benefits

✅ **Clear Separation**: Draw creation and player assignment are separate steps
✅ **Flexible Assignment**: Manual, auto, or shuffle options
✅ **Stable Matches**: Matches never regenerate, only player slots update
✅ **Status Management**: Clear status flow (pending → ready → in_progress → completed)
✅ **No Regeneration**: Match structure remains stable throughout tournament

## Troubleshooting

### Issue: Matches stuck in PENDING
**Solution**: Assign both players to the match

### Issue: Can't start match
**Solution**: Ensure match status is READY (both players assigned)

### Issue: Winner not advancing
**Solution**: Check match completion API call includes winnerId

## Next Steps

1. Implement frontend UI for create draw
2. Implement frontend UI for assign players
3. Add drag-and-drop for manual assignment
4. Add visual feedback for match statuses
5. Test all three tournament formats
