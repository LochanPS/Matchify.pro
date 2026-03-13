# Match Lifecycle Management Guide

## Overview

The match lifecycle system integrates with the draw engine to manage matches during live tournaments. It handles umpire assignment, match start, scoring, completion, and reset.

## Match Lifecycle States

```
PENDING → READY → IN_PROGRESS → COMPLETED
```

### State Definitions

**PENDING**
- Match exists but missing one or both players
- Cannot start until both players assigned
- No umpire required yet

**READY**
- Both players assigned
- Match ready to start
- Umpire can be assigned (optional)
- Can transition to IN_PROGRESS

**IN_PROGRESS**
- Match has started
- Umpire assigned and scoring
- Score updates allowed
- Can only transition to COMPLETED

**COMPLETED**
- Match finished
- Winner recorded
- Final score stored
- Triggers progression (knockout) or standings update (group)

## Match Fields

### Core Fields
- `id` - Match UUID
- `tournamentId` - Tournament reference
- `categoryId` - Category reference
- `matchIndex` - Index-based position
- `round` - Round number
- `matchNumber` - Display number
- `stage` - 'GROUP' or 'KNOCKOUT'

### Player Fields
- `player1Id` - First player
- `player2Id` - Second player
- `player1Seed` - First player seed
- `player2Seed` - Second player seed

### Match Management Fields
- `umpireId` - Assigned umpire
- `courtNumber` - Court assignment
- `status` - Current state
- `winnerId` - Winner (after completion)
- `scoreJson` - Match score

### Timestamps
- `startedAt` - When match started
- `completedAt` - When match completed
- `createdAt` - When match created
- `updatedAt` - Last update

## API Reference

### Assign Umpire

```http
POST /api/v2/matches/:matchId/assign-umpire
Authorization: Bearer {token}
Content-Type: application/json

{
  "umpireId": "umpire-uuid"
}
```

**Validations:**
- Match must be READY
- Umpire cannot be a player in the match
- Only organizer can assign

**Response:**
```json
{
  "success": true,
  "message": "Umpire assigned successfully",
  "data": {
    "match": {
      "id": "match-uuid",
      "umpireId": "umpire-uuid",
      "status": "READY"
    }
  }
}
```

### Start Match

```http
POST /api/v2/matches/:matchId/start
Authorization: Bearer {token}
Content-Type: application/json

{
  "umpireId": "umpire-uuid"
}
```

**Validations:**
- Match must be READY
- Both players must be assigned
- Umpire cannot be a player in the match
- Only organizer or assigned umpire can start

**Response:**
```json
{
  "success": true,
  "message": "Match started successfully",
  "data": {
    "match": {
      "id": "match-uuid",
      "umpireId": "umpire-uuid",
      "status": "IN_PROGRESS",
      "startedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### Update Score

```http
POST /api/v2/matches/:matchId/update-score
Authorization: Bearer {token}
Content-Type: application/json

{
  "scoreJson": {
    "set1": "21-18",
    "set2": "19-21",
    "set3": "21-17"
  }
}
```

**Validations:**
- Match must be IN_PROGRESS
- Only organizer or assigned umpire can update

**Response:**
```json
{
  "success": true,
  "message": "Score updated successfully",
  "data": {
    "match": {
      "id": "match-uuid",
      "scoreJson": "{\"set1\":\"21-18\",\"set2\":\"19-21\",\"set3\":\"21-17\"}"
    }
  }
}
```

### Complete Match

```http
POST /api/v2/matches/:matchId/complete
Authorization: Bearer {token}
Content-Type: application/json

{
  "winnerId": "player-uuid",
  "scoreJson": {
    "set1": "21-18",
    "set2": "21-15"
  }
}
```

**Validations:**
- Match must be IN_PROGRESS
- Winner must be one of the players
- Only organizer or assigned umpire can complete

**Response:**
```json
{
  "success": true,
  "message": "Match completed successfully",
  "data": {
    "match": {
      "id": "match-uuid",
      "winnerId": "player-uuid",
      "status": "COMPLETED",
      "completedAt": "2024-01-15T11:15:00Z"
    }
  }
}
```

**Side Effects:**
- If KNOCKOUT: Winner advances to next round automatically
- If GROUP: Standings update automatically

### Reset Match

```http
POST /api/v2/matches/:matchId/reset
Authorization: Bearer {token}
```

**Validations:**
- Only organizer can reset

**Response:**
```json
{
  "success": true,
  "message": "Match reset successfully",
  "data": {
    "match": {
      "id": "match-uuid",
      "winnerId": null,
      "scoreJson": null,
      "status": "READY",
      "completedAt": null
    }
  }
}
```

**Side Effects:**
- If KNOCKOUT: Downstream matches cleared
- Score and winner cleared
- Status reverts to READY (or PENDING if players missing)

### Assign Court

```http
POST /api/v2/matches/:matchId/assign-court
Authorization: Bearer {token}
Content-Type: application/json

