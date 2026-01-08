# 🧪 DAY 56 TESTING GUIDE: Admin Access Control

**Purpose:** Verify that admins are properly blocked from non-admin features

---

## 🚀 QUICK START

### Prerequisites
1. Backend running on `http://localhost:5000`
2. Frontend running on `http://localhost:5173`
3. Database seeded with test accounts

### Test Accounts
```
Admin:     admin@matchify.com / password123
Player:    testplayer@matchify.com / password123
Organizer: testorganizer@matchify.com / password123
```

---

## 📋 FRONTEND TESTING

### Test 1: Admin Blocked from Tournament Creation
1. Login as admin
2. Navigate to `/tournaments/create`
3. **Expected:** See "Admin Access Restricted" screen
4. **Verify:** 
   - Warning icon displayed
   - Clear explanation shown
   - "Go to Admin Dashboard" button works
   - "Go Back" button works

### Test 2: Admin Blocked from Registration
1. Login as admin
2. Navigate to any tournament detail page
3. Click "Register" button
4. **Expected:** See "Admin Access Restricted" screen
5. **Verify:** Same as Test 1

### Test 3: Admin Blocked from Player Dashboard
1. Login as admin
2. Navigate to `/dashboard`
3. **Expected:** See "Admin Access Restricted" screen

### Test 4: Admin Blocked from Organizer Dashboard
1. Login as admin
2. Navigate to `/organizer/dashboard`
3. **Expected:** See "Admin Access Restricted" screen

### Test 5: Admin Blocked from Umpire Dashboard
1. Login as admin
2. Navigate to `/umpire/dashboard`
3. **Expected:** See "Admin Access Restricted" screen

### Test 6: Admin Blocked from Scoring Console
1. Login as admin
2. Navigate to `/scoring/[any-match-id]`
3. **Expected:** See "Admin Access Restricted" screen

### Test 7: Admin CAN Access Admin Routes
1. Login as admin
2. Navigate to `/admin/dashboard`
3. **Expected:** Admin dashboard loads successfully
4. Test other admin routes:
   - `/admin/users` ✓
   - `/admin/invites` ✓
   - `/admin/audit-logs` ✓

### Test 8: Admin CAN View Public Routes
1. Login as admin
2. Navigate to `/tournaments`
3. **Expected:** Tournament list loads
4. Click on a tournament
5. **Expected:** Tournament details load
6. Navigate to `/matches/live`
7. **Expected:** Live matches load

---

## 🔧 BACKEND TESTING

### Test 9: Admin Blocked from Creating Tournament
```bash
# Run this test
cd matchify/backend
node tests/admin-route-blocking.test.js
```

**Expected Output:**
```
✅ Admin blocked from creating tournament
   Message: Admins cannot access this feature. Please use your personal account.
```

### Test 10: Manual API Testing

#### Block Tournament Creation
```bash
# Get admin token first
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@matchify.com","password":"password123"}'

# Try to create tournament (should fail)
curl -X POST http://localhost:5000/api/tournaments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [ADMIN_TOKEN]" \
  -d '{
    "name": "Test Tournament",
    "description": "Should be blocked",
    "startDate": "2025-03-01",
    "endDate": "2025-03-03",
    "registrationDeadline": "2025-02-25",
    "venue": "Test Venue",
    "city": "Test City",
    "state": "Test State"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Admins cannot access this feature. Please use your personal account.",
  "suggestion": "Create a separate player/organizer account for non-admin activities",
  "userRole": "ADMIN"
}
```

#### Block Registration
```bash
# Try to register (should fail)
curl -X POST http://localhost:5000/api/registrations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [ADMIN_TOKEN]" \
  -d '{
    "tournamentId": "[TOURNAMENT_ID]",
    "categoryId": "[CATEGORY_ID]"
  }'
```

**Expected:** 403 Forbidden with same error message

#### Allow Public Access
```bash
# View tournaments (should succeed)
curl -X GET http://localhost:5000/api/tournaments \
  -H "Authorization: Bearer [ADMIN_TOKEN]"
```

**Expected:** 200 OK with tournament list

---

## ✅ VERIFICATION CHECKLIST

### Frontend
- [ ] Admin sees blocked screen on `/tournaments/create`
- [ ] Admin sees blocked screen on `/tournaments/:id/register`
- [ ] Admin sees blocked screen on `/registrations`
- [ ] Admin sees blocked screen on `/dashboard`
- [ ] Admin sees blocked screen on `/organizer/dashboard`
- [ ] Admin sees blocked screen on `/umpire/dashboard`
- [ ] Admin sees blocked screen on `/scoring/:matchId`
- [ ] Admin sees blocked screen on `/my-points`
- [ ] Admin CAN access `/admin/dashboard`
- [ ] Admin CAN access `/admin/users`
- [ ] Admin CAN access `/admin/invites`
- [ ] Admin CAN access `/admin/audit-logs`
- [ ] Admin CAN view `/tournaments` (public)
- [ ] Admin CAN view `/tournaments/:id` (public)
- [ ] Admin CAN view `/matches/live` (public)
- [ ] Blocked screen shows clear explanation
- [ ] Blocked screen has working buttons

### Backend
- [ ] POST `/api/tournaments` returns 403 for admin
- [ ] PUT `/api/tournaments/:id` returns 403 for admin
- [ ] DELETE `/api/tournaments/:id` returns 403 for admin
- [ ] POST `/api/registrations` returns 403 for admin
- [ ] GET `/api/registrations/my` returns 403 for admin
- [ ] DELETE `/api/registrations/:id` returns 403 for admin
- [ ] POST `/api/matches/:id/start` returns 403 for admin
- [ ] POST `/api/matches/:id/score` returns 403 for admin
- [ ] POST `/api/matches/:id/corrections` returns 403 for admin
- [ ] GET `/api/tournaments` returns 200 for admin
- [ ] GET `/api/tournaments/:id` returns 200 for admin
- [ ] GET `/api/matches/live` returns 200 for admin
- [ ] Error messages include helpful suggestions
- [ ] Error messages include userRole field

### Other Roles
- [ ] Player CAN create registrations
- [ ] Player CAN view their registrations
- [ ] Player CAN access player dashboard
- [ ] Organizer CAN create tournaments
- [ ] Organizer CAN update tournaments
- [ ] Organizer CAN access organizer dashboard
- [ ] Umpire CAN start matches
- [ ] Umpire CAN score matches
- [ ] Umpire CAN access umpire dashboard

---

## 🐛 COMMON ISSUES

### Issue: Admin can still access blocked routes
**Solution:** 
- Check `blockAdmin={true}` is set in `App.jsx`
- Verify `RoleRoute.jsx` has the blockAdmin logic
- Clear browser cache and reload

### Issue: Backend not blocking admin
**Solution:**
- Check `preventAdminAccess` middleware is imported
- Verify middleware is applied to routes
- Check middleware order (authenticate before preventAdminAccess)

### Issue: Error messages not showing
**Solution:**
- Check backend response format
- Verify frontend error handling
- Check browser console for errors

---

## 📊 SUCCESS CRITERIA

✅ **All tests pass**
✅ **Admin cannot access any blocked features**
✅ **Admin can access admin panel and public routes**
✅ **Other roles unaffected**
✅ **Error messages clear and helpful**
✅ **No console errors**

---

## 🎯 NEXT STEPS

After verifying Day 56:
1. Proceed to Day 57 (Email System)
2. Document any issues found
3. Update tests if needed

---

**Happy Testing!** 🚀
