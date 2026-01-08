# Testing the Scoring API (Day 36)

## Quick Start

### 1. Start Backend Server
```bash
cd matchify/backend
npm start
```
Server should start on http://localhost:5000

### 2. Run Automated Tests
```bash
cd matchify/backend
node test-scoring.js
```
Expected: 9/9 tests pass

---

## Manual Testing with Postman/Thunder Client

### Prerequisites
1. Backend server running
2. Test account credentials:
   - Email: testorganizer@matchify.com
   - Password: password123
3. Get a match ID from database or API

---

## Test Scenarios

### Scenario 1: Login and Get Token

**Request:**
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "testorganizer@matchify.com",
  "password": "password123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "testorganizer@matchify.com",
    "role": "ORGANIZER"
  }
}
```

**Action:** Copy the token for next requests

---

### Scenario 2: Get Tournament Matches

**Request:**
```
GET http://localhost:5000/api/tournaments/TOURNAMENT_ID/matches
```

**Expected Response:**
```json
{
  "success": true,
  "matches": [
    {
      "id": "match-uuid",
      "tournamentId": "...",
      "categoryId": "...",
      "round": 1,
      "matchNumber": 1,
      "status": "PENDING",
      "scoreJson": null,
      "category": {
        "name": "Men's Singles",
        "format": "SINGLES"
      }
    }
  ]
}
```

**Action:** Copy a match ID for next tests

---

### Scenario 3: Start Match

**Request:**
```
POST http://localhost:5000/api/matches/MATCH_ID/start
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Match started",
  "score": {
    "sets": [],
    "currentSet": 1,
    "currentScore": {
      "player1": 0,
      "player2": 0
    },
    "currentServer": "player1",
    "history": []
  }
}
```

**Verification:**
- ✅ Match status changed to ONGOING
- ✅ Score initialized
- ✅ Current server set

---

### Scenario 4: Add Point (Player 1)

**Request:**
```
POST http://localhost:5000/api/matches/MATCH_ID/score
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "player": "player1"
}
```

**Expected Response:**
```json
{
  "success": true,
  "score": {
    "sets": [],
    "currentSet": 1,
    "currentScore": {
      "player1": 1,
      "player2": 0
    },
    "currentServer": "player2",
    "history": [
      {
        "set": 1,
        "player": "player1",
        "score": { "player1": 1, "player2": 0 },
        "timestamp": "2025-12-27T12:00:00Z"
      }
    ]
  },
  "matchComplete": false,
  "winner": null
}
```

**Verification:**
- ✅ Score incremented: 1-0
- ✅ Server changed to player2
- ✅ History updated

---

### Scenario 5: Add Multiple Points

**Repeat the above request multiple times:**
- Add 5 points for player1
- Add 3 points for player2
- Expected score: 5-3

**Verification:**
- ✅ Score updates correctly
- ✅ Server alternates
- ✅ History grows

---

### Scenario 6: Undo Last Point

**Request:**
```
POST http://localhost:5000/api/matches/MATCH_ID/undo
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected Response:**
```json
{
  "success": true,
  "score": {
    "sets": [],
    "currentSet": 1,
    "currentScore": {
      "player1": 5,
      "player2": 2
    },
    "currentServer": "player1",
    "history": [...]
  }
}
```

**Verification:**
- ✅ Score reverted: 5-2
- ✅ Server recalculated
- ✅ History reduced by 1

---

### Scenario 7: Complete a Set (21 points)

**Add points until one player reaches 21:**
- Continue adding points for player1
- Stop at 21-10 (for example)

**Expected Response:**
```json
{
  "success": true,
  "score": {
    "sets": [
      {
        "setNumber": 1,
        "score": { "player1": 21, "player2": 10 },
        "winner": "player1"
      }
    ],
    "currentSet": 2,
    "currentScore": {
      "player1": 0,
      "player2": 0
    },
    "currentServer": "player1",
    "history": [...]
  },
  "matchComplete": false,
  "winner": null
}
```

**Verification:**
- ✅ Set saved to sets array
- ✅ Winner determined
- ✅ New set started
- ✅ Score reset to 0-0

---

### Scenario 8: Complete Match (2 sets)

**Continue scoring until one player wins 2 sets:**

