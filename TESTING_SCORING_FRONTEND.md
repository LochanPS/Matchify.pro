# Testing the Scoring Frontend (Day 37)

## Quick Start

### 1. Start Backend Server
```bash
cd matchify/backend
npm start
```
Server: http://localhost:5000

### 2. Start Frontend Server
```bash
cd matchify/frontend
npm run dev
```
Frontend: http://localhost:5173

### 3. Login as Organizer
- Navigate to: http://localhost:5173/login
- Email: testorganizer@matchify.com
- Password: password123

---

## Test Scenarios

### Scenario 1: Access Scoring Console

**Steps:**
1. Get a match ID from the database or API
2. Navigate to: http://localhost:5173/scoring/MATCH_ID
3. You should see the scoring console

**Expected:**
- ✅ Match info displays (tournament, category, round)
- ✅ Status badge shows "PENDING" or "READY"
- ✅ "Start Match" button visible
- ✅ Player information displays
- ✅ No score board yet (match not started)

---

### Scenario 2: Start a Match

**Steps:**
1. On the scoring console page
2. Click "Start Match" button
3. Wait for response

**Expected:**
- ✅ Button shows loading state
- ✅ Score board appears
- ✅ Score shows 0-0
- ✅ Current set shows "Set 1"
- ✅ Server indicator shows (yellow pulsing dot)
- ✅ Scoring controls appear
- ✅ Two large buttons: "Player 1" and "Player 2"
- ✅ Undo button appears

**Visual Check:**
```
┌─────────────────────────────────────────┐
│  Sets Won: ○ ○ ○     ○ ○ ○ :Sets Won   │
│                                         │
│  ● Player 1        :        Player 2    │
│      0                         0        │
│                                         │
│  Set 1 • Player 1 serving               │
└─────────────────────────────────────────┘
```

---

### Scenario 3: Score Points

**Steps:**
1. Click "Player 1" button
2. Observe score change
3. Click "Player 1" button 4 more times (total 5 points)
4. Click "Player 2" button 3 times

**Expected After Each Click:**
- ✅ Score updates immediately
- ✅ Server indicator changes
- ✅ Point added to history
- ✅ Button shows brief loading state
- ✅ No page refresh

**Final Score:**
- Player 1: 5
- Player 2: 3
- Server: Should alternate

**Visual Check:**
```
┌─────────────────────────────────────────┐
│  ● Player 1        :        Player 2    │
│      5                         3        │
└─────────────────────────────────────────┘
```

---

### Scenario 4: Undo Last Point

**Steps:**
1. After scoring 5-3
2. Click "Undo Last Point" button
3. Observe changes

**Expected:**
- ✅ Score reverts to 5-2
- ✅ Server recalculated
- ✅ Last point removed from history
- ✅ Button shows loading state
- ✅ Success feedback

---

### Scenario 5: Complete a Set

**Steps:**
1. Continue clicking "Player 1" button
2. Score until Player 1 reaches 21
3. Observe set completion

**Expected:**
- ✅ Set completes at 21 points (with 2-point lead)
- ✅ Trophy icon appears in "Sets Won" for Player 1
- ✅ Completed set shows in history
- ✅ New set starts automatically
- ✅ Score resets to 0-0
- ✅ Current set shows "Set 2"
- ✅ Winner of previous set serves first

**Visual Check:**
```
┌─────────────────────────────────────────┐
│  Sets Won: 🏆 ○ ○     ○ ○ ○ :Sets Won  │
│                                         │
│  ● Player 1        :        Player 2    │
│      0                         0        │
│                                         │
│  Completed Sets                         │
│  Set 1: 21-10 (Player 1 won)           │
│                                         │
│  Set 2 • Player 1 serving               │
└─────────────────────────────────────────┘
```

---

### Scenario 6: Complete a Match

**Steps:**
1. Continue scoring Set 2
2. Player 1 wins Set 2 (21 points)
3. Observe match completion

**Expected:**
- ✅ Match completion banner appears
- ✅ "🏆 Match Complete! 🏆" message
- ✅ Winner announced: "Player 1 wins!"
- ✅ Scoring controls change to completion state
- ✅ Trophy icon shown
- ✅ Both sets shown in history
- ✅ Status badge changes to "COMPLETED"

**Visual Check:**
```
┌─────────────────────────────────────────┐
│     🏆 Match Complete! 🏆               │
│        Player 1 wins!                   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Sets Won: 🏆 🏆 ○     ○ ○ ○ :Sets Won │
│                                         │
│  Completed Sets                         │
│  Set 1: 21-10 (Player 1 won)           │
│  Set 2: 21-15 (Player 1 won)           │
└─────────────────────────────────────────┘
```

---

### Scenario 7: View Point History

**Steps:**
1. Scroll down to "Point History" section
2. Observe the timeline

