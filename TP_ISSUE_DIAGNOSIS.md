# TP (Total Points) Issue - Detailed Diagnosis

## Problem
TP (Total Points) remains 0 in round-robin standings even though:
- Wins, losses, and ranking points update correctly
- Match winners are saved
- Match scores are NOT displayed in the matches list

## Investigation Findings

### 1. Match Completion Endpoints

There are TWO endpoints for completing matches:

#### A. `/matches/:matchId/end` (PUT)
- Used by: MatchScoringPage
- Payload: `{ winnerId, finalScore }`
- Saves: `scoreJson: JSON.stringify(finalScore)`
- ✅ This endpoint ALWAYS saves scoreJson

#### B. `/matches/:matchId/complete` (POST)
- Used by: Unknown (not found in frontend search)
- Payload: `{ winnerId, scoreData }`
- Saves: `scoreJson: scoreData ? JSON.stringify(scoreData) : match.scoreJson`
- ⚠️ This endpoint saves scoreJson CONDITIONALLY - if scoreData is missing, it keeps the old scoreJson

### 2. Score Format
The frontend sends scores in this format:
```javascript
{
  sets: [
    { player1: 21, player2: 18 },
    { player1: 19, player2: 21 }
  ],
  currentSet: 0,
  matchConfig: { pointsPerSet: 21, setsToWin: 2, maxSets: 3, extension: true },
  timer: { ... }
}
```

### 3. TP Calculation Logic
The backend `getDraw()` function calculates TP from scoreJson:
```javascript
if (scoreData && scoreData.sets && Array.isArray(scoreData.sets)) {
  scoreData.sets.forEach(set => {
    const p1Score = set.player1 ?? set.p1 ?? set.score1 ?? 0;
    const p2Score = set.player2 ?? set.p2 ?? set.score2 ?? 0;
    player1TotalPoints += p1Score;
    player2TotalPoints += p2Score;
  });
}
```

## Root Cause Hypothesis

The issue is likely one of these:

### Hypothesis 1: Matches completed via `/complete` endpoint without scoreData
If matches are being completed using the `/complete` endpoint with only `winnerId` but no `scoreData`, then:
- The match is marked as COMPLETED
- The winnerId is saved
- But scoreJson remains NULL
- Result: TP calculation finds no scoreJson, so TP = 0

### Hypothesis 2: Matches completed manually in database
If an admin or script is manually updating matches to COMPLETED status without setting scoreJson:
- The match status changes to COMPLETED
- The winnerId is set
- But scoreJson is never populated
- Result: TP = 0

### Hypothesis 3: Frontend not sending scores
If the MatchScoringPage is not properly sending the `finalScore` in the request:
- The `/end` endpoint receives `finalScore: undefined`
- It saves `scoreJson: "undefined"` or `scoreJson: null`
- Result: TP = 0

## Next Steps to Diagnose

1. **Check actual database records**:
   ```sql
   SELECT id, matchNumber, status, winnerId, scoreJson 
   FROM Match 
   WHERE status = 'COMPLETED' AND stage = 'GROUP'
   LIMIT 5;
   ```

2. **Add logging to match completion endpoints**:
   - Log the incoming request body
   - Log what scoreJson is being saved
   - Log if scoreJson is NULL

3. **Check if `/complete` endpoint is being called**:
   - Search backend logs for "POST /matches/.*/complete"
   - Check if any external scripts or admin tools use this endpoint

4. **Verify frontend is sending scores**:
   - Add console.log in MatchScoringPage before calling `/end`
   - Check browser network tab to see the actual request payload

## Recommended Fix

Add validation to BOTH endpoints to ensure scoreJson is never NULL for completed matches:

```javascript
// In /end endpoint
if (!finalScore || !finalScore.sets) {
  return res.status(400).json({ 
    success: false, 
    error: 'Cannot complete match without score data' 
  });
}

// In /complete endpoint
if (!scoreData || !scoreData.sets) {
  return res.status(400).json({ 
    success: false, 
    error: 'Cannot complete match without score data' 
  });
}
```

This will prevent matches from being completed without scores, forcing the proper flow through MatchScoringPage.