{
  "courtNumber": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Court assigned successfully",
  "data": {
    "match": {
      "id": "match-uuid",
      "courtNumber": 1
    }
  }
}
```

### Get Match Details

```http
GET /api/v2/matches/:matchId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "match": {
      "id": "match-uuid",
      "matchNumber": 1,
      "round": 3,
      "stage": "KNOCKOUT",
      "status": "IN_PROGRESS",
      "courtNumber": 1,
      "player1": {
        "id": "player1-uuid",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "player2": {
        "id": "player2-uuid",
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "umpire": {
        "id": "umpire-uuid",
        "name": "Umpire Name",
        "email": "umpire@example.com"
      },
      "scoreJson": {
        "set1": "21-18",
        "set2": "15-10"
      },
      "startedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### Get Matches with Filters

```http
GET /api/v2/tournaments/:tournamentId/categories/:categoryId/matches?stage=KNOCKOUT&status=READY&round=1
```

**Query Parameters:**
- `stage` - Filter by stage (GROUP or KNOCKOUT)
- `round` - Filter by round number
- `status` - Filter by status (PENDING, READY, IN_PROGRESS, COMPLETED)
- `groupIndex` - Filter by group index
- `courtNumber` - Filter by court number

**Response:**
```json
{
  "success": true,
  "data": {
    "matches": [...],
    "count": 4
  }
}
```

### Get Available Umpires

```http
GET /api/v2/tournaments/:tournamentId/umpires
```

**Response:**
```json
{
  "success": true,
  "data": {
    "umpires": [
      {
        "id": "umpire-uuid",
        "name": "Umpire Name",
        "email": "umpire@example.com",
        "umpireCode": "#UMP1234"
      }
    ],
    "count": 5
  }
}
```

## Complete Workflow Examples

### Example 1: Organizer Manages Match

```javascript
// 1. Get match details
const matchRes = await fetch('/api/v2/matches/match-uuid');
const { match } = await matchRes.json();

// 2. Assign umpire
await fetch('/api/v2/matches/match-uuid/assign-umpire', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    umpireId: 'umpire-uuid'
  })
});

// 3. Assign court
await fetch('/api/v2/matches/match-uuid/assign-court', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    courtNumber: 1
  })
});

// 4. Start match
await fetch('/api/v2/matches/match-uuid/start', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    umpireId: 'umpire-uuid'
  })
});
```

### Example 2: Umpire Scores Match

```javascript
// 1. Start match (if not already started)
await fetch('/api/v2/matches/match-uuid/start', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer umpire-token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    umpireId: 'my-umpire-id'
  })
});

// 2. Update score during play
await fetch('/api/v2/matches/match-uuid/update-score', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer umpire-token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    scoreJson: {
      set1: '21-18',
      set2: '15-10' // In progress
    }
  })
});

// 3. Complete match
await fetch('/api/v2/matches/match-uuid/complete', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer umpire-token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    winnerId: 'player1-uuid',
    scoreJson: {
      set1: '21-18',
      set2: '21-15'
    }
  })
});
// Winner automatically advances if knockout
```

### Example 3: Display Live Matches

```javascript
// Get all IN_PROGRESS matches
const response = await fetch(
  '/api/v2/tournaments/t123/categories/c456/matches?status=IN_PROGRESS'
);
const { matches } = await response.json();

// Display on scoreboard
matches.forEach(match => {
  console.log(`Court ${match.courtNumber}: Match ${match.matchNumber}`);
  console.log(`  ${match.player1Id} vs ${match.player2Id}`);
  console.log(`  Score: ${match.scoreJson}`);
});
```

### Example 4: Reset Match After Error

```javascript
// Organizer resets match
await fetch('/api/v2/matches/match-uuid/reset', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer organizer-token'
  }
});

// Match reverts to READY
// Score and winner cleared
// If knockout, downstream matches also cleared
```

## Frontend Integration

### Match Management Component

```jsx
function MatchManagement({ matchId }) {
  const [match, setMatch] = useState(null);
  const [umpires, setUmpires] = useState([]);

  useEffect(() => {
    loadMatch();
    loadUmpires();
  }, [matchId]);

  const loadMatch = async () => {
    const res = await fetch(`/api/v2/matches/${matchId}`);
    const data = await res.json();
    setMatch(data.data.match);
  };

  const loadUmpires = async () => {
    const res = await fetch(`/api/v2/tournaments/${tournamentId}/umpires`);
    const data = await res.json();
    setUmpires(data.data.umpires);
  };

  const handleAssignUmpire = async (umpireId) => {
    await fetch(`/api/v2/matches/${matchId}/assign-umpire`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ umpireId })
    });
    loadMatch();
  };

  const handleStartMatch = async () => {
    await fetch(`/api/v2/matches/${matchId}/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ umpireId: match.umpireId })
    });
    loadMatch();
  };

  return (
    <div>
      <h2>Match {match?.matchNumber}</h2>
      <p>Status: {match?.status}</p>
      
      {match?.status === 'READY' && (
        <>
          <select onChange={e => handleAssignUmpire(e.target.value)}>
            <option>Select Umpire</option>
            {umpires.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          
          {match.umpireId && (
            <button onClick={handleStartMatch}>Start Match</button>
          )}
        </>
      )}
    </div>
  );
}
```

### Live Scoreboard

```jsx
function LiveScoreboard({ tournamentId, categoryId }) {
  const [liveMatches, setLiveMatches] = useState([]);

  useEffect(() => {
    const interval = setInterval(loadLiveMatches, 5000); // Refresh every 5s
    loadLiveMatches();
    return () => clearInterval(interval);
  }, []);

  const loadLiveMatches = async () => {
    const res = await fetch(
      `/api/v2/tournaments/${tournamentId}/categories/${categoryId}/matches?status=IN_PROGRESS`
    );
    const data = await res.json();
    setLiveMatches(data.data.matches);
  };

  return (
    <div>
      <h2>Live Matches</h2>
      {liveMatches.map(match => (
        <div key={match.id}>
          <h3>Court {match.courtNumber} - Match {match.matchNumber}</h3>
          <p>{match.player1Id} vs {match.player2Id}</p>
          <p>Score: {JSON.parse(match.scoreJson || '{}')}</p>
        </div>
      ))}
    </div>
  );
}
```

## Validation Rules

### Umpire Assignment
✅ Match must be READY
✅ Umpire cannot be a player in the match
✅ Only organizer can assign

### Match Start
✅ Match must be READY
✅ Both players must be assigned
✅ Umpire must be assigned
✅ Umpire cannot be a player
✅ Only organizer or assigned umpire can start

### Score Update
✅ Match must be IN_PROGRESS
✅ Only organizer or assigned umpire can update

### Match Completion
✅ Match must be IN_PROGRESS
✅ Winner must be one of the players
✅ Final score required
✅ Only organizer or assigned umpire can complete

### Match Reset
✅ Only organizer can reset
✅ Clears downstream progression if knockout

## Key Benefits

✅ **Clear Lifecycle** - Four distinct states
✅ **Validation** - Prevents invalid state transitions
✅ **Automatic Progression** - Winners advance automatically
✅ **Flexible Scoring** - Supports any score format
✅ **Reset Support** - Can undo mistakes
✅ **Court Management** - Track match locations
✅ **Umpire Tracking** - Know who officiated each match
✅ **Timestamps** - Full audit trail

## Troubleshooting

### Issue: Cannot start match
**Check:**
- Match status is READY
- Both players assigned
- Umpire assigned
- Umpire is not a player

### Issue: Cannot complete match
**Check:**
- Match status is IN_PROGRESS
- Winner is one of the players
- Score provided

### Issue: Winner not advancing
**Check:**
- Match stage is KNOCKOUT
- Match completed successfully
- Next match exists

## Summary

The match lifecycle system provides complete match management:
- Umpire assignment and validation
- Match start with timestamps
- Live score updates
- Match completion with progression
- Reset capability
- Court assignment
- Full audit trail

All integrated with the draw engine for automatic progression and standings updates.