**Expected:**
- ✅ All points listed in reverse order (latest first)
- ✅ Each point shows:
  - Point number (#1, #2, etc.)
  - Player who scored (color-coded)
  - Score at that point (5-3, 6-3, etc.)
  - Set number
- ✅ Scrollable if many points
- ✅ Clean, readable layout

**Visual Check:**
```
┌─────────────────────────────────────────┐
│  Point History                          │
├─────────────────────────────────────────┤
│  #42  Player 1          21-15  Set 2    │
│  #41  Player 1          20-15  Set 2    │
│  #40  Player 2          19-15  Set 2    │
│  #39  Player 1          19-14  Set 2    │
│  ...                                    │
└─────────────────────────────────────────┘
```

---

### Scenario 8: Test Deuce (20-20)

**Steps:**
1. Start a new match
2. Score to 20-20
3. Continue scoring alternately

**Expected:**
- ✅ Game doesn't end at 21-20
- ✅ Continues until 2-point lead
- ✅ Example: 22-20, 23-21, 24-22
- ✅ Score updates correctly
- ✅ Set completes only with 2-point lead

---

### Scenario 9: Test Golden Point (29-29)

**Steps:**
1. Score to 29-29
2. Add one more point

**Expected:**
- ✅ Game ends at 30-29
- ✅ No 2-point lead required
- ✅ Set completes immediately
- ✅ Winner determined

---

### Scenario 10: Test Error Handling

**Test 1: No Authentication**
1. Logout
2. Try to access /scoring/:matchId
3. Should redirect to login

**Test 2: Invalid Match ID**
1. Navigate to /scoring/invalid-id
2. Should show "Match not found" error

**Test 3: Network Error**
1. Stop backend server
2. Try to add a point
3. Should show error message in red banner

**Expected:**
- ✅ Error messages display clearly
- ✅ Red alert banner
- ✅ Error icon
- ✅ Descriptive message
- ✅ Retry option available

---

### Scenario 11: Test Refresh

**Steps:**
1. During an ongoing match
2. Click "Refresh" button (top right)
3. Observe behavior

**Expected:**
- ✅ Match data reloads
- ✅ Score updates from server
- ✅ Loading spinner shows
- ✅ No data loss
- ✅ Current state preserved

---

### Scenario 12: Test Back Navigation

**Steps:**
1. On scoring console
2. Click "Back" button (top left)
3. Should navigate to previous page

**Expected:**
- ✅ Returns to previous page
- ✅ No errors
- ✅ Smooth transition

---

## Responsive Testing

### Mobile (< 768px)

**Test:**
1. Open on mobile device or resize browser
2. Verify layout

**Expected:**
- ✅ Score numbers readable (smaller but clear)
- ✅ Buttons stack vertically
- ✅ Touch-friendly button size
- ✅ No horizontal scroll
- ✅ All content visible
- ✅ Server indicator visible

### Tablet (768px - 1024px)

**Test:**
1. Resize to tablet width
2. Verify layout

**Expected:**
- ✅ Two-column button layout
- ✅ Optimized spacing
- ✅ Readable text
- ✅ Good use of space

### Desktop (> 1024px)

**Test:**
1. Full desktop view
2. Verify layout

**Expected:**
- ✅ Large score numbers (7xl)
- ✅ Full-width layout
- ✅ Maximum readability
- ✅ Hover effects work
- ✅ Beautiful spacing

---

## Visual Verification Checklist

### Colors
- [ ] Player 1 button: Blue (#2563EB)
- [ ] Player 2 button: Green (#10B981)
- [ ] Undo button: Orange (#F97316)
- [ ] ScoreBoard: Blue gradient
- [ ] Server indicator: Yellow (pulsing)
- [ ] Trophy icons: Yellow/Gold
- [ ] Status badges: Correct colors

### Typography
- [ ] Score numbers: Large and bold
- [ ] Player names: Clear and readable
- [ ] Set numbers: Visible
- [ ] History: Monospace for scores

### Animations
- [ ] Server indicator pulses
- [ ] Buttons scale on hover
- [ ] Buttons scale on click
- [ ] Smooth transitions
- [ ] Loading spinners

### Layout
- [ ] Centered content
- [ ] Proper spacing
- [ ] No overlapping elements
- [ ] Responsive breakpoints work
- [ ] Scrolling works

---

## Performance Testing

### Load Time
- [ ] Page loads in < 2 seconds
- [ ] Match data fetches quickly
- [ ] No lag on button clicks
- [ ] Smooth animations

### Updates
- [ ] Score updates instantly
- [ ] No delay on point addition
- [ ] Undo is immediate
- [ ] History updates smoothly

---

## Accessibility Testing

### Keyboard Navigation
- [ ] Tab through buttons
- [ ] Enter/Space to click
- [ ] Focus indicators visible
- [ ] Logical tab order

### Screen Reader
- [ ] Button labels clear
- [ ] Score announced
- [ ] Status changes announced
- [ ] Error messages read

### Color Contrast
- [ ] Text readable on backgrounds
- [ ] Buttons have good contrast
- [ ] Status badges readable
- [ ] Meets WCAG AA standards

---

## Success Criteria

Day 37 is complete when:
- ✅ Can access scoring console
- ✅ Can start a match
- ✅ Can add points for both players
- ✅ Score updates in real-time
- ✅ Server indicator works
- ✅ Sets complete correctly
- ✅ Match completes correctly
- ✅ Undo works
- ✅ Point history displays
- ✅ Error handling works
- ✅ Responsive on all devices
- ✅ Beautiful UI
- ✅ No console errors
- ✅ Smooth animations

---

## Common Issues

### Issue: "Match not found"
**Solution:** Verify match ID is correct and exists in database

### Issue: "Unauthorized"
**Solution:** Login as organizer or umpire

### Issue: Score doesn't update
**Solution:** Check backend is running, check network tab for errors

### Issue: Buttons don't work
**Solution:** Check console for errors, verify authentication

### Issue: Layout broken on mobile
**Solution:** Check Tailwind classes, verify responsive breakpoints

---

**Happy Testing! 🎾**
