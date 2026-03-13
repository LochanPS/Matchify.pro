# TP Frontend Display Fix

## Issue Discovered
The TP (Total Points) column was showing 0 in the round-robin standings on **PlayerViewDrawsPage**, even though the backend was correctly calculating and sending the totalPoints value.

## Root Cause
The frontend was **recalculating** TP from match data instead of using the `totalPoints` value already calculated by the backend in `getDraw()`.

### Frontend Calculation (OLD - WRONG):
```javascript
const totalPointsScored = calculateTotalPointsScored(p.id, group.matches || []);
```

This function tried to:
1. Loop through all matches in the group
2. Parse `match.dbMatch.scoreJson` for each match
3. Sum up the points scored by the player

### Problems with Frontend Calculation:
1. **Redundant** - Backend already calculates this in `getDraw()`
2. **Unreliable** - Depends on `match.dbMatch.scoreJson` being populated in the response
3. **Inconsistent** - Different logic than backend, could produce different results
4. **Performance** - Recalculating on every render instead of using pre-calculated value

## Solution
Changed the frontend to use the backend-calculated `totalPoints` value with a fallback:

```javascript
// Use totalPoints from backend if available, otherwise calculate from matches
const totalPointsScored = p.totalPoints ?? calculateTotalPointsScored(p.id, group.matches || []);
```

This:
1. ✅ Uses `p.totalPoints` from backend (calculated in `getDraw()`)
2. ✅ Falls back to frontend calculation if backend value is missing
3. ✅ Ensures consistency between backend and frontend
4. ✅ Better performance - no recalculation needed

## Files Modified
- `frontend/src/pages/PlayerViewDrawsPage.jsx` (line ~1007)

## How It Works Now

### Backend Flow (draw.controller.js):
1. `getDraw()` is called
2. Finds all completed matches for the group
3. For each match, parses `scoreJson`
4. Calculates `totalPoints` for each participant:
   ```javascript
   scoreData.sets.forEach(set => {
     const p1Score = set.player1 ?? set.p1 ?? set.score1 ?? 0;
     const p2Score = set.player2 ?? set.p2 ?? set.score2 ?? 0;
     player1.totalPoints += p1Score;
     player2.totalPoints += p2Score;
   });
   ```
5. Returns `bracketJson` with updated `participant.totalPoints`

### Frontend Flow (PlayerViewDrawsPage.jsx):
1. Receives draw data from backend
2. Renders standings table
3. For each participant, displays `p.totalPoints` (from backend)
4. If `p.totalPoints` is undefined, falls back to frontend calculation

## Expected Behavior After Fix

### When Backend Calculation Works:
- TP displays the value from `p.totalPoints` (calculated by backend)
- Values are consistent and accurate
- No frontend recalculation needed

### When Backend Calculation Fails:
- TP falls back to frontend calculation from `match.dbMatch.scoreJson`
- Provides a safety net if backend calculation has issues
- Still shows a value instead of 0

## Testing

After deployment:
1. Navigate to a round-robin tournament as a player
2. View the standings table
3. TP column should now show correct values
4. Example: If a player scored 21+21+19 = 61 points across matches, TP should show 61

## Related Fixes

This fix works in conjunction with the backend fixes:
1. **Multi-format scoreJson support** (Commit: a65eb8e) - Backend can parse different score formats
2. **scoreJson validation** (Commit: f52063e) - Ensures matches are completed with scores
3. **Enhanced logging** (Commit: de4c28d) - Helps diagnose scoreJson issues

## Commit
- Commit: 8dc0f3f
- Message: "Fix TP display to use backend-calculated totalPoints instead of frontend calculation"
- Pushed to: main branch

## Why This Fix Is Important

1. **Single Source of Truth** - Backend is the authoritative source for TP calculation
2. **Consistency** - Same calculation logic everywhere
3. **Performance** - No redundant calculations on frontend
4. **Maintainability** - Only one place to update TP calculation logic
5. **Reliability** - Backend has access to complete database data

## If TP Still Shows 0

If TP still shows 0 after this fix, it means:
1. Backend `getDraw()` is not calculating `totalPoints` correctly
2. scoreJson is NULL or invalid in the database
3. The TP calculation logic in backend has a bug

Run the diagnostic script to check:
```bash
cd backend
node diagnose-scorejson.js
```

This will show exactly where the issue is occurring.
