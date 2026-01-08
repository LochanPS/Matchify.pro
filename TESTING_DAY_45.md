# Testing Day 45 - Live Matches Frontend

## Quick Test Guide

### Prerequisites
- Backend server running on port 5000
- Frontend server running on port 5173
- Socket.IO enabled on backend

---

## Test 1: Access Live Matches Page

**Steps:**
1. Open browser: `http://localhost:5173/matches/live`
2. Should see Live Matches page
3. Check WebSocket connection indicator (top of page)
   - Green dot = Connected ✅
   - Red dot = Disconnected ❌

**Expected Result:**
- Page loads successfully
- "No live matches" message if no matches exist
- Filters sidebar on left
- Connection status shows "Connected"

---

## Test 2: WebSocket Connection

**Steps:**
1. Open browser console (F12)
2. Navigate to `/matches/live`
3. Look for console message

**Expected Console Output:**
```
✅ WebSocket connected: [socket-id]
```

**If you see errors:**
- Check backend is running
- Check Socket.IO is initialized in backend
- Check CORS settings allow localhost:5173

---

## Test 3: Filters

**Steps:**
1. Click "Tournament" dropdown
2. Select a tournament (if any exist)
3. Click "Court" dropdown
4. Select a court number
5. Click "Format" dropdown
6. Select "Singles"
7. Click "Reset Filters"

**Expected Result:**
- Filters apply instantly
- Match list updates
- Reset clears all filters

---

## Test 4: Create Test Match (Optional)

If you want to test with actual live matches:

**Using Postman or curl:**

```bash
# 1. Login as umpire
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"umpire@test.com","password":"password123"}'

# Save the token from response

# 2. Start a match
curl -X POST http://localhost:5000/api/matches/12bd0602-8437-444f-969c-185992e38e46/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 3. Refresh live matches page
# Should see the match appear
```

---

## Test 5: Real-Time Updates

**Steps:**
1. Open `/matches/live` in two browser tabs (side by side)
2. If you have a live match, open scoring console in another tab
3. Score a point in the scoring console
4. Watch both live matches tabs

**Expected Result:**
- Score updates in both tabs instantly
- No page refresh needed
- Updates happen within 100ms

---

## Test 6: Match Card Interaction

**Steps:**
1. If you have live matches, click on a match card
2. Should navigate to `/matches/:id/live`
3. Click "Watch Live" button
4. Should also navigate to match details

**Expected Result:**
- Navigation works
- Match ID in URL
- (Note: Detailed match view is Day 46, so you might see 404)

---

## Test 7: Empty State

**Steps:**
1. Ensure no matches are ONGOING in database
2. Navigate to `/matches/live`

**Expected Result:**
- See empty state message
- Icon displayed
- "No live matches" text
- "Check back later or adjust your filters" message

---

## Test 8: Loading State

**Steps:**
1. Open browser DevTools → Network tab
2. Throttle network to "Slow 3G"
3. Navigate to `/matches/live`

**Expected Result:**
- See loading spinner
- Spinner disappears when data loads
- No errors

---

## Test 9: Error Handling

**Steps:**
1. Stop backend server
2. Navigate to `/matches/live`
3. Wait for request to fail

**Expected Result:**
- See error message in red box
- "Failed to load live matches. Please try again."
- No crash

---

## Test 10: Auto-Refresh

**Steps:**
1. Navigate to `/matches/live`
2. Wait 30 seconds
3. Check Network tab in DevTools

**Expected Result:**
- See new request to `/api/matches/live` every 30 seconds
- Fallback polling working
- No errors

---

## Common Issues & Fixes

### Issue 1: WebSocket Not Connecting

**Symptoms:**
- Red dot (disconnected)
- Console error: "WebSocket connection error"

**Fix:**
```javascript
// Check backend Socket.IO setup in server.js
const io = require('socket.io')(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});
```

---

### Issue 2: No Matches Showing

**Symptoms:**
- "No live matches" even though matches exist

**Fix:**
1. Check match status in database (must be "ONGOING")
2. Check API endpoint: `http://localhost:5000/api/matches/live`
3. Verify response has matches array

---

### Issue 3: Filters Not Working

**Symptoms:**
- Selecting filter doesn't change results

**Fix:**
1. Check console for errors
2. Verify matchService.js is building query params correctly
3. Check backend accepts filter parameters

---

### Issue 4: Score Not Updating

**Symptoms:**
- Match appears but score doesn't update

**Fix:**
1. Check WebSocket connection (green dot)
2. Verify backend emits score updates:
   ```javascript
   io.to(`match:${matchId}`).emit('match:scoreUpdate', score);
   ```
3. Check console for socket events

---

## Success Criteria

✅ Page loads without errors
✅ WebSocket connects (green dot)
✅ Filters work correctly
✅ Match cards display properly
✅ Real-time updates work
✅ Navigation works
✅ Loading/error/empty states work
✅ Auto-refresh works (30s)

---

## Next Steps

Once all tests pass:
- ✅ Day 45 is complete
- 🚀 Ready for Day 46 (Detailed Live Match View)

---

## Quick Commands

```bash
# Start backend
cd backend
npm run dev

# Start frontend
cd frontend
npm run dev

# Test API endpoint
curl http://localhost:5000/api/matches/live

# Check WebSocket
# Open browser console and look for connection message
```

---

**Happy Testing! 🎾**
