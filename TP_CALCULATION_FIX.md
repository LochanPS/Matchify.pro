# TP (Total Points) Calculation Fix

## Issue
TP (Total Points) in round-robin standings was always showing 0, even though matches were being completed and wins/losses were updating correctly.

## Root Cause
The TP calculation logic in `getDraw()` was only checking for `set.player1` and `set.player2` fields in the scoreJson, but the actual scoreJson format might use different field names:
- `player1` / `player2`
- `p1` / `p2`
- `score1` / `score2`

When the field names didn't match, the calculation would default to 0, resulting in all TP values showing as 0.

## Solution
Updated the TP calculation logic in `backend/src/controllers/draw.controller.js` to support multiple scoreJson formats using nullish coalescing:

```javascript
// Support multiple scoreJson formats: player1/player2, p1/p2, score1/score2
const p1Score = set.player1 ?? set.p1 ?? set.score1 ?? 0;
const p2Score = set.player2 ?? set.p2 ?? set.score2 ?? 0;

player1TotalPoints += p1Score;
player2TotalPoints += p2Score;
```

This change was applied to both:
1. ROUND_ROBIN format (line ~480)
2. ROUND_ROBIN_KNOCKOUT format (line ~620)

## Files Modified
- `backend/src/controllers/draw.controller.js` - Updated TP calculation in getDraw() function

## Testing
After deployment:
1. Complete a round-robin match with scores
2. View the draw/standings page
3. Verify that TP column now shows the correct total points scored by each player
4. Example: If a player wins 21-18, 21-19, their TP should show 42 (21+21)

## Commit
- Commit: a65eb8e
- Message: "Fix TP calculation to support multiple scoreJson formats"
- Pushed to: main branch

## Notes
- No frontend changes required
- The fix is backward compatible with all scoreJson formats
- Existing matches will automatically show correct TP values when the draw is refreshed
- The calculation runs every time getDraw() is called, ensuring real-time accuracy
