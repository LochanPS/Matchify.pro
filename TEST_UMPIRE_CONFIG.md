# Test Guide: Umpire Match Configuration

## Prerequisites
- Backend running on port 5000
- Frontend running on port 5173
- At least one tournament with a draw generated
- User with UMPIRE role (e.g., meow@gmail.com)
- User with ORGANIZER role

## Test Scenario 1: Fresh Match Configuration

### Step 1: Assign Umpire (as Organizer)
1. Login as organizer
2. Go to tournament draw page
3. Find a match with status "PENDING" or "READY"
4. Click "Assign Umpire"
5. Select "Meow" from dropdown
6. Click "Assign"
7. **Expected**: Success message "Umpire assigned and notified"

### Step 2: Check Notification (as Umpire)
1. Logout and login as meow@gmail.com
2. Click notification bell icon
3. **Expected**: See notification "⚖️ Match Assignment"
4. Click the notification
5. **Expected**: See match details:
   - Round name (e.g., "Quarter Finals")
   - Match number
   - Player 1 vs Player 2
   - Tournament name
   - Category name
   - Court (only if assigned)

### Step 3: Configure Match
1. Click "Go to Match" button
2. **Expected**: Navigate to match configuration page
3. **Expected**: See current scoring format displayed
4. Click "Edit" button
5. **Expected**: See configuration controls:
   - Points per Set (with +/- buttons)
   - Number of Sets (with +/- buttons)
   - Extension toggle (Yes/No)

### Step 4: Change Configuration
1. Change points per set to 15
2. Change number of sets to 1
3. Toggle extension to "No"
4. Click "Done"
5. **Expected**: Configuration displayed as:
   - Points per Set: 15
   - Sets: 1 Set
   - Extension: No

### Step 5: Start Match
1. Click "Start Conducting Match" button
2. **Expected**: 
   - No errors
   - Navigate to scoring page
   - Scoring page shows correct configuration (15 points, 1 set, no extension)

### Step 6: Verify in Console
1. Open browser console
2. **Expected**: See log "✅ Match config saved successfully"

## Test Scenario 2: Match Already Started

### Step 1: Start a Match
1. As umpire, start a match and add a few points
2. Navigate back to notifications

### Step 2: Try to Configure
1. Click the same match notification
2. Click "Go to Match"
3. **Expected**: See "Match Started - Config Locked" badge
4. **Expected**: "Edit" button is disabled/hidden
5. Click "Start Conducting Match"
6. **Expected**: 
   - Navigate directly to scoring page
   - No config save attempt
   - Console shows "⚠️ Match already started, skipping config save"

## Test Scenario 3: Different Match Statuses

### Test with PENDING status
1. Find match with status "PENDING"
2. Assign umpire
3. Configure match
4. **Expected**: Config saves successfully

### Test with READY status
1. Find match with status "READY"
2. Assign umpire
3. Configure match
4. **Expected**: Config saves successfully

### Test with SCHEDULED status
1. Find match with status "SCHEDULED"
2. Assign umpire
3. Configure match
4. **Expected**: Config saves successfully

### Test with IN_PROGRESS status
1. Find match with status "IN_PROGRESS"
2. Try to configure
3. **Expected**: 
   - Edit button disabled
   - "Config Locked" message shown
   - Can still go to scoring page

## Expected Console Logs

### Frontend (Browser Console)
```
✅ Match config saved successfully
```
OR
```
⚠️ Config not saved (match may have started): Cannot change config after match has started
⚠️ Match already started, skipping config save. Status: IN_PROGRESS
```

### Backend (Terminal)
```
✅ Umpire Meow assigned to Quarter Finals - Match #4 and notified
✅ Match config saved for match abc123: { pointsPerSet: 15, maxSets: 1, setsToWin: 1, extension: false }
```

## Common Issues and Solutions

### Issue: "Cannot change config after match has started"
**Solution**: This is expected if match is already IN_PROGRESS. The system will skip config save and go directly to scoring.

### Issue: Notification not received
**Solution**: 
1. Check backend logs for notification creation
2. Verify umpire email is correct
3. Check notification service is running

### Issue: "Go to Match" button not showing
**Solution**: 
1. Verify notification type is "MATCH_ASSIGNED"
2. Check notification data includes matchId
3. Refresh the page

### Issue: Configuration not saving
**Solution**:
1. Check match status (must be PENDING, READY, or SCHEDULED)
2. Verify user is authorized (organizer or assigned umpire)
3. Check backend logs for errors

## Success Criteria

✅ Umpire receives notification when assigned
✅ Notification shows all match details
✅ Can navigate to configuration page
✅ Can edit all configuration options
✅ Configuration saves for fresh matches
✅ System handles already-started matches gracefully
✅ No errors in console
✅ Scoring page uses configured settings
✅ Edit button disabled for started matches
✅ Clear status indicators shown

## Restart Backend

If you made changes to backend code, restart the backend:

```bash
cd MATCHIFY.PRO/matchify/backend
npm start
```

Or use the batch file:
```bash
cd MATCHIFY.PRO/matchify
start-backend.bat
```

## Notes

- Configuration is saved in match.scoreJson field
- Configuration includes: pointsPerSet, maxSets, setsToWin, extension
- Once match starts (IN_PROGRESS), configuration cannot be changed
- System gracefully handles all error scenarios
- No need to restart frontend (React hot reload)
