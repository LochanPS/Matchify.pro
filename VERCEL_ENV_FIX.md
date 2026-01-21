# 🔥 CRITICAL FIX: Vercel Environment Variables

## THE PROBLEM:

Your frontend is trying to connect to `localhost:5000` instead of your production backend at `https://matchify-pro.onrender.com`!

**This is why:**
- ✅ Admin works locally (connects to localhost)
- ❌ Registration/Login fails on production (localhost doesn't exist)

---

## ✅ THE FIX - DO THIS NOW:

### Step 1: Go to Vercel Dashboard
1. Open https://vercel.com/dashboard
2. Click on your `matchify-pro` project
3. Go to **Settings** tab
4. Click **Environment Variables** in the left sidebar

### Step 2: Add Environment Variable
1. Click **Add New** button
2. Enter:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://matchify-pro.onrender.com/api`
   - **Environment**: Select all (Production, Preview, Development)
3. Click **Save**

### Step 3: Redeploy
1. Go to **Deployments** tab
2. Click the **...** menu on the latest deployment
3. Click **Redeploy**
4. Wait 2-3 minutes for deployment to complete

---

## 🎯 WHAT THIS DOES:

**Before:**
```
Frontend (Vercel) → tries to connect to localhost:5000 → ❌ FAILS
```

**After:**
```
Frontend (Vercel) → connects to matchify-pro.onrender.com → ✅ WORKS
```

---

## 📝 ALTERNATIVE: Use Vercel CLI

If you have Vercel CLI installed:

```bash
cd matchify/frontend
vercel env add VITE_API_URL production
# Enter: https://matchify-pro.onrender.com/api

vercel env add VITE_API_URL preview
# Enter: https://matchify-pro.onrender.com/api

vercel env add VITE_API_URL development
# Enter: https://matchify-pro.onrender.com/api

# Redeploy
vercel --prod
```

---

## 🧪 HOW TO VERIFY IT'S FIXED:

After redeploying:

1. Open https://matchify-pro.vercel.app
2. Open DevTools (F12)
3. Go to Network tab
4. Try to register or login
5. Check the request URL - should be `https://matchify-pro.onrender.com/api/multi-auth/...`
6. Should NOT be `localhost:5000`

---

## 📊 CURRENT STATUS:

- ✅ Backend: Working perfectly at `https://matchify-pro.onrender.com`
- ✅ Frontend code: Correct
- ❌ Vercel environment variable: MISSING
- 🔧 Fix: Add `VITE_API_URL` to Vercel dashboard

---

## ⚠️ IMPORTANT:

**This is NOT an API key issue!** Your API keys are fine. The problem is simply that Vercel doesn't know where your backend is located.

Once you add the environment variable and redeploy, everything will work!

---

## 🎉 AFTER THE FIX:

- ✅ Registration will work
- ✅ Login will work
- ✅ All API calls will work
- ✅ Users can sign up and use the app

**DO THIS NOW: Add the environment variable in Vercel dashboard!**
