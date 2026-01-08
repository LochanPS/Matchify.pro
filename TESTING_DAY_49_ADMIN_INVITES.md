# Testing Day 49: Admin Invite System

**Date:** December 27, 2025  
**Feature:** Admin Invite System

---

## Prerequisites

1. **Backend server running** on port 5000
2. **Frontend server running** on port 5173
3. **Admin account** available (admin@matchify.com / password123)

---

## Test Scenarios

### Scenario 1: Create and Send Invite ✅

**Steps:**
1. Login as admin:
   - Email: `admin@matchify.com`
   - Password: `password123`

2. Navigate to Admin Dashboard:
   - URL: `http://localhost:5173/admin/dashboard`
   - Click "User Invites" card

3. Create new invite:
   - Click "+ Create Invite" button
   - Enter email: `neworganizer@test.com`
   - Select role: `ORGANIZER`
   - Click "Send Invite"

**Expected Results:**
- ✅ Success message appears
- ✅ Invite appears in list with "pending" status
- ✅ Console shows email output with invite URL
- ✅ Invite expires in 7 days

---

### Scenario 2: Accept Invite and Create Account ✅

**Steps:**
1. Copy invite URL from console logs:
   - Look for: `http://localhost:5173/invite/accept/[TOKEN]`

2. Open invite URL in new incognito window

3. Verify invite details display:
   - Email should match
   - Role should match
   - Invited by should show admin name

4. Fill in account creation form:
   - Name: `New Organizer`
   - Password: `password123`
   - Confirm Password: `password123`
   - Phone: `+91 9876543210` (optional)
   - City: `Mumbai` (optional)
   - State: `Maharashtra` (optional)

5. Click "Create Account"

6. Login with new credentials:
   - Email: `neworganizer@test.com`
   - Password: `password123`

**Expected Results:**
- ✅ Redirect to login page after account creation
- ✅ Can login with new credentials
- ✅ User has ORGANIZER role
- ✅ Can access organizer dashboard
- ✅ Invite status changes to "accepted" in admin panel

---

### Scenario 3: Filter Invites ✅

**Steps:**
1. Navigate to `/admin/invites`

2. Test filters:
   - Click "Pending" - should show only pending invites
   - Click "Accepted" - should show only accepted invites
   - Click "Revoked" - should show only revoked invites
   - Click "All" - should show all invites

**Expected Results:**
- ✅ Filters work correctly
- ✅ Invite count updates
- ✅ Table updates instantly

---

### Scenario 4: Revoke Invite ✅

**Steps:**
1. Create a new invite (email: `revoke@test.com`)

2. Click "Revoke" button on the invite

3. Confirm revocation

4. Try to accept the invite using the URL

**Expected Results:**
- ✅ Status changes to "revoked"
- ✅ "Revoke" button disappears
- ✅ Invite URL shows error: "Invite has been revoked"
- ✅ Cannot create account

---

### Scenario 5: Delete Invite ✅

**Steps:**
1. Select any invite from the list

2. Click "Delete" button

3. Confirm deletion

**Expected Results:**
- ✅ Invite removed from list
- ✅ Invite URL shows error: "Invalid invite token"

---

### Scenario 6: Duplicate Prevention ✅

**Steps:**
1. Create invite for `duplicate@test.com`

2. Try to create another invite for same email

**Expected Results:**
- ✅ Error: "Pending invite already exists for this email"

3. Accept the first invite

4. Try to create new invite for same email

**Expected Results:**
- ✅ Error: "User with this email already exists"

---

### Scenario 7: Expired Invite ✅

**Steps:**
1. Create an invite

2. Wait 7 days (or manually update database):
   ```sql
   UPDATE AdminInvite 
   SET expiresAt = datetime('now', '-1 day') 
   WHERE email = 'expired@test.com';
   ```

3. Try to accept the invite

**Expected Results:**
- ✅ Error: "Invite has expired"
- ✅ Admin panel shows "Expired" badge
- ✅ Cannot create account

---

### Scenario 8: Invalid Token ✅

**Steps:**
1. Try to access: `http://localhost:5173/invite/accept/invalid-token-123`

**Expected Results:**
- ✅ Error page: "Invalid invite token"
- ✅ "Go to Login" button works

---

### Scenario 9: Password Validation ✅

**Steps:**
1. Open valid invite URL

2. Try to create account with:
   - Password: `12345` (too short)
   - Confirm Password: `12345`

**Expected Results:**
- ✅ Error: "Password must be at least 6 characters"

3. Try with mismatched passwords:
   - Password: `password123`
   - Confirm Password: `password456`

**Expected Results:**
- ✅ Error: "Passwords do not match"

---

### Scenario 10: Email Validation ✅

**Steps:**
1. Try to create invite with invalid email:
   - `notanemail`
   - `test@`
   - `@test.com`

**Expected Results:**
- ✅ Error: "Invalid email format"

---

### Scenario 11: Role Assignment ✅

**Steps:**
1. Create 3 invites with different roles:
   - ORGANIZER
   - UMPIRE
   - ADMIN

2. Accept each invite

3. Login with each account

**Expected Results:**
- ✅ ORGANIZER can access `/organizer/dashboard`
- ✅ UMPIRE can access `/umpire/dashboard`
- ✅ ADMIN can access `/admin/dashboard`
- ✅ Each role has correct permissions

---

### Scenario 12: Invite List Display ✅

**Steps:**
1. Create multiple invites

2. Check invite list displays:
   - Email
   - Role badge (colored)
   - Status badge (colored)
   - Invited by name and email
   - Expiration date
   - Action buttons

**Expected Results:**
- ✅ All information displays correctly
- ✅ Badges have correct colors
- ✅ Dates formatted properly
- ✅ Actions available based on status

---

## API Testing (Optional)

### Test with cURL or Postman

**1. Create Invite:**
```bash
curl -X POST http://localhost:5000/api/admin/invites \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"api@test.com","role":"ORGANIZER"}'
```

**2. List Invites:**
```bash
curl http://localhost:5000/api/admin/invites \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**3. Verify Invite:**
```bash
curl http://localhost:5000/api/admin/invites/TOKEN_HERE/verify
```

**4. Accept Invite:**
```bash
curl -X POST http://localhost:5000/api/admin/invites/TOKEN_HERE/accept \
  -H "Content-Type: application/json" \
  -d '{"name":"API User","password":"password123"}'
```

---

## Database Verification

**Check invites in database:**
```bash
cd matchify/backend
npx prisma studio
```

Navigate to `AdminInvite` table and verify:
- ✅ Tokens are unique
- ✅ Expiration dates are 7 days from creation
- ✅ Status updates correctly
- ✅ Timestamps are accurate

---

## Common Issues & Solutions

### Issue 1: Email not sending
**Solution:** Check console logs - emails are logged when SMTP not configured

### Issue 2: Token not found
**Solution:** Ensure database migration ran successfully

### Issue 3: Cannot access admin routes
**Solution:** Verify user has ADMIN role in database

### Issue 4: Invite URL not working
**Solution:** Check FRONTEND_URL in backend .env file

---

## Success Criteria

All scenarios should pass:
- ✅ Create invite
- ✅ Send email notification
- ✅ Accept invite
- ✅ Create account with correct role
- ✅ Filter invites
- ✅ Revoke invite
- ✅ Delete invite
- ✅ Prevent duplicates
- ✅ Handle expiration
- ✅ Validate passwords
- ✅ Validate emails
- ✅ Assign roles correctly

---

**Testing Complete!** 🎉

If all scenarios pass, Day 49 Admin Invite System is working correctly.
