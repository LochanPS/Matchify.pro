# Testing WebSocket Live Updates (Day 38)

## Quick Start

### 1. Start Backend Server
```bash
cd matchify/backend
npm start
```

You should see:
```
✅ Socket.IO initialized
╔═══════════════════════════════════════╗
║      MATCHIFY SERVER STARTED 🎾      ║
║  WebSocket: ✅ Enabled                ║
╚═══════════════════════════════════════╝
🔴 WebSocket: ws://localhost:5000
```

### 2. Start Frontend Server
```bash
cd matchify/frontend
npm run dev
```

---

## Test Scenarios

### Scenario 1: Real-Time Score Updates

**Setup:**
1. Get a match ID (use `node get-match-id.js`)
2. Open two browser windows side by side

**Window 1 - Umpire (Scoring Console):**
```
http://localhost:5173/scoring/MATCH_ID
```
- Login as organizer
- Start the match
- Click "Add Point" buttons

**Window 2 - Spectator (Watch View):**
```
http://localhost:5173/watch/MATCH_ID
```
- No login required
- Just watch

**Expected:**
- ✅ Both windows show same score
- ✅ Spectator view updates instantly when umpire scores
- ✅ Red "LIVE" indicator appears in both windows
- ✅ No page refresh needed
- ✅ Updates happen in < 1 second

**Visual Check:**
```
Umpire clicks "Player 1" → Score changes to 1-0
Spectator sees → Score updates to 1-0 instantly
Both show → Red pulsing "LIVE" indicator
```

---

### Scenario 2: Multiple Viewers

**Setup:**
1. Open spectator view in 3 different browsers:
   - Chrome: `http://localhost:5173/watch/MATCH_ID`
   - Firefox: `http://localhost:5173/watch/MATCH_ID`
   - Edge: `http://localhost:5173/watch/MATCH_ID`

2. Open scoring console in one browser:
   - `http://localhost:5173/scoring/MATCH_ID`

**Test:**
1. Score 5 points in scoring console
2. Watch all 3 spectator views

**Expected:**
- ✅ All 3 viewers update simultaneously
- ✅ No lag between viewers
- ✅ All show "LIVE" indicator
- ✅ All show same score
- ✅ No performance issues

---

### Scenario 3: Connection Status

**Test Connection Loss:**
1. Open spectator view
2. Stop backend server (`Ctrl+C`)
3. Observe UI

**Expected:**
- ✅ Yellow "Connecting..." banner appears
- ✅ "LIVE" indicator disappears
- ✅ Message: "Connecting to live updates..."

**Test Reconnection:**
1. Start backend server again
2. Wait a few seconds

**Expected:**
- ✅ Connection restores automatically
- ✅ "LIVE" indicator returns
- ✅ Yellow banner disappears
- ✅ Score syncs correctly

---

### Scenario 4: Match Completion

**Setup:**
1. Open scoring console
2. Open spectator view in another tab

**Test:**
1. Score a complete match (2 sets)
2. Watch both views

**Expected:**
- ✅ Both views show completion banner
- ✅ "🏆 Match Complete! 🏆" message
- ✅ Winner announced
- ✅ Scoring controls disabled
- ✅ WebSocket broadcasts completion

**Visual Check:**
```
┌─────────────────────────────────────────┐
│     🏆 Match Complete! 🏆               │
│        Player 1 wins!                   │
└─────────────────────────────────────────┘
```

---

### Scenario 5: Undo with Live Updates

**Setup:**
1. Scoring console + spectator view open

**Test:**
1. Score 5 points for Player 1
2. Click "Undo Last Point"
3. Watch spectator view

**Expected:**
- ✅ Spectator view reverts to 4-0
- ✅ Update happens instantly
- ✅ Both views stay in sync
- ✅ No errors in console

---

### Scenario 6: Browser Console Logs

**Open Browser Console (F12):**

**Expected Logs:**
```
✅ Socket connected: abc123
Socket abc123 joined match:xyz789
Live score update: { matchId: "xyz789", score: {...} }
```

