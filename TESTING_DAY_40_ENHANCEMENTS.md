# Testing Day 40 Enhancements

## Quick Test Guide for Scoring Console Enhancements

---

## Prerequisites
- Backend server running
- Frontend server running
- At least one match created
- User logged in as umpire or organizer

---

## Test 1: Match Timer ⏱️

### Steps:
1. Navigate to `/scoring/{matchId}`
2. Click "Start Match" if not started
3. Observe the timer component appears
4. Verify timer shows "0:00" initially
5. Wait 10 seconds
6. Verify timer updates to "0:10"
7. Wait until "1:00"
8. Verify format is correct

**Expected Results:**
- ✅ Timer appears when match starts
- ✅ Timer updates every second
- ✅ Format is MM:SS (e.g., 1:30)
- ✅ Timer is accurate

---

## Test 2: Pause Functionality ⏸️

### Steps:
1. With match ongoing, click "Pause" button
2. Observe timer stops
3. Observe pause banner appears
4. Try to click "Add Point" buttons
5. Verify buttons are disabled
6. Wait 10 seconds
7. Verify timer hasn't changed
8. Click "Resume" button
9. Observe timer resumes
10. Verify scoring buttons enabled

**Expected Results:**
- ✅ Pause button changes to Resume
- ✅ Timer stops updating
- ✅ Yellow pause banner appears
- ✅ Scoring buttons disabled
- ✅ Resume button works
- ✅ Timer continues from paused time
- ✅ Scoring buttons re-enabled

---

## Test 3: Game Point Indicator ⚠️

### Steps:
1. Start a new match
2. Score points to reach 20-15
3. Observe game point banner appears
4. Verify banner shows "GAME POINT - Player 1"
5. Verify yellow/orange gradient
6. Verify warning icons
7. Score to 21-15 (win set)
8. Continue to second set
9. Score to 20-15 again
10. Observe "MATCH POINT" banner

**Expected Results:**
- ✅ Game point banner at 20+ with lead
- ✅ Yellow/orange gradient
- ✅ Warning icons visible
- ✅ Match point banner in set 2
- ✅ Red/orange gradient with pulse
- ✅ Trophy icons bouncing
- ✅ Banner disappears when score changes

---

## Test 4: Doubles Rotation Indicator 👥

### Steps:
1. Create a doubles match (Men's Doubles or Women's Doubles)
2. Start the match
3. Verify doubles indicator appears
4. Observe Team 1 serving from right court (score 0-0)
5. Verify green pulsing dot on Player 1A
6. Score a point for Team 1 (1-0)
7. Verify server position changes to left court
8. Score a point for Team 2 (1-1)
9. Verify Team 2 now serving
10. Verify position indicator updates

**Expected Results:**
- ✅ Doubles indicator only shows for doubles matches
- ✅ Team members displayed correctly
- ✅ Serving team highlighted (green border)
- ✅ Pulsing green dot on current server
- ✅ Position changes with score (even=right, odd=left)
- ✅ Service rule reminder visible
- ✅ Server alternates between teams

---

## Test 5: Integration Test 🔄

### Steps:
1. Start a doubles match
2. Verify all components appear:
   - Match timer
   - Doubles rotation indicator
   - Score board
   - Scoring controls
3. Score to 20-15
4. Verify game point indicator appears
5. Click "Pause"
6. Verify timer stops
7. Verify scoring disabled
8. Click "Resume"
9. Score final point (21-15)
10. Verify set completion
11. Continue to second set
12. Score to 20-15
13. Verify match point indicator
14. Complete match
15. Verify all indicators disappear

**Expected Results:**
- ✅ All components work together
- ✅ No conflicts or errors
- ✅ Smooth transitions
- ✅ Proper state management
- ✅ Components appear/disappear correctly

---

## Test 6: Singles Match (No Doubles Indicator) 🎾

### Steps:
1. Create a singles match (Men's Singles or Women's Singles)
2. Start the match
3. Verify doubles indicator does NOT appear
4. Verify timer appears
5. Score to 20-15
6. Verify game point indicator appears
7. Complete match normally

**Expected Results:**
- ✅ No doubles indicator for singles
- ✅ Timer works normally
- ✅ Game point indicator works
- ✅ All other features work

---

