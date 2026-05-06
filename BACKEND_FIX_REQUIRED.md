# 🚨 CRITICAL: Backend Environment Variables Missing

**Date:** May 6, 2026  
**Issue:** Login failing with 500 error - Backend not properly configured  
**Root Cause:** Missing environment variables in Vercel backend deployment

---

## Problem

The backend is deployed but returning 500 errors because critical environment variables are not set in Vercel.

**Error in Console:**
```
POST https://matchify-probackend.vercel.app/api/auth/login 500 (Internal Server Error)
Login error: be
```

---

## IMMEDIATE FIX - Set Vercel Environment Variables

### Step 1: Go to Backend Project in Vercel

1. Open https://vercel.com/
2. Select project: **matchify-probackend**
3. Go to **Settings** → **Environment Variables**

### Step 2: Add Required Environment Variables

Add these variables (select all environments: Production, Preview, Development):

#### **CRITICAL - Database**
```
DATABASE_URL = your_postgresql_connection_string
```
Example: `postgresql://username:password@host:5432/database_name`

#### **CRITICAL - JWT Secrets**
```
JWT_SECRET = your-super-secret-jwt-key-minimum-32-characters-long
JWT_REFRESH_SECRET = your-super-secret-refresh-key-minimum-32-characters-long
JWT_EXPIRES_IN = 7d
JWT_REFRESH_EXPIRES_IN = 30d
```

#### **CRITICAL - Frontend URL**
```
FRONTEND_URL = https://www.matchify.pro
CORS_ORIGIN = https://www.matchify.pro
```

#### **Required - Cloudinary (Image Upload)**
```
CLOUDINARY_CLOUD_NAME = your_cloud_name
CLOUDINARY_API_KEY = your_api_key
CLOUDINARY_API_SECRET = your_api_secret
```

#### **Required - Razorpay (Payments)**
```
RAZORPAY_KEY_ID = your_razorpay_key_id
RAZORPAY_KEY_SECRET = your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET = your_razorpay_webhook_secret
```

#### **Optional - Email Service**
```
SENDGRID_API_KEY = your_sendgrid_api_key
SENDGRID_FROM_EMAIL = noreply@matchify.pro
```

#### **Optional - Admin**
```
ADMIN_EMAIL = admin@matchify.pro
ADMIN_PASSWORD = your_secure_admin_password
```

#### **System**
```
NODE_ENV = production
PORT = 5000
```

### Step 3: Redeploy Backend

After adding all environment variables:

1. Go to **Deployments** tab
2. Click on latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

### Step 4: Test Backend

Test the backend health endpoint:
```
https://matchify-probackend.vercel.app/api/health
```

Should return:
```json
{
  "status": "healthy",
  "message": "MATCHIFY.PRO API is running",
  "authRoutesLoaded": true
}
```

---

## Database Setup

If you don't have a PostgreSQL database yet:

### Option 1: Vercel Postgres (Recommended)

1. In Vercel dashboard, go to **Storage** tab
2. Click **Create Database**
3. Select **Postgres**
4. Follow the setup wizard
5. Vercel will automatically add `DATABASE_URL` to your environment variables

### Option 2: External PostgreSQL

Use services like:
- **Neon** (https://neon.tech) - Free tier available
- **Supabase** (https://supabase.com) - Free tier available
- **Railway** (https://railway.app) - Free tier available
- **ElephantSQL** (https://www.elephantsql.com) - Free tier available

After creating database, copy the connection string and add it as `DATABASE_URL` in Vercel.

---

## Generate Secure JWT Secrets

Use this command to generate secure secrets:

```bash
# On Mac/Linux
openssl rand -base64 32

# On Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Or use online generator
# https://generate-secret.vercel.app/32
```

Generate TWO different secrets:
1. One for `JWT_SECRET`
2. One for `JWT_REFRESH_SECRET`

---

## Verification Checklist

After setting environment variables and redeploying:

- [ ] Backend health endpoint returns 200 OK
- [ ] Database connection is working
- [ ] Login endpoint returns proper response (not 500)
- [ ] Frontend can successfully login
- [ ] JWT tokens are being generated
- [ ] User data is being stored in database

---

## Testing Login

After fix, test login:

1. Go to https://www.matchify.pro/login
2. Open browser console (F12)
3. Try to login with test credentials
4. Check Network tab for API response
5. Should see 200 OK with user data and tokens

---

## Common Issues

### Issue 1: Still getting 500 error
**Solution:** Check Vercel logs for specific error message
- Go to Deployments → Click deployment → View Function Logs

### Issue 2: Database connection error
**Solution:** Verify DATABASE_URL format is correct
- Should start with `postgresql://`
- Should include username, password, host, port, database name

### Issue 3: CORS error
**Solution:** Verify FRONTEND_URL and CORS_ORIGIN match your frontend URL
- Should be `https://www.matchify.pro` (no trailing slash)

---

## Priority Order

Fix in this order:

1. **DATABASE_URL** - Most critical
2. **JWT_SECRET & JWT_REFRESH_SECRET** - Required for auth
3. **FRONTEND_URL & CORS_ORIGIN** - Required for CORS
4. **CLOUDINARY** - Required for image uploads
5. **RAZORPAY** - Required for payments
6. **SENDGRID** - Optional (for emails)

---

## After Fix

Once backend is working:

1. Update frontend `.env` if needed (already done locally)
2. Test all authentication flows
3. Test tournament creation
4. Test image uploads
5. Test payment flows

---

**CRITICAL:** Without these environment variables, the backend CANNOT function!

**Next Steps:**
1. Set all environment variables in Vercel backend project
2. Redeploy backend
3. Test health endpoint
4. Test login functionality
5. Verify everything works end-to-end
