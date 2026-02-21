# Database Migration Instructions

## What Changed

Modified the Registration model to support guest registrations (players added by admin without creating user accounts):

### Schema Changes:
1. Made `userId` optional (can be null for guest registrations)
2. Removed unique constraint on `userId + categoryId` (since userId can be null)
3. Added new fields for guest registrations:
   - `guestName` - Name of guest player
   - `guestEmail` - Email of guest player
   - `guestPhone` - Phone of guest player
   - `guestGender` - Gender of guest player
4. Added index on `guestEmail` for faster lookups

### Controller Changes:
- Admin quick-add now creates guest registrations instead of user accounts
- If email matches existing user, uses their account
- If email is new, creates guest registration (NO user account)

## Run Migration

**IMPORTANT: Run this in the backend directory**

```bash
cd backend
npx prisma migrate dev --name add-guest-registration-support
```

This will:
1. Create a new migration file
2. Update the database schema
3. Regenerate Prisma Client

## After Migration

1. Test the quick-add feature:
   - Add a player with a NEW email → Should create guest registration
   - Add a player with EXISTING user email → Should use their account
   - Check that no new user accounts are created for guests

2. Deploy to Render:
   - Push changes to GitHub
   - Render will automatically run migrations on deploy
   - Or manually trigger: `npx prisma migrate deploy` in Render shell

## Rollback (if needed)

If something goes wrong:
```bash
npx prisma migrate resolve --rolled-back <migration-name>
```
