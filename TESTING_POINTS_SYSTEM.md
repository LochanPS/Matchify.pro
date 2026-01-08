# Testing the Points System (Day 35)

## Quick Start Guide

### 1. Start Backend Server
```bash
cd matchify/backend
npm start
```
✅ Server should start on http://localhost:5000

### 2. Run Backend Tests
```bash
cd matchify/backend
node test-points.js
```
✅ Expected: 8/8 tests pass

### 3. Start Frontend Server
```bash
cd matchify/frontend
npm run dev
```
✅ Server should start on http://localhost:5173

---

## Test Scenarios

### Scenario 1: Public Leaderboard (No Login Required)

**URL:** http://localhost:5173/leaderboard

**Steps:**
1. Open the leaderboard page
2. Verify you see a list of players ranked by points
3. Check that top 3 players have special icons:
   - 🏆 Gold trophy for #1
   - 🥈 Silver medal for #2
   - 🥉 Bronze award for #3

**Test Filters:**
1. Click "Global" button - should show all players
2. Click "State" button:
   - Enter "Maharashtra" in the state field
   - Verify only Maharashtra players show
3. Click "City" button:
   - Enter "Mumbai" in city field
   - Enter "Maharashtra" in state field
   - Verify only Mumbai players show

**Expected Results:**
- ✅ Page loads without login
- ✅ Players sorted by points (highest first)
- ✅ Top 3 have special icons
- ✅ Filters work correctly
- ✅ Stats cards show correct data

---

### Scenario 2: Personal Points Dashboard (Login Required)

**URL:** http://localhost:5173/my-points

**Steps:**
1. Try to access /my-points without login
   - Should redirect to login page
2. Login with test account:
   - Email: testplayer@matchify.com
   - Password: password123
3. Navigate to /my-points
4. Verify you see:
   - Total Points card (blue)
   - Global Rank card (purple)
   - Tournaments Played card (green)
   - Average Points card (orange)

**Expected Results:**
- ✅ Requires authentication
- ✅ Shows personal stats
- ✅ Points history section (may be empty)
- ✅ "How Points Work" section visible
- ✅ Responsive on mobile/tablet/desktop

---

### Scenario 3: Leaderboard with Logged-In User

**Steps:**
1. Login as testplayer@matchify.com
2. Navigate to /leaderboard
3. Find your name in the table
4. Verify you see a blue "You" badge next to your name
5. Check the "Your Rank" card shows your position

**Expected Results:**
- ✅ "You" badge appears
- ✅ Your row highlighted in light blue
- ✅ Your rank shown in stats card

---

### Scenario 4: API Testing (Backend)

**Test Global Leaderboard:**
```bash
curl http://localhost:5000/api/leaderboard?scope=global&limit=10
```

**Test State Filter:**
```bash
curl "http://localhost:5000/api/leaderboard?scope=state&state=Maharashtra"
```

**Test City Filter:**
```bash
curl "http://localhost:5000/api/leaderboard?scope=city&city=Mumbai&state=Maharashtra"
```

**Test My Points (requires token):**
```bash
# First login to get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testplayer@matchify.com","password":"password123"}'

# Use the token from response
curl http://localhost:5000/api/points/my \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Results:**
- ✅ All endpoints return 200 OK
- ✅ Data formatted correctly
- ✅ Filters work as expected
- ✅ Protected routes require auth

---

## Visual Verification

### Leaderboard Page Should Show:
```
┌─────────────────────────────────────────┐
│  🏆 Matchify Leaderboard                │
│  Top badminton players ranked by points │
├─────────────────────────────────────────┤
│  [Global] [State] [City]  ← Filters     │
├─────────────────────────────────────────┤
│  Top Player: Name (XXX.X pts)           │
│  Total Players: XX                      │
│  Your Rank: #XX                         │
├─────────────────────────────────────────┤
│  Rank | Player | Points | Tournaments   │
│  🏆#1 | Name   | 150.0  | 5             │
│  🥈#2 | Name   | 120.0  | 4             │
│  🥉#3 | Name   | 100.0  | 3             │
│  #4   | Name   | 80.0   | 2             │
└─────────────────────────────────────────┘
```

### My Points Page Should Show:
```
┌─────────────────────────────────────────┐
│  🏆 My Matchify Points                  │
│  Track your tournament performance      │
├─────────────────────────────────────────┤
│  [Total Points] [Rank] [Tournaments]    │
│  [Average Points]                       │
├─────────────────────────────────────────┤
│  Points Breakdown                       │
│  ┌──────────┐ ┌──────────┐             │
│  │Tournament│ │Tournament│             │
│  │+100 pts  │ │+70 pts   │             │
│  │Winner    │ │Runner-up │             │
│  └──────────┘ └──────────┘             │
├─────────────────────────────────────────┤
│  How Matchify Points Work               │
│  • Winner: 100 points                   │
│  • Runner-up: 70 points                 │
│  • Semi-finalist: 50 points             │
└─────────────────────────────────────────┘
```

---

## Responsive Design Testing

### Mobile (< 768px)
- ✅ Stats cards stack vertically (1 column)
- ✅ Table scrolls horizontally
- ✅ Filter buttons stack
- ✅ Points history cards stack (1 column)

### Tablet (768px - 1024px)
- ✅ Stats cards in 2 columns
- ✅ Table fits width
- ✅ Filter buttons in row
- ✅ Points history cards in 2 columns

### Desktop (> 1024px)
- ✅ Stats cards in 3-4 columns
- ✅ Table full width
- ✅ All filters in row
- ✅ Points history cards in 2 columns

---

## Common Issues & Solutions

### Issue: "Failed to fetch leaderboard"
**Solution:** Make sure backend server is running on port 5000

### Issue: "Redirected to login on /my-points"
**Solution:** This is correct behavior - login first

### Issue: "No players found"
**Solution:** Check if database has seeded data

### Issue: "Points history is empty"
**Solution:** Normal - PointsLog table will be populated when matches are completed

### Issue: "Win rate shows N/A"
**Solution:** Normal - will be calculated when match results exist

---

## Success Criteria

Day 35 is complete when:
- ✅ Backend tests pass (8/8)
- ✅ Leaderboard accessible without login
- ✅ Filters work (global/state/city)
- ✅ Top 3 have special icons
- ✅ My Points requires login
- ✅ Stats cards display correctly
- ✅ Responsive on all screen sizes
- ✅ No console errors
- ✅ Loading states work
- ✅ Empty states display properly

---

## Next Steps (Day 36)

After verifying Day 35 works:
1. Create PointsLog table in Prisma schema
2. Build match scoring API
3. Implement points calculation
4. Test full flow: Match → Score → Points → Leaderboard

---

**Happy Testing! 🎾**