**On Score Update:**
```
Live score update: {
  matchId: "xyz789",
  score: {
    currentScore: { player1: 5, player2: 3 },
    currentSet: 1,
    ...
  },
  timestamp: "2025-12-27T..."
}
```

**On Disconnect:**
```
❌ Socket disconnected
```

**On Reconnect:**
```
✅ Socket connected: def456
```

---

## Backend Console Logs

**Expected Output:**

**On Client Connect:**
```
Client connected: abc123
Socket abc123 joined match:xyz789
```

**On Score Update:**
```
Broadcasted score update for match:xyz789
```

**On Match Complete:**
```
Broadcasted match completion for match:xyz789
```

**On Client Disconnect:**
```
Client disconnected: abc123
```

---

## Verification Checklist

### WebSocket Connection
- [ ] Backend shows "Socket.IO initialized"
- [ ] Frontend connects automatically
- [ ] Console shows "Socket connected"
- [ ] "LIVE" indicator appears

### Real-Time Updates
- [ ] Score updates instantly
- [ ] No page refresh needed
- [ ] Latency < 1 second
- [ ] All viewers update simultaneously

### Connection Management
- [ ] Auto-reconnection works
- [ ] Connection status displayed
- [ ] Cleanup on page close
- [ ] No memory leaks

### Events
- [ ] score-update event works
- [ ] match-complete event works
- [ ] match-status event works
- [ ] Room join/leave works

### UI Indicators
- [ ] "LIVE" indicator shows when connected
- [ ] "Connecting..." shows when disconnected
- [ ] Pulsing red dot animates
- [ ] Connection status accurate

---

## Troubleshooting

### Issue: "LIVE" indicator doesn't appear

**Check:**
1. Backend server running?
2. Socket.IO initialized?
3. Browser console for errors?
4. CORS configured correctly?

**Solution:**
```bash
# Restart backend
cd matchify/backend
npm start

# Check console for:
✅ Socket.IO initialized
```

---

### Issue: Updates not received

**Check:**
1. Client joined match room?
2. Backend broadcasting?
3. Network tab shows WebSocket connection?

**Solution:**
```javascript
// Check browser console
socket.emit('join-match', matchId);
// Should see: "Socket abc123 joined match:xyz789"
```

---

### Issue: Connection keeps dropping

**Check:**
1. Firewall blocking WebSocket?
2. Proxy interfering?
3. Backend stable?

**Solution:**
- Check backend logs for errors
- Verify CORS settings
- Test on localhost first

---

### Issue: Multiple connections

**Check:**
1. Cleanup function called?
2. useEffect dependencies correct?

**Solution:**
```javascript
useEffect(() => {
  const cleanup = joinMatch(...);
  return cleanup; // Important!
}, [matchId]);
```

---

## Performance Testing

### Load Test: 100 Viewers

**Setup:**
1. Open 100 browser tabs (use script)
2. All watching same match
3. Score points rapidly

**Expected:**
- ✅ All tabs update
- ✅ No lag
- ✅ CPU usage reasonable
- ✅ Memory stable

### Stress Test: Multiple Matches

**Setup:**
1. 10 matches running simultaneously
2. 10 viewers per match
3. All scoring at once

**Expected:**
- ✅ Room isolation works
- ✅ No cross-contamination
- ✅ Each match independent
- ✅ Performance stable

---

## Success Criteria

Day 38 is complete when:
- ✅ WebSocket server running
- ✅ Clients connect automatically
- ✅ Score updates broadcast instantly
- ✅ Multiple viewers supported
- ✅ Spectator view works
- ✅ Live indicator shows
- ✅ Connection status accurate
- ✅ Auto-reconnection works
- ✅ Match completion broadcasts
- ✅ No console errors
- ✅ Performance good

---

## Next Steps (Day 39)

After verifying WebSocket works:
1. Build live tournament dashboard
2. Add multiple matches view
3. Implement court assignments
4. Add match scheduling
5. Create umpire assignments

---

**Happy Testing! 🎾🔴**
