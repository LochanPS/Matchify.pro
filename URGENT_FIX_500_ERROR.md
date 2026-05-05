# 🚨 URGENT: Fix 500 Internal Server Error

## 🔍 **Problem:**
```
GET /api/tournaments - 500 Internal Server Error
Response: {success: false, error: 'Failed to fetch tournaments'}
```

## 🎯 **Root Cause:**
The backend can't connect to the database or Prisma client is not generated properly on Vercel.

---

## ✅ **SOLUTION (Do These Steps):**

### **Step 1: Check Database Connection**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on `matchify-probackend`
3. Go to **Settings → Environment Variables**
4. Find `DATABASE_URL`

**Verify it looks like this:**
```
postgresql://username:password@host.region.provider.com:5432/database_name
```

**If it's missing or wrong:**
- Add/update the correct PostgreSQL connection string
- Get it from your database provider (Vercel Postgres, Supabase, Render, etc.)

### **Step 2: Check Vercel Logs for Exact Error**

1. Stay in `matchify-probackend` project
2. Click **"Logs"** tab (or "Runtime Logs")
3. Look for errors like:
   - `PrismaClientInitializationError`
   - `Can't reach database server`
   - `Connection refused`
   - `Invalid DATABASE_URL`

**Share the error message you see!**

### **Step 3: Verify Prisma Build Script**

Check if `backend/package.json` has:

```json
{
  "scripts": {
    "build": "prisma generate",
    "postinstall": "prisma generate"
  }
}
```

**If missing, add them!**

### **Step 4: Redeploy Backend**

1. Go to Vercel → matchify-probackend
2. Click **"Deployments"** tab
3. Click **"..."** on latest deployment
4. Click **"Redeploy"**
5. Wait 2-3 minutes
6. Check logs during deployment

### **Step 5: Test Again**

After redeployment:
```
https://matchify-probackend.vercel.app/api/tournaments
```

Should return:
```json
{
  "success": true,
  "data": {
    "tournaments": [],
    ...
  }
}
```

---

## 🔧 **Alternative: Use Vercel Postgres**

If you don't have a database yet:

1. Go to Vercel → matchify-probackend
2. Click **"Storage"** tab
3. Click **"Create Database"**
4. Select **"Postgres"**
5. Choose a region (closest to your users)
6. Click **"Create"**
7. Copy the `DATABASE_URL`
8. Go to Settings → Environment Variables
9. Update `DATABASE_URL`
10. Redeploy

---

## 📊 **Quick Diagnostic:**

Run this in your browser console:

```javascript
// Test different endpoints
const tests = [
  '/api/health',
  '/api/tournaments',
  '/api/profile'
];

for (const endpoint of tests) {
  fetch(`https://matchify-probackend.vercel.app${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  })
  .then(r => r.json())
  .then(data => console.log(`✅ ${endpoint}:`, data))
  .catch(err => console.error(`❌ ${endpoint}:`, err));
}
```

---

## 🎯 **Most Likely Issues:**

1. **DATABASE_URL is missing/invalid** (90% of cases)
2. **Prisma client not generated on Vercel** (8% of cases)
3. **Database server is down** (2% of cases)

---

## 💡 **Next Steps:**

1. **Check Vercel logs** (most important!)
2. **Verify DATABASE_URL** exists and is correct
3. **Redeploy backend**
4. **Test again**

---

## 📞 **Share With Me:**

1. What do the Vercel logs say?
2. Does `DATABASE_URL` exist in environment variables?
3. What database provider are you using?

This will help me give you the exact fix!
