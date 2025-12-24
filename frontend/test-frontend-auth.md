# 🧪 FRONTEND AUTHENTICATION TESTING GUIDE

## Prerequisites
- Backend server running on http://localhost:5000
- Frontend server running on http://localhost:5173
- Test users created in backend (from Day 4)

## Test Scenarios

### 1. Registration Flow Test
1. **Navigate to Registration**
   - Go to http://localhost:5173/register
   - Should see registration form with role selection

2. **Test Form Validation**
   - Try submitting empty form → Should show "Name, email, and password are required"
   - Enter invalid email (no @) → Should show "Invalid email format"
   - Enter password < 6 chars → Should show "Password must be at least 6 characters"
   - Enter mismatched passwords → Should show "Passwords do not match"

3. **Test Successful Registration**
   - Fill form with valid data:
     ```
     Name: Test User Frontend
     Email: testfrontend@matchify.com
     Phone: 9876543299
     Password: password123
     Confirm Password: password123
     Role: PLAYER
     City: Bangalore
     State: Karnataka
     ```
   - Submit form
   - Should redirect to `/dashboard` (Player Dashboard)
   - Should see user info displayed

### 2. Login Flow Test
1. **Navigate to Login**
   - Go to http://localhost:5173/login
   - Should see login form

2. **Test Form Validation**
   - Try submitting empty form → Should show "All fields are required"
   - Enter invalid email → Should show "Invalid email format"

3. **Test Wrong Credentials**
   - Email: testfrontend@matchify.com
   - Password: wrongpassword
   - Should show "Login failed" error

4. **Test Successful Login**
   - Email: testfrontend@matchify.com
   - Password: password123
   - Should redirect to `/dashboard`
   - Should see welcome message with user name

### 3. Protected Routes Test
1. **Test Unauthenticated Access**
   - Clear localStorage (or use incognito)
   - Try accessing http://localhost:5173/dashboard
   - Should redirect to `/login`

2. **Test Authenticated Access**
   - Login as PLAYER
   - Navigate to http://localhost:5173/dashboard
   - Should see Player Dashboard

### 4. Role-Based Access Test
1. **Test Player Role**
   - Login as PLAYER
   - Try accessing http://localhost:5173/organizer/dashboard
   - Should see "Access Denied" message

2. **Test Organizer Role**
   - Register/Login as ORGANIZER
   - Should redirect to `/organizer/dashboard`
   - Should see Organizer Dashboard

3. **Test Umpire Role**
   - Register/Login as UMPIRE
   - Should redirect to `/umpire/dashboard`
   - Should see Umpire Dashboard

### 5. Token Management Test
1. **Test Token Storage**
   - Login successfully
   - Check localStorage:
     - Should have `accessToken`
     - Should have `refreshToken`
     - Should have `user` (JSON string)

2. **Test Logout**
   - Click logout button
   - Should clear localStorage
   - Should redirect to login page

### 6. API Integration Test
1. **Test API Calls**
   - Login successfully
   - Open browser DevTools → Network tab
   - Should see successful API calls to:
     - POST /api/auth/login
     - GET requests should include Authorization header

2. **Test Token Refresh**
   - Login and wait (or manually expire token)
   - Make API request
   - Should automatically refresh token if needed

## Expected Results Summary

### ✅ Registration
- [x] Form validation working
- [x] Successful registration redirects to correct dashboard
- [x] User data stored in localStorage
- [x] API integration working

### ✅ Login
- [x] Form validation working
- [x] Wrong credentials show error
- [x] Successful login redirects based on role
- [x] Tokens stored correctly

### ✅ Protected Routes
- [x] Unauthenticated users redirected to login
- [x] Authenticated users can access protected routes
- [x] Loading states shown during auth check

### ✅ Role-Based Access
- [x] PLAYER can access /dashboard
- [x] ORGANIZER can access /organizer/dashboard
- [x] UMPIRE can access /umpire/dashboard
- [x] ADMIN can access /admin/dashboard
- [x] Wrong roles see access denied message

### ✅ Token Management
- [x] Tokens stored in localStorage
- [x] Tokens included in API requests
- [x] Logout clears tokens
- [x] Token refresh working (if implemented)

## Demo Credentials for Testing

```
Player:
Email: testplayer@matchify.com
Password: password123

Organizer:
Email: testorganizer@matchify.com
Password: password123

Umpire:
Email: umpire@test.com
Password: password123

Admin:
Email: admin@matchify.com
Password: password123
```

## Troubleshooting

### Common Issues:
1. **CORS Errors**: Check backend CORS configuration
2. **API Not Found**: Verify backend server is running on port 5000
3. **Redirect Loops**: Check token validation logic
4. **Form Not Submitting**: Check form validation and error handling

### Debug Steps:
1. Check browser console for errors
2. Check Network tab for API calls
3. Verify localStorage contents
4. Check backend logs for API errors

## Success Criteria
- All 6 test scenarios pass
- No console errors
- Smooth user experience
- Proper error handling
- Correct role-based redirects