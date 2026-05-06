# Matchify ID Deployment Guide

**Status:** Frontend Ready ✅ | Backend Ready ✅ | Database Migration Needed ⚠️

---

## Current Situation

The Matchify ID system is **fully implemented** in both frontend and backend, but the **database needs to be migrated** to populate matchifyCode values for existing users.

### What's Already Done:
- ✅ Frontend displays Matchify ID in dashboard profile card
- ✅ Backend schema has `matchifyCode` field
- ✅ Backend `/auth/me` endpoint returns `matchifyCode`
- ✅ Registration auto-generates matchifyCode for new users
- ✅ Migration script exists and is ready to run

### What's Missing:
- ⚠️ Existing users in database don't have matchifyCode values yet
- ⚠️ Database schema needs to be pushed to production
- ⚠️ Migration script needs to be run once

---

## Why Matchify ID Isn't Showing

The frontend code is working correctly. It shows "Loading..." because:
1. The database doesn't have matchifyCode values for existing users
2. The Prisma schema changes haven't been pushed to production database
3. The migration script hasn't been run

---

## Deployment Steps

### Step 1: Connect to Production Backend

SSH into your production server or access your backend deployment environment (Vercel, Railway, etc.)

```bash
# If using Vercel CLI
vercel env pull

# If using SSH
ssh user@your-backend-server
cd /path/to/matchify-backend
```

---

### Step 2: Update Database Schema

Run Prisma commands to update the database:

```bash
# Push schema changes to database
npx prisma db push

# Regenerate Prisma Client
npx prisma generate
```

**Expected Output:**
```
✔ Generated Prisma Client
✔ Database schema updated
```

**What This Does:**
- Adds `matchifyCode` column to User table
- Creates unique index on matchifyCode
- Keeps old playerCode and umpireCode columns for backward compatibility

---

### Step 3: Run Migration Script

Execute the migration script to generate matchifyCode for all existing users:

```bash
node migrate-to-matchify-codes.js
```

**Expected Output:**
```
🚀 Starting Matchify Code Migration...
══════════════════════════════════════════════════════════════════════

📊 Found 150 users without matchify codes

✅ 1/150 - John Doe
   Old Player Code: P12345
   Old Umpire Code: U67890
   New Matchify Code: #A10000

✅ 2/150 - Jane Smith
   Old Player Code: P12346
   Old Umpire Code: U67891
   New Matchify Code: #A10001

... (continues for all users)

══════════════════════════════════════════════════════════════════════

📈 Migration Summary:
   ✅ Success: 150
   ❌ Errors: 0
   📊 Total: 150

✨ Migration complete!
══════════════════════════════════════════════════════════════════════

✅ Script completed successfully
```

**What This Does:**
- Finds all users without matchifyCode
- Generates sequential codes starting from #A10000
- Updates each user with their unique matchifyCode
- Preserves old playerCode and umpireCode for reference

---

### Step 4: Verify Migration

Check that matchifyCode values were created:

```bash
# Using Prisma Studio (local)
npx prisma studio

# Or using SQL query
psql $DATABASE_URL -c "SELECT name, email, matchifyCode FROM \"User\" LIMIT 10;"
```

**Expected Result:**
```
       name        |         email          | matchifyCode
-------------------+------------------------+--------------
 John Doe          | john@example.com       | #A10000
 Jane Smith        | jane@example.com       | #A10001
 Bob Johnson       | bob@example.com        | #A10002
```

---

### Step 5: Test Frontend

1. **Clear browser cache** (important!)
2. **Logout and login again** to get fresh user data
3. **Go to dashboard** - You should now see your Matchify ID!

**Expected Display:**
```
┌─────────────────────────────────────┐
│         [Profile Photo]             │
│                                     │
│         Your Name                   │
│    email@example.com                │
│    📍 Bangalore, Karnataka          │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  Matchify ID                  │ │
│  │  #A10000              [Copy]  │ │
│  └───────────────────────────────┘ │
│                                     │
│  [Player] [Organizer] [Umpire]     │
└─────────────────────────────────────┘
```

---

## Troubleshooting

### Issue 1: "Loading..." Still Shows

**Cause:** Browser cache or token not refreshed

**Solution:**
```bash
1. Clear browser cache (Ctrl+Shift+Delete)
2. Logout from app
3. Login again
4. Check dashboard
```

---

### Issue 2: Migration Script Fails

**Error:** `Cannot find module './src/lib/prisma.js'`

**Solution:**
```bash
# Make sure you're in the backend directory
cd backend

# Run the script
node migrate-to-matchify-codes.js
```

---

### Issue 3: Database Connection Error

**Error:** `Can't reach database server`

