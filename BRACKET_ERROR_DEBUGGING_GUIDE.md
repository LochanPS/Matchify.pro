# Bracket Loading Error - Debugging Guide

## Current Status

Enhanced error logging has been added to both DrawPage and ConductMatchPage to identify root causes of 404 errors.

## Issues Being Debugged

### Issue 1: DrawPage - "Failed to load bracket"
The organizer Draw page shows "Failed to load bracket" error after refresh.

### Issue 2: ConductMatchPage - Match not found (404)
The conduct match page shows 404 error when trying to load match details.

## Console Logs to Check

After refreshing the DrawPage, look for these console messages:

### 1. Category Initialization
```
✅ Active category set: [categoryId] [categoryName]
```
This confirms the category loaded correctly.

### 2. Bracket Fetch Attempt
```
🔄 Fetching bracket for: Object
  tournamentId: "..."
  categoryId: "..."
  categoryName: "..."
```
This shows the API call is being made with correct parameters.

### 3. Error Details (EXPAND THIS OBJECT)
```
📋 Full Error Details: Object
```
**IMPORTANT**: Click the arrow to expand this object and check:
- `status`: HTTP status code (404, 500, etc.)
- `statusText`: HTTP status text
- `responseData`: The actual error message from the server
- `url`: The API endpoint that was called
- `message`: The error message

### 4. Specific Error Type
Look for one of these:
- `🔴 Server Response Error` - Server returned an error
- `🔴 No Response Received (Network Error)` - Cannot reach server
- `🔴 Request Setup Error` - Problem with the request itself

## Common Error Scenarios

### Scenario 1: Draw Not Created Yet (404)
```
ℹ️ Draw not found (404) - This is normal if draw hasn't been created yet
ℹ️ Showing "Draw Not Generated Yet" message
```
**Solution**: This is expected. Create a draw using the "Create Draw" button.

### Scenario 2: Network Error
```
⚠️ Network error - Cannot reach server
```
**Possible causes**:
- Backend server is down
- Wrong API URL in frontend config
- CORS issues
- Network connectivity problems

**Solution**: 
1. Check if backend is running
2. Verify API URL in `frontend/src/utils/api.js`
3. Check browser network tab for failed requests

### Scenario 3: Server Error (500)
```
🔴 Server Response Error:
  status: 500
  data: { error: "..." }
```
**Possible causes**:
- Database query error
- Missing data in database
- Backend code error

**Solution**: Check backend logs for the actual error.

### Scenario 4: Draw Exists But Bracket JSON is Corrupted
```
✅ Draw API response: { draw: {...} }
⚠️ No bracketJson in draw data
```
**Solution**: The draw exists but `bracketJson` field is null or invalid. Need to regenerate the draw.

## What to Do Next

1. **Open browser console** (F12)
2. **Refresh the DrawPage**
3. **Expand the error objects** (click the arrows)
4. **Copy the full error details** and share them

Look specifically for:
- The HTTP status code
- The `responseData.error` message
- The API URL that was called

## Expected Flow (When Working)

```
🔄 useEffect triggered - fetchTournamentData
✅ Tournament data fetched: [Tournament Name]
✅ Categories fetched: [N] categories
✅ Active category set: [categoryId] [categoryName]
🔄 useEffect triggered - fetchBracket
✅ Both tournamentId and activeCategory ready, fetching bracket...
🔄 Fetching bracket for: Object
✅ Draw API response: { draw: {...} }
✅ Bracket parsed successfully: { format: "KNOCKOUT", hasRounds: true }
✅ Matches fetched: [N]
```

## Files Modified

- `frontend/src/pages/DrawPage.jsx` - Enhanced error logging and handling
- `frontend/src/pages/ConductMatchPage.jsx` - Enhanced error logging and handling
- `backend/src/controllers/match-lifecycle.controller.js` - Fixed to return 404 instead of 500 for "Match not found"

## Common Causes and Solutions

### For DrawPage 404 Error

**Cause 1: Draw hasn't been created yet**
- This is normal and expected
- Solution: Click "Create Draw" button

**Cause 2: Draw was deleted**
- Check if draw exists in database
- Solution: Recreate the draw

**Cause 3: Wrong category ID in URL**
- Check the URL parameters
- Solution: Navigate from tournament page to ensure correct category ID

### For ConductMatchPage 404 Error

**Cause 1: Match doesn't exist in database**
- Match may not have been created yet
- Solution: Ensure draw is created and players are assigned

**Cause 2: Wrong match ID in URL**
- Check the URL parameters
- Solution: Navigate from draw page to ensure correct match ID

**Cause 3: Match was deleted**
- Check if match exists in database
- Solution: Recreate the draw or contact support

## Next Steps

Based on the console error details, we can:
1. Fix backend API if it's returning an error
2. Fix database query if data is missing
3. Fix network configuration if it's a connectivity issue
4. Regenerate draw if bracket JSON is corrupted
