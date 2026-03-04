# Round Robin & Hybrid System Guide

## Overview

The Round Robin and Hybrid (Round Robin + Knockout) systems are fully implemented with automatic standings calculation and stable match generation.

## Round Robin Format

### Match Generation

For each group, every player plays every other player exactly once.

**Example: Group with 4 players (A, B, C, D)**
```
Match 1: A vs B
Match 2: A vs C
Match 3: A vs D
Match 4: B vs C
Match 5: B vs D
Match 6: C vs D

Total matches = n(n-1)/2 where n = number of players
For 4 players: 4(3)/2 = 6 matches
```

### Match Structure

Each match stores:
- `groupIndex` - Group number (0, 1, 2...)
- `groupName` - Group letter (A, B, C...)
- `player1Id` - First player
- `player2Id` - Second player
- `winnerId` - Winner (after completion)
- `scoreJson` - Match score
- `status` - PENDING, READY, IN_PROGRESS, COMPLETED
- `slot1Index` - Player 1 slot within group
- `slot2Index` - Player 2 slot within group

### Standings Calculation

Standings are calculated automatically when matches complete.

**Tracked Stats:**
- `matchesPlayed` - Total matches played
- `wins` - Matches won
- `losses` - Matches lost
- `points` - Total points earned

**Points System:**
- Win: 1 point
- Loss: 0 points

**Sorting Order:**
1. Points (descending)
2. Wins (descending)
3. Losses (ascending)
4. Random if still tied

### Status Logic

```
PENDING → Match exists but missing one or both players
READY → Both players assigned, match can start
IN_PROGRESS → Match started (umpire scoring)
COMPLETED → Match finished with winner
```

## Hybrid Format (Round Robin + Knockout)

### Workflow

1. **Create Draw**
   - Groups created for round robin
   - Knockout bracket created (empty)
   - All matches generated at once

2. **Assign Players**
   - Players assigned to groups
   - Group matches become READY

3. **Play Group Stage**
   - Complete all group matches
   - Standings calculated automatically

4. **Arrange Knockout**
   - Organizer selects top N players from each group
   - Players placed into existing knockout bracket
   - Knockout matches become READY

5. **Play Knockout Stage**
   - Standard knockout progression
   - Winner advances automatically

### Important Rules

✅ **Knockout bracket exists from draw creation**
✅ **Arrange Knockout only fills player slots**
✅ **Bracket structure NEVER regenerates**
✅ **Matches generated once and never regenerated**

## API Reference

### Create Round Robin Draw

```http
POST /api/v2/tournaments/:tournamentId/categories/:categoryId/draw
Authorization: Bearer {token}
Content-Type: application/json

{
  "format": "ROUND_ROBIN",
  "bracketSize": 16,
  "options": {
    "numberOfGroups": 4
  }
}
```

**Result:**
- 4 groups created (A, B, C, D)
- Each group has 4 players
- Each group has 6 matches (4×3/2)
- Total: 24 matches

### Create Hybrid Draw

```http
POST /api/v2/tournaments/:tournamentId/categories/:categoryId/draw
Authorization: Bearer {token}
Content-Type: application/json

{
  "format": "ROUND_ROBIN_KNOCKOUT",
  "bracketSize": 16,
  "options": {
    "numberOfGroups": 4,
    "advancePerGroup": 2
  }
}
```

**Result:**
- 4 groups with 4 players each (16 total)
- 24 group matches (6 per group)
- Knockout bracket for 8 players (4 groups × 2 advancing)
- 7 knockout matches (4+2+1)
- Total: 31 matches

### Assign Players

```http
POST /api/v2/tournaments/:tournamentId/categories/:categoryId/auto-assign-players
Authorization: Bearer {token}
```

**Result:**
- Players assigned to groups by seed
- Group matches become READY
- Knockout matches remain PENDING

### Get Group Standings

```http
GET /api/v2/tournaments/:tournamentId/categories/:categoryId/groups/:groupIndex/standings
```

**Response:**
```json
{
  "success": true,
  "data": {
    "standings": [
      {
        "playerId": "player-uuid",
        "matchesPlayed": 3,
        "wins": 3,
        "losses": 0,
        "points": 3
      },
      {
        "playerId": "player-uuid-2",
        "matchesPlayed": 3,
        "wins": 2,
        "losses": 1,
        "points": 2
      }
    ]
  }
}
```

### Get All Group Standings

```http
GET /api/v2/tournaments/:tournamentId/categories/:categoryId/standings
```

**Response:**
```json
{
  "success": true,
  "data": {
    "groups": [
      {
        "groupIndex": 0,
        "groupName": "A",
        "standings": [...]
      },
      {
        "groupIndex": 1,
        "groupName": "B",
        "standings": [...]
      }
    ]
  }
}
```

### Auto-Arrange Knockout

```http
POST /api/v2/tournaments/:tournamentId/categories/:categoryId/auto-arrange-knockout
Authorization: Bearer {token}
Content-Type: application/json

{
  "advancePerGroup": 2
}
```

**Result:**
- Top 2 from each group automatically selected
- Players placed in knockout bracket
- Knockout matches become READY

### Manual Arrange Knockout

```http
POST /api/v2/tournaments/:tournamentId/categories/:categoryId/continue-knockout
Authorization: Bearer {token}
Content-Type: application/json

{
  "qualifiedPlayerIds": [
    "player-a1-id",
    "player-a2-id",
    "player-b1-id",
    "player-b2-id",
    "player-c1-id",
    "player-c2-id",
    "player-d1-id",
    "player-d2-id"
  ]
}
```

**Result:**
- Specified players placed in knockout bracket
- Order determines seeding

## Complete Workflow Examples

