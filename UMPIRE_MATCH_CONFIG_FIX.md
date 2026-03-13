# Umpire Match Configuration Fix

## Issue Summary
When an umpire received a match assignment notification and tried to configure the match settings (points per set, number of sets, extension), they encountered an error:
```
Error: Cannot change config after match has started
```

## Root Cause
The match configuration endpoint (`PUT /api/matches/:matchId/config`) only allowed configuration changes when the match status was `PENDING` or `READY`. However:
1. Some matches might have status `SCHEDULED` which should also allow configuration
2. The status check was case-sensitive, causing issues with different status formats
3. If a match was already `IN_PROGRESS`, the error would block the entire flow

## Solution Implemented

### 1. Frontend Fix (ConductMatchPage.jsx)
**Enhanced error handling:**
- Added try-catch around config save to gracefully handle errors
- If match is already started, skip config save and proceed directly to scoring
- Added console logs for better debugging
- Only attempts to save config if match status is `PENDING`, `READY`, or `SCHEDULED`

**Visual improvements:**
- Added status indicator showing "Match Started - Config Locked" when match is in progress
- Disabled the "Edit" button for matches that have already started
- Shows clear feedback about match status

### 2. Backend Fix (match.controller.js)
**Improved status checking:**
- Made status check case-insensitive using `.toUpperCase()`
- Added `SCHEDULED` to the list of allowed statuses for config changes
- Returns current status in error message for better debugging
- Added console log when config is successfully saved

**Allowed statuses for configuration:**
- `PENDING` - Match not yet started
- `READY` - Match ready to start (both players assigned)
- `SCHEDULED` - Match scheduled but not started

## Complete Umpire Flow

### Step 1: Organizer Assigns Umpire
1. Organizer goes to Draw page
2. Clicks "Assign Umpire" on a match
3. Selects umpire from dropdown
4. Clicks "Assign"

### Step 2: Umpire Receives Notification
1. Umpire receives in-app notification and email
2. Notification includes:
   - Round name (Finals, Semi Finals, etc.)
   - Match number
   - Player names (Player 1 vs Player 2)
   - Tournament name
   - Category name
   - Court number (only if assigned)

### Step 3: Umpire Configures Match
1. Umpire clicks notification → "Go to Match" button
2. Navigates to Match Configuration page (`/match/:matchId/conduct`)
3. Can configure:
   - **Points per Set**: Any number (11, 15, 21, 30, etc.)
   - **Number of Sets**: 1, 3, 5, or any number
   - **Extension (Deuce)**: Yes/No
4. Configuration is only editable if match hasn't started yet

### Step 4: Start Match
1. Umpire clicks "Start Conducting Match"
2. System saves configuration (if match not started)
3. Navigates to scoring page (`/match/:matchId/score`)
4. Umpire can now score the match with configured settings

## Error Handling

### If Match Already Started
- Frontend: Skips config save, goes directly to scoring
- Backend: Returns error but frontend handles it gracefully
- User experience: Seamless transition to scoring page

### If Match Not Found
- Shows error message
- Provides "Go Back" button

### If Not Authorized
- Shows "Not authorized" error
- Only organizer or assigned umpire can configure

## Testing Checklist

✅ Umpire receives notification when assigned
✅ Notification shows all match details correctly
✅ "Go to Match" button navigates to configuration page
✅ Can edit points per set (any number)
✅ Can edit number of sets (any number)
✅ Can toggle extension on/off
✅ Configuration saves successfully for PENDING matches
✅ Configuration saves successfully for READY matches
✅ Configuration saves successfully for SCHEDULED matches
✅ If match already IN_PROGRESS, skips config and goes to scoring
✅ Edit button disabled when match started
✅ Status indicator shows "Config Locked" when match started
✅ Scoring page loads with correct configuration

## Files Modified

1. **frontend/src/pages/ConductMatchPage.jsx**
   - Enhanced error handling in `handleStartMatch`
   - Added status check before config save
   - Added visual indicator for match status
   - Disabled Edit button for started matches

2. **backend/src/controllers/match.controller.js**
   - Made status check case-insensitive in `setMatchConfig`
   - Added `SCHEDULED` to allowed statuses
   - Added console logging for debugging
   - Returns current status in error response

## Related Files

- `frontend/src/pages/NotificationDetailPage.jsx` - Shows notification with "Go to Match" button
- `backend/src/routes/match.routes.js` - Routes for match operations
- `frontend/src/pages/MatchScoringPage.jsx` - Scoring interface

## Notes

- Configuration can only be changed BEFORE match starts
- Once match is IN_PROGRESS, configuration is locked
- Umpire can still score the match even if config save fails
- System gracefully handles all error scenarios
- Match status is case-insensitive for better compatibility