**Expected Response:**
```json
{
  "success": true,
  "score": {
    "sets": [
      {
        "setNumber": 1,
        "score": { "player1": 21, "player2": 10 },
        "winner": "player1"
      },
      {
        "setNumber": 2,
        "score": { "player1": 21, "player2": 15 },
        "winner": "player1"
      }
    ],
    "currentSet": 2,
    "currentScore": { "player1": 21, "player2": 15 },
    "currentServer": "player2",
    "history": [...]
  },
  "matchComplete": true,
  "winner": "player1"
}
```

**Verification:**
- ✅ Match marked as complete
- ✅ Winner determined
- ✅ Match status: COMPLETED
- ✅ Winner ID saved

---

### Scenario 9: Test Deuce (20-20)

**Score to 20-20:**
- Add 20 points for player1
- Add 20 points for player2

**Then add points alternately:**
- 21-20 (game continues)
- 21-21 (game continues)
- 22-21 (game continues)
- 22-22 (game continues)
- 23-22 (player1 wins with 2-point lead)

**Verification:**
- ✅ Game doesn't end at 21-20
- ✅ Requires 2-point lead
- ✅ Game ends at 23-21 or 22-20

---

### Scenario 10: Test Golden Point (29-29)

**Score to 29-29:**
- Add 29 points for player1
- Add 29 points for player2

**Then add 1 point:**
- 30-29 (game ends immediately)

**Verification:**
- ✅ Game ends at 30-29
- ✅ No 2-point lead required
- ✅ Winner determined

---

### Scenario 11: Test Unauthorized Access

**Request without token:**
```
POST http://localhost:5000/api/matches/MATCH_ID/score
Content-Type: application/json

{
  "player": "player1"
}
```

**Expected Response:**
```json
{
  "error": "No token provided"
}
```

**Status Code:** 401 Unauthorized

**Verification:**
- ✅ Access denied
- ✅ 401 status code
- ✅ Error message returned

---

## Error Cases to Test

### 1. Invalid Player
```json
{
  "player": "player3"
}
```
Expected: 400 Bad Request - "Invalid player"

### 2. Match Not Ongoing
Try to score on a PENDING match
Expected: 400 Bad Request - "Match is not ongoing"

### 3. Score Exceeds 30
Try to score when player has 30 points
Expected: 400 Bad Request - "Score cannot exceed 30"

### 4. Undo with No History
Try to undo when match just started
Expected: 400 Bad Request - "No history to undo"

### 5. Wrong Umpire
Login as different user, try to score
Expected: 403 Forbidden - "Only assigned umpire can update score"

---

## Verification Checklist

### Score Updates
- [ ] Score increments by 1
- [ ] Server alternates correctly
- [ ] History records each point
- [ ] Timestamp added to history

### Set Completion
- [ ] Game ends at 21 with 2-point lead
- [ ] Game ends at 22-20, 23-21, etc.
- [ ] Game ends at 30-29 (golden point)
- [ ] Set saved to sets array
- [ ] Winner determined correctly
- [ ] New set starts automatically

### Match Completion
- [ ] Match ends when player wins 2 sets
- [ ] Winner determined correctly
- [ ] Match status: COMPLETED
- [ ] Winner ID saved
- [ ] Completion time recorded

### Undo Functionality
- [ ] Last point removed
- [ ] Score restored
- [ ] Server recalculated
- [ ] History reduced
- [ ] Works across set boundaries

### Authorization
- [ ] Token required for scoring
- [ ] Umpire verified
- [ ] Organizer can override
- [ ] Public can read
- [ ] Unauthorized blocked

---

## Common Issues

### Issue: "Match not found"
**Solution:** Verify match ID is correct

### Issue: "Match is not ongoing"
**Solution:** Start the match first with POST /matches/:id/start

### Issue: "Only assigned umpire can update score"
**Solution:** Use organizer account or assign umpire to match

### Issue: "No token provided"
**Solution:** Add Authorization header with Bearer token

### Issue: "Invalid player"
**Solution:** Use "player1" or "player2" exactly

---

## Success Criteria

Day 36 is complete when:
- ✅ All 9 automated tests pass
- ✅ Can start a match
- ✅ Can add points for both players
- ✅ Server alternates correctly
- ✅ Set completion works
- ✅ Match completion works
- ✅ Deuce handling works
- ✅ Golden point works
- ✅ Undo works
- ✅ Authorization works
- ✅ No syntax errors
- ✅ All validations work

---

**Happy Testing! 🎾**
