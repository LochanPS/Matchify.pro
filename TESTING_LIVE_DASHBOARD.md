# Testing Live Tournament Dashboard (Day 39)

## Quick Test Guide

### Prerequisites
- Backend server running on port 5000
- Frontend server running on port 5173
- At least one tournament with matches created
- Socket.IO connection working

---

## Test 1: Access Dashboard

### Steps:
1. Get a tournament ID from your database or create a tournament
2. Navigate to: `http://localhost:5173/tournament/{tournamentId}/live`
3. Dashboard should load and display

### Expected Results:
- ✅ Dashboard loads without errors
- ✅ Stats cards show correct counts
- ✅ Matches display in grid layout
- ✅ Filter buttons are visible
- ✅ Live indicator appears (red pulsing dot)

---

## Test 2: Real-Time Match Updates

### Steps:
1. Open dashboard in Browser 1: `/tournament/{tournamentId}/live`
2. Open scoring console in Browser 2: `/scoring/{matchId}`
3. In Browser 2, start the match
4. Watch Browser 1 for updates

### Expected Results:
- ✅ Dashboard in Browser 1 updates automatically
- ✅ Match status changes from PENDING to ONGOING
- ✅ Stats card updates (ongoing count increases)
- ✅ No page refresh needed
- ✅ Update happens within 1 second

---

## Test 3: Score Updates

### Steps:
1. Keep both browsers open from Test 2
2. In Browser 2 (scoring console), add points to player 1
3. Add points to player 2
4. Watch Browser 1 (dashboard) for updates

### Expected Results:
- ✅ Dashboard refreshes match list after each point
- ✅ Match card shows updated information
- ✅ Live indicator stays active
- ✅ No errors in console

---

## Test 4: Match Completion

### Steps:
1. Continue from Test 3
2. Complete the match (win 2 sets)
3. Watch dashboard update

### Expected Results:
- ✅ Match status changes to COMPLETED
- ✅ Stats update (ongoing -1, completed +1)
- ✅ Match card shows green "COMPLETED" badge
- ✅ Dashboard updates automatically

---

## Test 5: Filter Functionality

### Steps:
1. On dashboard, click "Ongoing" filter button
2. Click "Completed" filter button
3. Click "Pending" filter button
4. Click "All" filter button

### Expected Results:
- ✅ Ongoing: Shows only ongoing matches
- ✅ Completed: Shows only completed matches
- ✅ Pending: Shows only pending/ready matches
- ✅ All: Shows all matches
- ✅ Filter buttons highlight when active
- ✅ Counts in buttons are correct

---

## Test 6: Multiple Matches

### Steps:
1. Create/start 3 different matches
2. Open dashboard
3. Start match 1 in scoring console
4. Start match 2 in another tab
5. Complete match 3

### Expected Results:
- ✅ All 3 matches show on dashboard
- ✅ Each status update reflects correctly
- ✅ Stats cards update for each change
- ✅ No performance issues
- ✅ All updates happen in real-time

---

## Test 7: Click to Watch

### Steps:
1. On dashboard, click any match card
2. Should navigate to spectator view

### Expected Results:
- ✅ Navigates to `/watch/{matchId}`
- ✅ Spectator view loads
- ✅ Match details display correctly

---

## Test 8: Connection Status

### Steps:
1. Open dashboard
2. Note the live indicator (red dot)
3. Stop the backend server
4. Wait 5 seconds
5. Start the backend server

### Expected Results:
- ✅ Live indicator shows when connected
- ✅ Indicator disappears when disconnected
- ✅ Auto-reconnects when server restarts
- ✅ Dashboard resumes updates after reconnection

---

## Test 9: Responsive Design

### Steps:
1. Open dashboard on desktop
2. Resize browser to tablet size
3. Resize to mobile size

### Expected Results:
- ✅ Desktop: 3 column grid
- ✅ Tablet: 2 column grid
- ✅ Mobile: 1 column grid
- ✅ Stats cards stack properly
- ✅ All elements remain readable

---

## Test 10: Empty States

### Steps:
1. Create a new tournament with no matches
2. Open dashboard for that tournament
3. Try each filter

### Expected Results:
- ✅ Shows "No matches found" message
- ✅ Empty state icon displays
- ✅ Stats show all zeros
- ✅ No errors in console
- ✅ Filter buttons still work

---

## Console Checks

### Browser Console (Frontend)
Look for these messages:
```
✅ "Client connected: {socketId}"
✅ "Socket {socketId} joined tournament:{tournamentId}"
✅ "Tournament match update: {data}"
```

### Server Console (Backend)
Look for these messages:
```
✅ "Client connected: {socketId}"
✅ "Socket {socketId} joined tournament:{tournamentId}"
✅ "Broadcasted tournament-match-update to tournament:{tournamentId}"
```

---

## Common Issues & Solutions

### Issue 1: Dashboard not updating
**Solution:**
- Check WebSocket connection in browser console
- Verify backend Socket.IO is running
- Check tournament ID is correct
- Ensure match belongs to the tournament

### Issue 2: Live indicator not showing
**Solution:**
- Check Socket.IO connection
- Verify `isLiveConnected` state updates
- Check WebSocket events are firing
- Restart both servers

### Issue 3: Stats not updating
**Solution:**
- Check `fetchMatches()` is called on updates
- Verify API endpoint returns correct data
- Check match status values in database
- Ensure tournament ID matches

### Issue 4: Filters not working
**Solution:**
- Check filter state updates
- Verify match status values
- Check `filteredMatches` logic
- Ensure status values match exactly

---

## Performance Checks

### Load Time
- Dashboard should load in < 500ms
- Initial match fetch < 300ms
- WebSocket connection < 100ms

### Update Latency
- Score updates should appear < 50ms
- Status changes < 100ms
- Stats recalculation instant

### Memory Usage
- No memory leaks on long sessions
- WebSocket cleanup on unmount
- Event listeners properly removed

---

## API Endpoints Used

```
GET /api/tournaments/:tournamentId/matches
- Fetches all matches for tournament
- Returns array of matches with scores
- Public endpoint (no auth required)
```

---

## WebSocket Events

### Emitted by Client:
```javascript
'join-tournament' - Join tournament room
'leave-tournament' - Leave tournament room
```

### Received by Client:
```javascript
'tournament-match-update' - Match status changed
  - action: 'started' | 'score-updated' | 'completed'
  - matchId: Match ID
  - status: Current status
  - score: Score data (optional)
  - winner: Winner data (optional)
```

---

## Success Criteria

All tests should pass with:
- ✅ No console errors
- ✅ Real-time updates working
- ✅ Filters functioning correctly
- ✅ Stats accurate
- ✅ Responsive design working
- ✅ WebSocket connection stable
- ✅ Performance acceptable

---

## Next Steps

After successful testing:
1. Test with multiple tournaments
2. Test with high match count (50+ matches)
3. Test with multiple concurrent users
4. Test network interruptions
5. Test on different devices

---

**Happy Testing! 🎾**
