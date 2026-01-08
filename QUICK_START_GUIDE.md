# Quick Start Guide - Test Scoring Console

## ✅ Setup Complete!

Your test data has been created successfully!

---

## 🔐 Login Credentials

**Umpire Account:**
- Email: `umpire@test.com`
- Password: `password123`

**Organizer Account:**
- Email: `organizer@test.com`
- Password: `password123`

---

## 🎾 Test Match URL

Copy this URL and paste it in your browser:

```
http://localhost:5173/scoring/12bd0602-8437-444f-969c-185992e38e46
```

---

## 📝 Step-by-Step Testing

### Step 1: Login
1. Go to: http://localhost:5173/login
2. Enter email: `umpire@test.com`
3. Enter password: `password123`
4. Click "Login"

### Step 2: Access Scoring Console
1. Copy the match URL above
2. Paste it in your browser
3. You should see the scoring console

### Step 3: Start Match
1. Click the "Start Match" button
2. Timer should start at 0:00
3. Score should show 0-0

### Step 4: Test Match Timer ⏱️
1. Watch timer update every second
2. Click "Pause" button
3. Timer should stop
4. Scoring buttons should be disabled
5. Click "Resume" button
6. Timer should continue

### Step 5: Test Scoring
1. Click "+1 Point" for Player 1 multiple times
2. Watch score update
3. Server indicator should change
4. Click "+1 Point" for Player 2
5. Test "Undo Last Point" button

### Step 6: Test Game Point Alert ⚠️
1. Score points until 20-15
2. Yellow/orange "GAME POINT" banner should appear
3. Warning icons should be visible
4. Score to 21-15 to complete set

### Step 7: Test Match Point Alert 🏆
1. Continue to second set
2. Score to 20-15 again
3. Red/orange "MATCH POINT" banner should appear
4. Trophy icons should bounce
5. Pulse animation should be visible

### Step 8: Complete Match
1. Score final point (21-15)
2. Match completion banner should appear
3. Winner should be displayed

---

## 🐛 Troubleshooting

### Issue: Can't login
**Solution:** Make sure you're using the correct credentials:
- Email: `umpire@test.com`
- Password: `password123`

### Issue: Match URL doesn't work
**Solution:** 
1. Make sure both servers are running
2. Check the backend console for errors
3. Try refreshing the page

### Issue: Scoring buttons don't work
**Solution:**
1. Make sure you clicked "Start Match"
2. Check if match is paused (click Resume)
3. Check browser console for errors (F12)

### Issue: Timer not updating
**Solution:**
1. Refresh the page
2. Check if match status is "ONGOING"
3. Look for errors in browser console

---

## 🔄 Reset Test Data

If you want to create fresh test data:

```bash
cd matchify/backend
node seed-test-match.js
```

This will create new test users, tournament, and match.

---

## 📊 What to Test

### Day 40 Features:
- ✅ Match Timer (real-time updates)
- ✅ Pause/Resume functionality
- ✅ Game Point indicator (20+ with lead)
- ✅ Match Point indicator (game point + 1 set won)
- ✅ Doubles rotation (if doubles match)

### Existing Features:
- ✅ Score tracking
- ✅ Server indicator
- ✅ Set completion
- ✅ Match completion
- ✅ Undo functionality
- ✅ Score history
- ✅ Live updates (WebSocket)

---

## 🎯 Success Criteria

All these should work:
- [ ] Login successful
- [ ] Scoring console loads
- [ ] Match starts
- [ ] Timer updates every second
- [ ] Pause stops timer and disables scoring
- [ ] Resume continues timer and enables scoring
- [ ] Game point alert at 20-15
- [ ] Match point alert in set 2 at 20-15
- [ ] Match completes successfully
- [ ] Winner displayed

---

## 📞 Need Help?

If something doesn't work:
1. Check both servers are running
2. Check browser console (F12) for errors
3. Check backend terminal for errors
4. Try refreshing the page
5. Try logging out and back in

---

**Happy Testing! 🎾**
