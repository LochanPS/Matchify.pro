# Clear Impersonation State

## Problem
You're logged in as Jyoti Anand but the system shows "Viewing: Super Admin (ADMIN@gmail.com)" which means you're in impersonation mode.

## Solution Options

### Option 1: Click "Return to Admin" Button
1. Click the orange "Return to Admin" button at the top of the page
2. This will take you back to the admin account
3. Then you can logout and login as Jyoti normally

### Option 2: Logout and Login Fresh (RECOMMENDED)
1. Click the Logout button in the top right
2. Login again as Jyoti:
   - Email: `jyoti.anand123@yahoo.com`
   - Password: (your password)
3. This will clear the impersonation state

### Option 3: Clear Browser Storage (If above don't work)
1. Press F12 to open Developer Tools
2. Go to "Application" tab (Chrome) or "Storage" tab (Firefox)
3. Click "Local Storage" → `http://localhost:5173`
4. Delete the `token` and `user` items
5. Refresh the page
6. Login again as Jyoti

## Why This Happened
When an admin impersonates a user, a special token is created with `isImpersonating: true`. This token needs to be cleared by either:
- Clicking "Return to Admin" 
- Logging out completely

## After Fixing
Once you logout and login fresh as Jyoti, you should:
- ✅ NOT see the orange "ADMIN MODE" banner
- ✅ Be able to edit your profile
- ✅ Register for tournaments
- ✅ See your own dashboard
