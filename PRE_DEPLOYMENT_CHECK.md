# Pre-Deployment Verification Checklist

## ✅ Files Created/Updated

Run this checklist before deploying to ensure everything is ready:

### Backend Files

- [x] `render.yaml` - Complete deployment configuration
  - Database configuration included
  - All environment variables set
  - rootDir set to `backend`
  - Correct build and start commands

- [x] `backend/deploy.js` - Auto-setup script
  - Creates admin user if not exists
  - Initializes payment settings
  - Runs on postinstall

- [x] `backend/health-check.js` - Verification script
  - Tests database connection
  - Verifies admin user
  - Checks payment settings
  - Validates payment math

- [x] `backend/package.json` - Updated scripts
  - postinstall: `prisma generate && prisma db push && node deploy.js`
  - start: `node src/server.js`

- [x] `backend/src/config/firebase.js` - Crash-proof Firebase
  - Disabled in production by default
  - Safe exports that never crash
  - Proper error handling

- [x] `backend/src/services/paymentTrackingService.js` - Payment calculations
  - Platform Fee: 5%
  - First Payout: 30% of organizer share
  - Second Payout: 65% of organizer share
  - Math verification included

### Frontend Files

- [x] `frontend/.env.production` - Production API URL
  - Format: `VITE_API_URL=https://matchify-backend.onrender.com`
  - No `/api` suffix (backend handles routing)

### Documentation

- [x] `DEPLOYMENT_GUIDE_COMPLETE.md` - Step-by-step instructions
- [x] `PRE_DEPLOYMENT_CHECK.md` - This checklist

## 🔍 Critical Verifications

### 1. Payment Formula (CRITICAL!)

The payment split MUST be:
- Platform Fee: 5% of total revenue
- Organizer Share: 95% of total revenue
- First Payout: 30% of organizer share
- Second Payout: 65% of organizer share

**Example with ₹160,000:**
- Platform: ₹8,000 (5%)
- Organizer: ₹152,000 (95%)
- First: ₹45,600 (30% of ₹152,000)
- Second: ₹98,800 (65% of ₹152,000)
- Total: ₹8,000 + ₹45,600 + ₹98,800 = ₹152,400 ✓

### 2. Admin Account

**Email:** ADMIN@gmail.com
**Password:** ADMIN@123(123)
**Roles:** ADMIN,PLAYER,ORGANIZER,UMPIRE

⚠️ NEVER delete or modify this account!

### 3. Environment Variables

Backend (Render):
```
NODE_ENV=production
PORT=5000
FIREBASE_ENABLED=false
DATABASE_URL=[from database]
FRONTEND_URL=https://matchify.vercel.app
CORS_ORIGIN=https://matchify.vercel.app
JWT_SECRET=[auto-generated]
JWT_REFRESH_SECRET=[auto-generated]
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
ADMIN_EMAIL=ADMIN@gmail.com
ADMIN_PASSWORD=ADMIN@123(123)
```

Frontend (Vercel):
```
VITE_API_URL=https://matchify-backend.onrender.com
```

### 4. Database Configuration

- Provider: PostgreSQL
- Version: 15
- Region: Singapore
- Plan: Free
- Name: matchify-db

### 5. Build Commands

Backend:
```bash
npm install && npx prisma generate
```

Frontend:
```bash
npm run build
```

### 6. Start Commands

Backend:
```bash
npm start
```
(Runs: `node src/server.js`)

## 🧪 Local Testing (Optional)

Before deploying, you can test locally:

### 1. Test Backend Locally

```bash
cd MATCHIFY.PRO/matchify/backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run deploy script
node deploy.js

# Start server
npm start
```

Expected output:
```
✅ Firebase disabled in production
✅ Database connected
✅ Server running on port 5000
```

### 2. Test Health Check

```bash
cd MATCHIFY.PRO/matchify/backend
node health-check.js
```

Expected output:
```
✅ Database connected successfully
✅ Admin user exists
✅ Payment settings exist
✅ Payment math verified
🎉 Health check completed successfully!
```

### 3. Test Frontend Locally

```bash
cd MATCHIFY.PRO/matchify/frontend

# Install dependencies
npm install

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📋 Deployment Order

Follow this exact order:

1. **Deploy Backend to Render** (5-10 minutes)
   - Creates database automatically
   - Runs migrations
   - Creates admin user
   - Initializes payment settings

2. **Get Backend URL** (from Render dashboard)
   - Example: `https://matchify-backend.onrender.com`

3. **Update Frontend .env.production**
   - Set VITE_API_URL to backend URL
   - Commit and push to GitHub

4. **Deploy Frontend to Vercel** (2-3 minutes)
   - Import from GitHub
   - Set root directory to `frontend`
   - Add VITE_API_URL environment variable

5. **Update Backend CORS** (in Render dashboard)
   - Set FRONTEND_URL to Vercel URL
   - Set CORS_ORIGIN to Vercel URL
   - Service will auto-redeploy

6. **Test Complete System**
   - Login as admin
   - Check all features
   - Verify payment calculations

## ⚠️ Common Mistakes to Avoid

1. ❌ Don't use `/api` suffix in VITE_API_URL
   - Wrong: `https://matchify-backend.onrender.com/api`
   - Right: `https://matchify-backend.onrender.com`

2. ❌ Don't forget to set rootDir in render.yaml
   - Must be: `rootDir: backend`

3. ❌ Don't skip updating CORS after frontend deployment
   - Backend needs to know frontend URL

4. ❌ Don't change payment formula
   - Always: 5% + 30% + 65%
   - Never: 50-50 split

5. ❌ Don't delete admin account
   - Email: ADMIN@gmail.com
   - This is the master account

## ✅ Ready to Deploy?

If all items above are checked and verified, you're ready to deploy!

Follow the steps in `DEPLOYMENT_GUIDE_COMPLETE.md` for detailed instructions.

## 🆘 Need Help?

If something goes wrong:

1. Check Render build logs for errors
2. Verify all environment variables are set
3. Run health-check.js to diagnose issues
4. Check CORS configuration
5. Verify database connection

Good luck with your deployment! 🚀
