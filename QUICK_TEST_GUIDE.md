# 🚀 Quick Test Guide - MATCHIFY.PRO

**Servers Running:**
- ✅ Frontend: http://localhost:5173
- ✅ Backend: http://localhost:5000

---

## 🎯 Priority Tests (Do These First)

### 1. KYC Removal Verification (5 mins)

**Test A: Organizer Can Create Tournament**
1. Open http://localhost:5173
2. Login as organizer (or register new organizer)
3. Click "Create Tournament"
4. Fill in basic details
5. ✅ Should work without KYC prompts

**Test B: KYC Routes Disabled**
1. Try: http://localhost:5173/organizer/kyc/submit
2. ✅ Should show 404 or redirect

**Test C: Admin Dashboard**
1. Login as admin: `ADMIN@gmail.com` / `ADMIN@123(123)`
2. Check sidebar menu
3. ✅ Should NOT see "KYC" option

---

## 🔥 Critical Features Test (15 mins)

### Authentication
- [ ] Register new player
- [ ] Login with credentials
- [ ] Logout
- [ ] Profile page loads

### Tournament Flow (Player)
- [ ] Browse tournaments
- [ ] View tournament details
- [ ] Register for tournament
- [ ] Upload payment screenshot
- [ ] View "My Registrations"

### Tournament Flow (Organizer)
- [ ] Create tournament
- [ ] Add categories
- [ ] View registrations
- [ ] Generate draws
- [ ] Create matches

### Admin Features
- [ ] View dashboard stats
- [ ] View all users
- [ ] Login as user (impersonation)
- [ ] Return to admin
- [ ] View payment verifications

---

## 📋 Feature Categories Test

### 🎮 Player Features (10 mins)
- [ ] Tournament discovery page works
- [ ] Can filter tournaments
- [ ] Registration form appears
- [ ] Payment QR code shows
- [ ] Can upload screenshot
- [ ] Leaderboard page loads
- [ ] My Points page shows data

### 🏆 Organizer Features (15 mins)
- [ ] Organizer dashboard loads
- [ ] Can create tournament
- [ ] Can upload poster
- [ ] Can add categories
- [ ] Can set entry fees
- [ ] Can view registrations
- [ ] Can approve registrations
- [ ] Can generate draws
- [ ] Can arrange knockout matchups
- [ ] Can end tournament

### 🎯 Umpire Features (5 mins)
- [ ] Umpire dashboard loads
- [ ] Can see assigned matches
- [ ] Can open scoring console
- [ ] Can score points
- [ ] Can complete match

### 👨‍💼 Admin Features (10 mins)
- [ ] Dashboard shows stats
- [ ] User management works
- [ ] Can suspend user
- [ ] Can impersonate user
- [ ] Can return to admin
- [ ] Payment verification page works
- [ ] Revenue dashboard loads
- [ ] Academy approvals work

---

## 🔴 Live Features Test (5 mins)

- [ ] Live matches page works
- [ ] Real-time scores update
- [ ] WebSocket connected (check console)
- [ ] Spectator view works

---

## 💰 Payment System Test (10 mins)

- [ ] QR code displays during registration
- [ ] Can upload payment screenshot
- [ ] Admin can verify payment
- [ ] Payment approval notification sent
- [ ] Wallet page loads
- [ ] Transaction history shows
- [ ] Refund system works

---

## 🔔 Notification Test (5 mins)

- [ ] Notification icon shows count
- [ ] Can view notifications
- [ ] Can mark as read
- [ ] Can view notification details
- [ ] Real-time notifications work

---

## 🐛 Bug Verification (Recent Fixes)

### Fixed Issues - Should Work:
- [ ] Return to Admin button works
- [ ] No double-click errors
- [ ] Registration blocked after deadline
- [ ] "Registration Closed" message shows
- [ ] End Tournament button works
- [ ] No progress bar on draws page
- [ ] Match completion navigation works

---

## 🧪 Quick Smoke Test (2 mins)

Run this if you're short on time:

1. **Homepage loads** ✅
2. **Can login** ✅
3. **Dashboard loads** ✅
4. **Can create tournament** ✅
5. **Can register for tournament** ✅
6. **No KYC prompts** ✅
7. **No console errors** ✅

---

## 🔍 Console Check

Open browser console (F12) and check for:
- ❌ No red errors
- ⚠️ Warnings are OK (Razorpay, SendGrid not configured)
- ✅ WebSocket connected message
- ✅ API calls returning 200

---

## 📊 Test Accounts

### Admin
- Email: `ADMIN@gmail.com`
- Password: `ADMIN@123(123)`

### Test Users (If created)
- Check database or create new accounts

---

## ⚡ Quick Commands

### Check Backend Health
```bash
curl http://localhost:5000/health
```

### Check API
```bash
curl http://localhost:5000/api
```

### View Logs
- Backend: Check terminal running backend
- Frontend: Check browser console

---

## 🎯 Success Criteria

### Must Pass:
- ✅ No KYC prompts anywhere
- ✅ Organizers can create tournaments
- ✅ Players can register
- ✅ Admin can manage users
- ✅ No critical errors in console

### Nice to Have:
- ✅ All features working
- ✅ Real-time updates working
- ✅ Notifications working
- ✅ Payment flow working

---

## 🚨 If Something Breaks

1. **Check console for errors**
2. **Check backend terminal for errors**
3. **Restart servers if needed:**
   - Stop: Ctrl+C in terminals
   - Start backend: `cd backend && npm run dev`
   - Start frontend: `cd frontend && npm run dev`

4. **Clear browser cache:**
   - Ctrl+Shift+Delete
   - Clear cached images and files

5. **Check if servers are running:**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000/health

---

## 📝 Report Issues

If you find bugs, note:
1. What you were doing
2. What happened
3. What you expected
4. Console errors (if any)
5. Steps to reproduce

---

**Happy Testing! 🎾**
