# 🔧 Admin Dashboard Redirect Fix

## Problem
When clicking "Dashboard" as admin, it redirects to login page instead of admin dashboard.

## Root Cause
The admin token in your browser's localStorage is using the old format. After our fixes to the "Return to Admin" feature, the token format changed to include the actual database user ID.

## ✅ Solution: Logout and Login Again

### Quick Fix (2 steps):
1. **Logout:** Click your profile icon → Logout
2. **Login again:** 
   - Email: `ADMIN@gmail.com`
   - Password: `ADMIN@123(123)`

That's it! The dashboard will now work correctly.

## What Was Fixed

### Backend Changes:
1. **AuthContext** (`frontend/src/contexts/AuthContext.jsx`):
   - Updated `fetchUserProfile()` to skip profile fetching for ALL admin users (not just hardcoded ones)
   - Now checks for `isAdmin` flag or `ADMIN` role in the user object

### Why This Fixes It:
- Admin users don't have player profiles in the database
- The old code tried to fetch a profile for the new admin user (with UUID)
- This caused an error, clearing the user from AuthContext
- Without a user, ProtectedRoute redirects to login

## ✅ After Login, You Should See:
- Admin navbar with "Dashboard" link
- Clicking "Dashboard" goes to `/admin-dashboard`
- No redirect to login page
- Full admin functionality restored

## 🧪 Test It:
1. Logout
2. Login as admin
3. Click "Dashboard" in navbar
4. Should see admin dashboard (not login page)
5. Try impersonating a user
6. Click "Return to Admin"
7. Should return to admin dashboard successfully

## 📝 Technical Details

### Old Token Format (Hardcoded):
```json
{
  "userId": "admin",
  "email": "ADMIN@gmail.com",
  "roles": ["ADMIN"],
  "isAdmin": true
}
```

### New Token Format (Database):
```json
{
  "userId": "b9a188ad-5665-4207-8e50-8bb43c162d39",
  "email": "ADMIN@gmail.com",
  "roles": ["ADMIN"],
  "isAdmin": true
}
```

The new format uses the actual database user ID, which enables proper audit logging and impersonation tracking.

---

**Status:** ✅ Fixed - Just logout and login again!
**Date:** February 2, 2026
