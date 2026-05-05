# 🔧 Fix 404 Errors - Complete Guide

## 🔍 **Problems Identified:**

### 1. **All API Endpoints Returning 404**
```
❌ GET /tournaments - 404
❌ GET /registrations/my - 404
❌ GET /matches - 404
❌ GET /organizer/dashboard - 404
❌ POST /tournaments - 404
```

### 2. **Error Message**
```
Error creating tournament
Service unavailable. Please check your connection and try again.
```

### 3. **QR Code Image Not Loading**
Broken image icon visible in the form

---

## 🎯 **Root Causes:**

1. **Backend Vercel Configuration Issue**
   - The `vercel.json` might not be routing requests correctly
   - Serverless functions need proper routing

2. **Missing Environment Variables**
   - Frontend `.env` file was missing locally

3. **Possible Backend Deployment Issue**
   - Routes might not be properly deployed to Vercel

---

## ✅ **Solutions:**

### **Solution 1: Fix Backend Vercel Routing**

The current `backend/vercel.json` routes everything to `api/index.js`, but Vercel might not be handling the routes correctly.

**Update `backend/vercel.json`:**

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/api/index.js"
    }
  ],
  "env": {
    "VERCEL": "1"
  }
}
```

### **Solution 2: Test Backend Health**

Open this URL in your browser:
```
https://matchify-probackend.vercel.app/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "message": "MATCHIFY.PRO API is running",
  "timestamp": "2026-05-05T...",
  "uptime": 123.45,
  "environment": "production",
  "version": "1.0.0"
}
```

**If you get 404:**
- Backend deployment failed
- Need to redeploy backend

### **Solution 3: Check Backend Environment Variables**

Go to Vercel → matchify-probackend → Settings → Environment Variables

**Required Variables:**
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
FRONTEND_URL=https://matchify-ebbzod065-destroyerforevers-projects.vercel.app
CORS_ORIGIN=https://matchify-ebbzod065-destroyerforevers-projects.vercel.app
NODE_ENV=production
```

### **Solution 4: Redeploy Backend**

1. Go to Vercel Dashboard
2. Select `matchify-probackend` project
3. Go to Deployments tab
4. Click "..." on latest deployment
5. Click "Redeploy"
6. Wait 2-3 minutes

### **Solution 5: Check CORS Settings**

The CORS error might be blocking requests. Verify:

1. `FRONTEND_URL` matches your actual frontend URL
2. `CORS_ORIGIN` matches your actual frontend URL
3. No trailing slashes in URLs

---

## 🧪 **Testing Steps:**

### Step 1: Test Backend Health
```bash
curl https://matchify-probackend.vercel.app/api/health
```

### Step 2: Test Tournaments Endpoint
```bash
curl https://matchify-probackend.vercel.app/api/tournaments
```

### Step 3: Test with Authentication
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://matchify-probackend.vercel.app/api/profile
```

---

## 🔧 **Quick Fix Commands:**

### For Local Development:

1. **Create Frontend .env:**
```bash
cd frontend
echo "VITE_API_URL=https://matchify-probackend.vercel.app/api" > .env
echo "VITE_APP_NAME=Matchify.pro" >> .env
echo "VITE_APP_VERSION=1.0.0" >> .env
```

2. **Restart Frontend:**
```bash
npm run dev
```

### For Production:

1. **Redeploy Backend:**
   - Go to Vercel Dashboard
   - Redeploy matchify-probackend

2. **Verify Environment Variables:**
   - Check all required vars are set
   - Verify URLs match exactly

---

## 📊 **Debugging Checklist:**

- [ ] Backend health endpoint returns 200 OK
- [ ] Backend environment variables are set
- [ ] CORS_ORIGIN matches frontend URL exactly
- [ ] Frontend .env file exists (for local dev)
- [ ] Backend redeployed after changes
- [ ] Frontend redeployed after changes
- [ ] Browser cache cleared (Ctrl + Shift + R)
- [ ] No typos in URLs

---

## 🚨 **Common Mistakes:**

1. **Trailing Slashes:**
   ```
   ❌ https://matchify-probackend.vercel.app/api/
   ✅ https://matchify-probackend.vercel.app/api
   ```

2. **Wrong CORS Origin:**
   ```
   ❌ CORS_ORIGIN=https://matchify-pro.vercel.app
   ✅ CORS_ORIGIN=https://matchify-ebbzod065-destroyerforevers-projects.vercel.app
   ```

3. **Missing /api in Frontend:**
   ```
   ❌ VITE_API_URL=https://matchify-probackend.vercel.app
   ✅ VITE_API_URL=https://matchify-probackend.vercel.app/api
   ```

---

## 💡 **Next Steps:**

1. **Test backend health endpoint first**
2. **If 404, redeploy backend**
3. **If 200 OK, check CORS settings**
4. **Clear browser cache and test again**

---

**Need Help?**
Share the response from:
```
https://matchify-probackend.vercel.app/api/health
```

This will tell us if the backend is working!
