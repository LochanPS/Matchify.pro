# Restart Draws Feature - Complete ✅

## Overview
Added a "Restart Draws" feature that allows tournament organizers to reset all match data while keeping the draw structure and player assignments intact.

## What It Does

### Resets:
- ✅ Match status → PENDING
- ✅ Match scores → Cleared (scoreJson = null)
- ✅ Winners → Removed (winnerId = null)
- ✅ Match times → Cleared (startedAt, completedAt = null)
- ✅ Umpire assignments → Cleared (umpireId = null)
- ✅ Court assignments → Cleared (courtNumber = null)
- ✅ Advanced players → Removed from parent matches (player1Id, player2Id = null for rounds 2+)

### Preserves:
- ✅ Draw structure (bracket layout)
- ✅ Player assignments in Round 1 (first round players stay)
- ✅ Parent match relationships (parentMatchId, winnerPosition)
- ✅ Match numbers and round numbers

## UI Changes

### Button Location
- **Where**: Draw Page header, next to "Assign Players", "Delete Draw", "Edit Draw"
- **Color**: Orange/Amber gradient (⚡ Zap icon)
- **Visibility**: Only for organizers
- **State**: 
  - Enabled when matches have been played
  - Disabled when no matches have been played

### Confirmation Modal
Shows warning with:
- List of what will be reset
- List of what will be preserved
- Category name
- Cancel and Confirm buttons

## Backend Implementation

### Endpoint
```
POST /api/tournaments/:tournamentId/categories/:categoryId/draw/restart
```

### Authorization
- Requires authentication
- Only tournament organizer can restart

### Logic
1. Verify tournament and category exist
2. Verify user is the organizer
3. Get all matches for the category
4. Identify first round matches (highest round number)
5. Reset all matches:
   - First round: Keep player assignments
   - Other rounds: Clear player assignments
6. Return success with stats

### Response
```json
{
  "success": true,
  "message": "Draw restarted successfully",
  "stats": {
    "totalMatches": 7,
    "firstRoundMatches": 4,
    "resetMatches": 3
  }
}
```

## Files Modified

### Frontend
1. `frontend/src/pages/DrawPage.jsx`
   - Added `showRestartModal` and `restarting` state
   - Added `restartDraws()` handler
   - Added "Restart Draws" button
   - Added confirmation modal

### Backend
1. `backend/src/controllers/restartDraw.controller.js` (NEW)
   - Created `restartDraw()` controller function
2. `backend/src/routes/tournament.routes.js`
   - Added POST route for restart endpoint
   - Imported restartDraw controller

## Use Cases

1. **Tournament Replay**: Organizer wants to replay the tournament with same bracket
2. **Mistake Correction**: Umpires made errors and need to restart all matches
3. **Testing**: Test the tournament flow multiple times
4. **Demo**: Show the tournament system without creating new draws

## Testing

### Test Steps:
1. Complete some matches in a tournament
2. Go to Draw Page
3. Click "Restart Draws" button (should be enabled)
4. Confirm in modal
5. Verify:
   - All matches reset to PENDING
   - First round players still assigned
   - Semi-finals and finals show TBD
   - All scores cleared
   - Tournament progress shows 0%

### Expected Result:
- ✅ All matches reset successfully
- ✅ First round players preserved
- ✅ Bracket structure intact
- ✅ Success message displayed
- ✅ Stats updated (0 completed matches)

## Status: COMPLETE ✅

The "Restart Draws" feature is fully implemented and ready to use!
