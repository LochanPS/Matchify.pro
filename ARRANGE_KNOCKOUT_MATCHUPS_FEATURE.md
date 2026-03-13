# Arrange Knockout Matchups Feature ✅

## Feature Overview
Organizers can now manually arrange knockout stage matchups for Round Robin + Knockout tournaments. This gives full flexibility to decide who plays against who in the knockout stage.

## How It Works

### Round Robin + Knockout Flow:
1. **Stage 1 - Round Robin**: Players compete in groups (Pool A, Pool B, etc.)
2. **Advancing Players**: Top N players from each pool advance (organizer decides N)
3. **Stage 2 - Knockout**: Organizer manually arranges matchups
4. **Flexibility**: Organizer can match any advancing player against any other

### Example:
- Pool A: Top 2 advance (Player A1, Player A2)
- Pool B: Top 2 advance (Player B1, Player B2)

**Organizer can arrange:**
- Match 1: A1 vs B1, Match 2: A2 vs B2 (cross-pool)
- Match 1: A1 vs A2, Match 2: B1 vs B2 (same-pool)
- Match 1: A1 vs B2, Match 2: A2 vs B1 (mixed)
- Any other combination!

## Frontend Changes

### 1. New Button
**File**: `frontend/src/pages/DrawPage.jsx`

Added "Arrange Knockout" button that appears for ROUND_ROBIN_KNOCKOUT format:
```javascript
{bracket?.format === 'ROUND_ROBIN_KNOCKOUT' && (
  <button onClick={() => setShowArrangeMatchupsModal(true)}>
    <Settings className="w-5 h-5" />
    Arrange Knockout
  </button>
)}
```

### 2. New Modal Component: ArrangeMatchupsModal
**File**: `frontend/src/pages/DrawPage.jsx`

Features:
- **Advancing Players Section**: Shows all players who advanced from round robin
  - Displays: Player name, Pool letter, Rank, Points
  - Unassigned players shown at top
  
- **Knockout Matches Section**: Shows all first-round knockout matches
  - Each match has 2 slots (Player 1 and Player 2)
  - Dropdown to select players for empty slots
  - Assigned players shown with remove button
  - Players can only be assigned to one match

- **Validation**: Ensures all slots are filled before saving

### 3. New State Variables
```javascript
const [showArrangeMatchupsModal, setShowArrangeMatchupsModal] = useState(false);
```

### 4. New Function: saveKnockoutMatchups
Calls backend API to save the custom matchup arrangement.

## Backend Changes

### 1. New Controller Function
**File**: `backend/src/controllers/draw.controller.js`

```javascript
const arrangeKnockoutMatchups = async (req, res) => {
  // Validates tournament ownership
  // Updates bracketJson with custom matchups
  // Updates database Match records
  // Returns success response
}
```

**Logic**:
1. Verify tournament and ownership
2. Get existing draw
3. Validate format is ROUND_ROBIN_KNOCKOUT
4. Update knockout bracket first round with custom assignments
5. Save updated bracketJson
6. Update database Match records for knockout stage
7. Return success

### 2. New Route
**File**: `backend/src/routes/draw.routes.js`

```javascript
router.post('/tournaments/:tournamentId/categories/:categoryId/draw/arrange-knockout', 
  authenticate, 
  arrangeKnockoutMatchups
);
```

## API Endpoint

### POST `/api/tournaments/:tournamentId/categories/:categoryId/draw/arrange-knockout`

**Headers**:
```
Authorization: Bearer <token>
```

**Body**:
```json
{
  "knockoutSlots": [
    {
      "matchNumber": 1,
      "player1": {
        "id": "player-id-1",
        "name": "Player Name 1",
        "group": "A",
        "rank": 1,
        "points": 6
      },
      "player2": {
        "id": "player-id-2",
        "name": "Player Name 2",
        "group": "B",
        "rank": 1,
        "points": 6
      }
    },
    {
      "matchNumber": 2,
      "player1": { ... },
      "player2": { ... }
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Knockout matchups arranged successfully",
  "draw": { ... }
}
```

## User Flow

1. **Create Tournament** with Round Robin + Knockout format
2. **Assign Players** to pools
3. **Play Round Robin** matches
4. **View Standings** - see who advanced
5. **Click "Arrange Knockout"** button
6. **Modal Opens** showing:
   - Advancing players list
   - Knockout match slots
7. **Select Players** from dropdowns for each match
8. **Save** - matchups are saved
9. **Knockout Stage** begins with custom matchups

## Benefits

1. **Full Control**: Organizer decides all matchups
2. **Strategic Pairing**: Can avoid same-pool matchups or create them
3. **Fairness**: Can ensure balanced matchups
4. **Flexibility**: Change matchups before knockout starts
5. **Transparency**: Clear view of who's playing who

## Files Modified

### Frontend:
- `frontend/src/pages/DrawPage.jsx`
  - Added button
  - Added modal component
  - Added state and function

### Backend:
- `backend/src/controllers/draw.controller.js`
  - Added arrangeKnockoutMatchups function
  - Added to exports
- `backend/src/routes/draw.routes.js`
  - Added new route
  - Added to imports

## Testing Instructions

1. **Create Tournament** with Round Robin + Knockout format
2. **Configure Draw**: 8 players, 2 groups, Top 2 advance
3. **Assign Players** to pools
4. **Complete Round Robin** matches (or use test data)
5. **Click "Arrange Knockout"** button
6. **Verify Modal** shows:
   - 4 advancing players
   - 2 knockout matches
7. **Arrange Matchups**:
   - Select players for Match 1
   - Select players for Match 2
8. **Save** and verify success message
9. **Check Knockout Bracket** shows custom matchups
10. **Start Knockout Matches** with arranged players

## Status
✅ **COMPLETE** - Organizers can now manually arrange knockout matchups with full flexibility
