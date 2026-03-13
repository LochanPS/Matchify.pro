# scoreJson Investigation Guide

## Purpose
This document explains how to diagnose why TP (Total Points) remains 0 in round-robin standings.

## Diagnostic Script

Run this script on the backend to check the actual database state:

```bash
cd backend
node diagnose-scorejson.js
```

This script will:
1. Find all completed GROUP stage matches
2. Check if scoreJson exists for each match
3. Parse and validate the scoreJson structure
4. Calculate what TP should be based on the scores
5. Compare with the current TP values in the draw bracketJson
6. Provide a diagnosis of the issue

## Expected scoreJson Format

When a match is completed normally (not a bye), scoreJson should look like:

```json
{
  "sets": [
    { "player1": 21, "player2": 18 },
    { "player1": 19, "player2": 21 },
    { "player1": 21, "player2": 17 }
  ],
  "currentSet": 2,
  "matchConfig": {
    "pointsPerSet": 21,
    "setsToWin": 2,
    "maxSets": 3,
    "extension": true
  },
  "timer": { ... }
}
```

For bye matches, scoreJson looks like:

```json
{
  "sets": [],
  "winner": "user-id",
  "isBye": true,
  "completedAt": "2024-01-01T00:00:00.000Z"
}
```

## Match Completion Flow

### Normal Match Completion
1. **ConductMatchPage** → Configure match settings
2. **MatchScoringPage** → Score the match point by point
3. **handleEndMatch()** → Sends `PUT /matches/:matchId/end`
   - Payload: `{ winnerId, finalScore: score }`
   - Backend saves: `scoreJson: JSON.stringify(finalScore)`

### Bye Match Completion
1. **ConductMatchPage** → Click "Give Bye" button
2. **giveBye()** → Sends `POST /matches/:matchId/give-bye`
   - Payload: `{ winnerId }`
   - Backend saves: `scoreJson: JSON.stringify({ sets: [], isBye: true, ... })`

## TP Calculation Logic

The `getDraw()` function in `draw.controller.js` calculates TP like this:

```javascript
if (m.scoreJson) {
  const scoreData = typeof m.scoreJson === 'string' ? JSON.parse(m.scoreJson) : m.scoreJson;
  
  if (scoreData && scoreData.sets && Array.isArray(scoreData.sets)) {
    let player1TotalPoints = 0;
    let player2TotalPoints = 0;
    
    scoreData.sets.forEach(set => {
      // Support multiple formats
      const p1Score = set.player1 ?? set.p1 ?? set.score1 ?? 0;
      const p2Score = set.player2 ?? set.p2 ?? set.score2 ?? 0;
      
      player1TotalPoints += p1Score;
      player2TotalPoints += p2Score;
    });
    
    player1.totalPoints = (player1.totalPoints || 0) + player1TotalPoints;
    player2.totalPoints = (player2.totalPoints || 0) + player2TotalPoints;
  }
}
```

## Common Issues and Solutions

### Issue 1: scoreJson is NULL
**Symptom:** Matches are completed but scoreJson is NULL in database

**Causes:**
- Match completed via `/complete` endpoint without scoreData
- Frontend not sending finalScore in the request
- Database update failing silently

**Solution:**
- Check frontend console logs for "Ending match - Sending to API"
- Check backend logs for "Saving scoreJson"
- Verify the validation is working (should reject matches without scores)

### Issue 2: scoreJson has wrong format
**Symptom:** scoreJson exists but TP is still 0

**Causes:**
- Sets array is empty (bye match - this is expected)
- Set scores use different field names (e.g., `p1`/`p2` instead of `player1`/`player2`)
- Sets array is missing or not an array

**Solution:**
- Run diagnostic script to see actual scoreJson format
- Update TP calculation to support the format (already done)
- Fix frontend to send correct format

### Issue 3: getDraw() not recalculating
**Symptom:** scoreJson is correct but TP not updating

**Causes:**
- getDraw() not being called after match completion
- Frontend caching old draw data
- TP calculation logic has a bug

**Solution:**
- Check if getDraw() is called when viewing the draw page
- Clear browser cache and hard refresh
- Check backend logs for TP calculation output

### Issue 4: Matches not found by getDraw()
**Symptom:** scoreJson exists but getDraw() doesn't find the matches

**Causes:**
- Matches not marked with `stage='GROUP'`
- Match finding strategies in getDraw() failing
- Match numbers don't match between database and bracketJson

**Solution:**
- Check match.stage field in database
- Verify match numbers are consistent
- Check getDraw() logs for "Strategy 1/2/3" output

## Validation Added

Both match completion endpoints now validate scoreJson:

```javascript
if (!finalScore || !finalScore.sets || !Array.isArray(finalScore.sets) || finalScore.sets.length === 0) {
  return res.status(400).json({ 
    success: false, 
    error: 'Cannot complete match without score data' 
  });
}
```

This prevents matches from being completed without proper scores.

## Logging Added

### Frontend (MatchScoringPage.jsx)
```javascript
console.log('🏁 Ending match - Sending to API:');
console.log('   Winner ID:', winnerId);
console.log('   Final Score:', JSON.stringify(score, null, 2));
console.log('   Score has sets:', !!score.sets);
console.log('   Number of sets:', score.sets?.length);
```

### Backend (match.routes.js)
```javascript
console.log(`🏁 Match End Request - Match ${matchId}`);
console.log(`   Winner ID: ${winnerId}`);
console.log(`   Has finalScore: ${!!finalScore}`);
console.log(`   finalScore.sets: ${finalScore?.sets ? JSON.stringify(finalScore.sets) : 'MISSING'}`);
console.log(`   Saving scoreJson (${scoreJsonString.length} chars): ${scoreJsonString.substring(0, 100)}...`);
console.log(`✅ Match ${matchId} completed successfully with scoreJson saved`);
```

## How to Use This Guide

1. **First, run the diagnostic script** to understand the current state
2. **Check the diagnosis output** to identify the specific issue
3. **Look at the relevant logs**:
   - Frontend: Browser console
   - Backend: Render logs
4. **Apply the appropriate solution** based on the issue identified
5. **Verify the fix** by completing a new match and checking TP updates

## Files Involved

- **Frontend:**
  - `frontend/src/pages/MatchScoringPage.jsx` - Sends match completion request
  - `frontend/src/pages/ConductMatchPage.jsx` - Handles bye matches

- **Backend:**
  - `backend/src/routes/match.routes.js` - Match completion endpoints
  - `backend/src/controllers/match.controller.js` - giveBye function
  - `backend/src/controllers/draw.controller.js` - getDraw() with TP calculation

- **Diagnostic:**
  - `backend/diagnose-scorejson.js` - Database diagnostic script