### Example 1: Pure Round Robin (16 players, 4 groups)

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

// 2. Auto-assign players
await fetch('/api/v2/tournaments/t123/categories/c456/auto-assign-players', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer token' }
});

// 3. Play matches (complete each match)
await fetch('/api/v2/matches/match-id/complete', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    winnerId: 'player-id',
    scoreJson: { set1: '21-15', set2: '21-18' }
  })
});

// 4. Get final standings
const standings = await fetch(
  '/api/v2/tournaments/t123/categories/c456/standings'
).then(r => r.json());

console.log('Group A Winner:', standings.data.groups[0].standings[0]);
```

### Example 2: Hybrid Format (16 players, 4 groups, top 2 advance)

```javascript
// 1. Create hybrid draw
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

// 2. Auto-assign players to groups
await fetch('/api/v2/tournaments/t123/categories/c456/auto-assign-players', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer token' }
});

// 3. Play all group matches
// ... complete 24 group matches

// 4. Check standings
const standings = await fetch(
  '/api/v2/tournaments/t123/categories/c456/standings'
).then(r => r.json());

// 5. Auto-arrange knockout with top 2 from each group
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

// 6. Play knockout stage
// ... complete 7 knockout matches
// Winner advances automatically after each match
```

### Example 3: Manual Knockout Arrangement

```javascript
// After group stage completes, manually select players

// 1. Get all standings
const standings = await fetch(
  '/api/v2/tournaments/t123/categories/c456/standings'
).then(r => r.json());

// 2. Manually select qualified players
const qualifiedPlayerIds = [
  standings.data.groups[0].standings[0].playerId, // Group A #1
  standings.data.groups[1].standings[0].playerId, // Group B #1
  standings.data.groups[2].standings[0].playerId, // Group C #1
  standings.data.groups[3].standings[0].playerId, // Group D #1
  standings.data.groups[0].standings[1].playerId, // Group A #2
  standings.data.groups[1].standings[1].playerId, // Group B #2
  standings.data.groups[2].standings[1].playerId, // Group C #2
  standings.data.groups[3].standings[1].playerId  // Group D #2
];

// 3. Arrange knockout manually
await fetch('/api/v2/tournaments/t123/categories/c456/continue-knockout', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    qualifiedPlayerIds
  })
});
```

## Match Count Calculations

### Round Robin

For a group with `n` players:
```
Matches per group = n(n-1)/2
```

**Examples:**
- 4 players: 4(3)/2 = 6 matches
- 5 players: 5(4)/2 = 10 matches
- 6 players: 6(5)/2 = 15 matches

For multiple groups:
```
Total matches = numberOfGroups × matchesPerGroup
```

**Example: 16 players, 4 groups**
- Players per group: 16/4 = 4
- Matches per group: 4(3)/2 = 6
- Total matches: 4 × 6 = 24

### Hybrid Format

```
Total matches = Group matches + Knockout matches
```

**Example: 16 players, 4 groups, top 2 advance**
- Group matches: 4 × 6 = 24
- Knockout players: 4 × 2 = 8
- Knockout matches: 8-1 = 7
- Total: 24 + 7 = 31 matches

## Frontend Integration

### Display Group Standings

```jsx
function GroupStandings({ tournamentId, categoryId, groupIndex }) {
  const [standings, setStandings] = useState([]);

  useEffect(() => {
    fetch(`/api/v2/tournaments/${tournamentId}/categories/${categoryId}/groups/${groupIndex}/standings`)
      .then(r => r.json())
      .then(data => setStandings(data.data.standings));
  }, []);

  return (
    <table>
      <thead>
        <tr>
          <th>Position</th>
          <th>Player</th>
          <th>Played</th>
          <th>Wins</th>
          <th>Losses</th>
          <th>Points</th>
        </tr>
      </thead>
      <tbody>
        {standings.map((player, index) => (
          <tr key={player.playerId}>
            <td>{index + 1}</td>
            <td>{player.playerId}</td>
            <td>{player.matchesPlayed}</td>
            <td>{player.wins}</td>
            <td>{player.losses}</td>
            <td>{player.points}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Arrange Knockout Button

```jsx
function ArrangeKnockoutButton({ tournamentId, categoryId, advancePerGroup }) {
  const handleArrange = async () => {
    const response = await fetch(
      `/api/v2/tournaments/${tournamentId}/categories/${categoryId}/auto-arrange-knockout`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ advancePerGroup })
      }
    );

    if (response.ok) {
      alert('Knockout stage arranged! Top players advanced.');
    }
  };

  return (
    <button onClick={handleArrange}>
      Arrange Knockout (Top {advancePerGroup} from each group)
    </button>
  );
}
```

## Key Benefits

✅ **Stable Match Generation** - Matches created once, never regenerated
✅ **Automatic Standings** - Updates after each match completion
✅ **Flexible Group Sizes** - Works with any number of groups and players
✅ **Manual or Auto Knockout** - Organizer can choose arrangement method
✅ **Clear Status Flow** - PENDING → READY → IN_PROGRESS → COMPLETED
✅ **No Regeneration** - Bracket structure remains fixed throughout

## Troubleshooting

### Issue: Standings not updating
**Solution:** Ensure match status is COMPLETED and winnerId is set

### Issue: Knockout not arranging
**Solution:** Check that all group matches are completed

### Issue: Wrong player count in knockout
**Solution:** Verify advancePerGroup × numberOfGroups matches knockout bracket size

## Summary

The Round Robin and Hybrid systems provide:
- Automatic match generation for all groups
- Real-time standings calculation
- Flexible knockout arrangement
- Stable structure throughout tournament
- Clear status management
- Support for any number of groups and players