**Solution:**
```bash
# Check DATABASE_URL environment variable
echo $DATABASE_URL

# Or check .env file
cat .env | grep DATABASE_URL

# Test connection
npx prisma db pull
```

---

### Issue 4: Duplicate matchifyCode Error

**Error:** `Unique constraint failed on matchifyCode`

**Cause:** Migration script was run multiple times

**Solution:**
```bash
# The script is safe to run multiple times
# It only updates users without matchifyCode
# If you see this error, check for data corruption:

npx prisma studio
# Look for duplicate matchifyCode values
# Manually fix duplicates if any
```

---

## Code Format Details

### Matchify Code Format:
- **Pattern:** `#A10000` (hashtag + 1 letter + 5 digits)
- **Range:** A10000 to Z99999
- **Capacity:** 2,340,000 unique codes
- **Sequential:** Increments automatically (#A10000, #A10001, #A10002...)

### Generation Logic:
```javascript
// Current code: #A10000
// Next code: #A10001
// After #A99999: #B10000
// After #Z99999: Error (capacity reached)
```

---

## New User Registration

**Good News:** New users automatically get matchifyCode!

When a user registers:
1. Backend calls `generateMatchifyCode()`
2. Finds the highest existing code
3. Increments by 1
4. Assigns to new user
5. User sees their Matchify ID immediately

**No manual intervention needed for new users!**

---

## Database Schema

### User Table (Relevant Fields):
```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  name         String
  matchifyCode String?  @unique  // NEW: Universal code
  playerCode   String?  @unique  // DEPRECATED: Kept for migration
  umpireCode   String?  @unique  // DEPRECATED: Kept for migration
  // ... other fields
}
```

### Migration Strategy:
- ✅ Keep old codes for backward compatibility
- ✅ Add new matchifyCode field
- ✅ Gradually migrate users
- ✅ Eventually remove old codes (future update)

---

## API Endpoints

### GET /auth/me
**Returns:**
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "matchifyCode": "#A10000",
    "playerCode": "P12345",  // DEPRECATED
    "umpireCode": "U67890",  // DEPRECATED
    // ... other fields
  }
}
```

### POST /auth/register
**Auto-generates matchifyCode for new users**

---

## Frontend Implementation

### Dashboard Display:
```jsx
{/* Matchify Code - Always show, with fallback */}
<div className="matchify-id-card">
  <p className="label">Matchify ID</p>
  <p className="code">
    {matchifyCode || userProfile?.matchifyCode || user?.matchifyCode || 'Loading...'}
  </p>
  <button onClick={copyToClipboard}>
    <CopyIcon />
  </button>
</div>
```

### Features:
- ✅ Always visible (no conditional rendering)
- ✅ Shows "Loading..." if not available
- ✅ Copy to clipboard functionality
- ✅ Green gradient design matching app theme
- ✅ Shimmer animation effect

---

## Future Updates (TODO)

### Phase 1: Current (Completed)
- ✅ Add matchifyCode to schema
- ✅ Create generation utility
- ✅ Update registration to auto-generate
- ✅ Display in dashboard
- ✅ Create migration script

### Phase 2: Integration (Next)
- [ ] Update umpire recruitment to use matchifyCode
- [ ] Update doubles partner to use matchifyCode
- [ ] Update tournament registration to use matchifyCode
- [ ] Add matchifyCode search functionality

### Phase 3: Cleanup (Future)
- [ ] Remove playerCode and umpireCode fields
- [ ] Update all references to use matchifyCode
- [ ] Archive old code data

---

## Support

If you encounter issues during deployment:

1. **Check Logs:**
   ```bash
   # Backend logs
   vercel logs
   
   # Database logs
   psql $DATABASE_URL -c "SELECT * FROM \"User\" WHERE matchifyCode IS NULL;"
   ```

2. **Verify Environment:**
   ```bash
   # Check Node version (should be 18+)
   node --version
   
   # Check Prisma version
   npx prisma --version
   ```

3. **Contact Support:**
   - Email: support@matchify.pro
   - GitHub Issues: https://github.com/LochanPS/Matchify.pro/issues

---

## Summary

**To make Matchify ID appear:**

1. Run `npx prisma db push` on production
2. Run `npx prisma generate` on production
3. Run `node migrate-to-matchify-codes.js` on production
4. Clear browser cache and re-login
5. Check dashboard - Matchify ID should now appear!

**Estimated Time:** 5-10 minutes

**Risk Level:** Low (migration is safe and reversible)

**Downtime:** None (can be done without stopping the app)

---

**Last Updated:** May 6, 2026  
**Commit:** 578c346  
**Status:** Ready for Production Deployment
