# Organizer Dashboard 500 Error - Troubleshooting Guide

## Error Details
```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
URL: http://localhost:5000/api/organizer/dashboard
```

## Possible Causes

### 1. **Database Connection Issue**
The Prisma client might not be properly initialized or the database connection is failing.

**Solution**: Check if the database file exists and Prisma is connected.

### 2. **User Role Check Failing**
The endpoint checks if the user has the ORGANIZER role. If the user object doesn't have the correct role structure, it might fail.

**Solution**: Verify the user has the ORGANIZER role in the database.

### 3. **Missing Prisma Import**
The route file might not have the Prisma client imported properly.

**Solution**: Check if `prisma` is imported at the top of the routes file.

---

## Debugging Steps

### Step 1: Check Backend Console
Run the backend and look for the actual error message:
```bash
cd backend
npm run dev
```

Look for error messages that show:
- Database connection errors
- Prisma query errors
- Authentication errors
- Role verification errors

### Step 2: Test the Endpoint Directly
Use curl or Postman to test the endpoint:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/organizer/dashboard
```

### Step 3: Check User Roles
Verify the logged-in user has the ORGANIZER role:
```javascript
// In backend console or database
SELECT id, name, email, role, roles FROM User WHERE email = 'your-email@example.com';
```

### Step 4: Check Prisma Client
Make sure Prisma is properly initialized:
```bash
cd backend
npx prisma generate
npx prisma db push
```

---

## Common Fixes

### Fix 1: Add Prisma Import to Routes File
If `prisma` is not imported, add this at the top of `organizer.routes.js`:
```javascript
import prisma from '../lib/prisma.js';
```

### Fix 2: Update User Role Check
The endpoint checks for ORGANIZER role. Make sure your user has this role:
```sql
UPDATE User SET role = 'ORGANIZER', roles = '["ORGANIZER"]' WHERE email = 'your-email@example.com';
```

### Fix 3: Restart Backend
Sometimes the backend needs a restart after database changes:
```bash
# Stop the backend (Ctrl+C)
# Then restart
npm run dev
```

---

## Expected Response

When working correctly, the endpoint should return:
```json
{
  "success": true,
  "data": {
    "total_tournaments": 1,
    "total_registrations": 29,
    "upcoming_tournaments": [...],
    "recent_registrations": [...],
    "revenue": {
      "type1": 0,
      "type2": 0,
      "total": 0,
      "currency": "INR"
    },
    "tournaments_by_status": {
      "published": 1
    }
  }
}
```

---

## Next Steps

1. **Check the backend console** for the actual error message
2. **Share the error message** so I can provide a specific fix
3. **Verify user roles** in the database
4. **Test with a fresh database** if needed

The frontend code is correct - the issue is in the backend API endpoint. Once we see the actual error message from the backend console, I can provide the exact fix needed.
