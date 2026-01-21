# Payment Verification 500 Error - Fix Instructions

## Problem
The payment verification page is showing a 500 error because:
1. The Prisma client needs to be regenerated after schema changes
2. The database might have too many open connections

## Solution

### Step 1: Stop the Backend Server
Press `Ctrl+C` in the terminal running the backend server to stop it.

### Step 2: Regenerate Prisma Client
Run these commands in the backend directory:

```bash
cd backend
npx prisma generate --force
```

If that fails with permission error, try:
```bash
rm -rf node_modules/.prisma
npx prisma generate
```

### Step 3: Restart the Backend Server
```bash
npm run dev
```

### Step 4: Test the Payment Verification Page
Navigate to: `http://localhost:5173/admin/payment-verifications`

---

## What Was Fixed

1. ✅ Added missing relations to User model:
   - `superAdminInvitesCreated`
   - `superAdminInviteUsages`

2. ✅ Payment models already exist in schema:
   - `PaymentVerification` - Stores payment screenshots
   - `TournamentPayment` - Tracks revenue per tournament
   - `PaymentSettings` - Admin's QR code settings

3. ✅ API routes are properly registered:
   - `/api/admin/payment-verifications` - Get/approve/reject payments
   - `/api/admin/tournament-payments` - View revenue by tournament
   - `/api/admin/revenue` - Revenue analytics

---

## Alternative: Manual Database Sync

If Prisma generate still fails, you can manually sync the database:

```bash
npx prisma db push --skip-generate
```

Then restart the server.

---

## Verification

After restarting, you should see:
1. No 500 errors on payment verification page
2. Payment stats showing (pending, approved, rejected counts)
3. Ability to view payment screenshots
4. Approve/reject buttons working

---

## Date: January 20, 2026
## Status: ⚠️ REQUIRES SERVER RESTART