## Test 7: Long Match Duration ⏰

### Steps:
1. Start a match
2. Manually adjust system time forward 1 hour (or wait)
3. Refresh page
4. Verify timer shows correct duration
5. Verify format changes to H:MM:SS

**Expected Results:**
- ✅ Timer persists across refresh
- ✅ Duration calculated from startedAt
- ✅ Format changes to H:MM:SS after 1 hour
- ✅ Accurate time display

---

## Test 8: Edge Cases 🔍

### Test 8a: Deuce Scenario (20-20)
1. Score to 20-20
2. Verify game point indicator appears for leading player
3. Score to 21-20
4. Verify game point for player with 21
5. Score to 21-21
6. Verify game point disappears
7. Score to 22-21
8. Verify game point reappears

### Test 8b: Golden Point (29-29)
1. Score to 29-29
2. Verify game point indicator
3. Score to 30-29
4. Verify set ends immediately

### Test 8c: Pause During Game Point
1. Reach game point (20-15)
2. Click pause
3. Verify game point indicator still visible
4. Verify scoring disabled
5. Resume
6. Verify can score again

**Expected Results:**
- ✅ Game point logic handles deuce correctly
- ✅ Golden point works (30-29 wins)
- ✅ Pause doesn't affect indicators
- ✅ All edge cases handled

---

## Test 9: Responsive Design 📱

### Steps:
1. Open scoring console on desktop
2. Resize to tablet width (768px)
3. Verify layout adjusts
4. Resize to mobile width (< 768px)
5. Verify all components stack properly
6. Test all buttons work on mobile
7. Verify text is readable

**Expected Results:**
- ✅ Desktop: Full horizontal layout
- ✅ Tablet: Optimized spacing
- ✅ Mobile: Single column, stacked
- ✅ All buttons touch-friendly
- ✅ Text remains readable
- ✅ No horizontal scroll

---

## Test 10: Performance ⚡

### Steps:
1. Start a match
2. Open browser DevTools
3. Monitor CPU usage
4. Monitor memory usage
5. Let timer run for 5 minutes
6. Score 50+ points
7. Verify no memory leaks
8. Verify smooth animations

**Expected Results:**
- ✅ CPU usage < 5%
- ✅ Memory stable (no leaks)
- ✅ Timer updates smoothly
- ✅ No lag or stuttering
- ✅ Animations smooth

---

## Console Checks 🖥️

### Browser Console
Look for:
```
✅ No errors
✅ No warnings
✅ WebSocket connected
✅ Score updates logged
```

### Network Tab
Verify:
```
✅ No failed requests
✅ WebSocket connection active
✅ API calls successful
```

---

## Common Issues & Solutions 🔧

### Issue 1: Timer not updating
**Solution:**
- Check match status is "ONGOING"
- Verify startedAt timestamp exists
- Check browser console for errors
- Refresh page

### Issue 2: Doubles indicator not showing
**Solution:**
- Verify match category format includes "doubles"
- Check isDoubles state in React DevTools
- Ensure category data loaded correctly

### Issue 3: Game point not appearing
**Solution:**
- Verify score is 20+ with lead
- Check score.currentScore exists
- Verify sets array populated
- Check console for errors

### Issue 4: Pause not working
**Solution:**
- Check isPaused state
- Verify pause/resume handlers called
- Check disabled prop on scoring buttons
- Refresh if state stuck

---

## Success Criteria ✅

All tests should pass with:
- ✅ No console errors
- ✅ All components render correctly
- ✅ Timer accurate and updates smoothly
- ✅ Pause/Resume works perfectly
- ✅ Game point detection accurate
- ✅ Match point detection accurate
- ✅ Doubles rotation correct
- ✅ Responsive on all devices
- ✅ Performance acceptable
- ✅ No memory leaks

---

## Quick Smoke Test (5 minutes) 🚀

1. Start a match → Timer appears ✅
2. Click Pause → Timer stops ✅
3. Click Resume → Timer continues ✅
4. Score to 20-15 → Game point appears ✅
5. Complete set → New set starts ✅
6. Score to 20-15 in set 2 → Match point appears ✅
7. Complete match → Winner shown ✅

If all 7 steps pass, Day 40 enhancements are working! 🎉

---

**Happy Testing! 🎾**
