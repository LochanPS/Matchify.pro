# 🚀 DEPLOY NOW - Quick Deployment Guide

## ✅ Status: Ready to Deploy!

Your code is already on GitHub and ready for Vercel deployment.

---

## 🎯 Deploy in 3 Steps

### Step 1: Deploy Backend (5 minutes)

1. Go to **[vercel.com/new](https://vercel.com/new)**
2. Click "Import Git Repository"
3. Select: `LochanPS/Matchify.pro`
4. Configure:
   - **Project Name**: `matchify-backend`
   - **Framework**: Other
   - **Root Directory**: `backend` ⚠️
   - **Build Command**: `npm run build`
   - **Output Directory**: (leave empty)

5. **Add Environment Variables** (click "Environment Variables"):

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your_random_secret_here_32_chars
JWT_REFRESH_SECRET=another_random_secret_32_chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
FRONTEND_URL=https://your-frontend.vercel.app
CORS_ORIGIN=https://your-frontend.vercel.app
RAZORPAY_KEY_ID=optional_for_now
RAZORPAY_KEY_SECRET=optional_for_now
CLOUDINARY_CLOUD_NAME=optional_for_now
CLOUDINARY_API_KEY=optional_for_now
CLOUDINARY_API_SECRET=optional_for_now
SENDGRID_API_KEY=optional_for_now
SENDGRID_FROM_EMAIL=noreply@matchify.pro
ADMIN_EMAIL=admin@matchify.pro
ADMIN_PASSWORD=YourSecurePassword123
```

6. Click **"Deploy"**
7. Wait 2-3 minutes
8. **Copy your backend URL**: `https://matchify-backend-xxx.vercel.app`

---

### Step 2: Get a Database (Choose One)

#### Option A: Vercel Postgres (Easiest)
1. In your backend project → Storage → Create Database
2. Select "Postgres"
3. Copy the `DATABASE_URL`
4. Go to Settings → Environment Variables
5. Update `DATABASE_URL`
6. Redeploy

#### Option B: Free External Database
- **Supabase**: [supabase.com](https://supabase.com) - Free tier
- **Render**: [render.com](https://render.com) - Free PostgreSQL
- **Railway**: [railway.app](https://railway.app) - Free tier

Get the connection string and add it to Vercel environment variables.

---

### Step 3: Deploy Frontend (3 minutes)

1. Go to **[vercel.com/new](https://vercel.com/new)** again
2. Click "Import Git Repository"
3. Select: `LochanPS/Matchify.pro` (same repo)
4. Configure:
   - **Project Name**: `matchify-frontend`
   - **Framework**: Vite
   - **Root Directory**: `frontend` ⚠️
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. **Add Environment Variables**:

```env
VITE_API_URL=https://matchify-backend-xxx.vercel.app/api
VITE_RAZORPAY_KEY_ID=optional_for_now
VITE_APP_NAME=Matchify.pro
VITE_APP_VERSION=1.0.0
```

⚠️ **Replace** `https://matchify-backend-xxx.vercel.app` with YOUR actual backend URL from Step 1!

6. Click **"Deploy"**
7. Wait 2-3 minutes
8. **Your app is LIVE!** 🎉

---

## 🔄 Step 4: Update CORS (Important!)

1. Go to your **backend** project on Vercel
2. Settings → Environment Variables
3. Update these with your actual frontend URL:
   ```
   FRONTEND_URL=https://matchify-frontend-xxx.vercel.app
   CORS_ORIGIN=https://matchify-frontend-xxx.vercel.app
   ```
4. Go to Deployments → Click "..." → Redeploy

---

## ✅ Step 5: Test Your App

1. Open your frontend URL: `https://matchify-frontend-xxx.vercel.app`
2. You should see the Matchify.pro homepage
3. Try to register a new user
4. Try to login
5. Browse tournaments

---

## 🎯 Your Deployment URLs

After deployment, you'll have:

```
Backend:  https://matchify-backend-xxx.vercel.app
Frontend: https://matchify-frontend-xxx.vercel.app
```

Save these URLs!

---

## 🔐 Generate Strong Secrets

For `JWT_SECRET` and `JWT_REFRESH_SECRET`, use:

**Windows (PowerShell):**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

**Or use this online tool:**
https://generate-secret.vercel.app/32

---

## 🐛 Common Issues

### "Cannot connect to database"
- Make sure you added a valid `DATABASE_URL`
- Check database allows connections from anywhere (0.0.0.0/0)

### "CORS error"
- Update `CORS_ORIGIN` in backend to match frontend URL exactly
- Redeploy backend after updating

### "Build failed"
- Check Vercel build logs
- Make sure Root Directory is set correctly

### "Environment variables not working"
- Frontend vars MUST start with `VITE_`
- Redeploy after adding variables

---

## 📊 After Deployment

### Run Database Migrations

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link to backend project
cd backend
vercel link

# Pull environment variables
vercel env pull

# Run migrations
npx prisma migrate deploy
npx prisma generate
```

---

## 🎉 Success Checklist

- [ ] Backend deployed to Vercel
- [ ] Frontend deployed to Vercel
- [ ] Database connected
- [ ] Environment variables set
- [ ] CORS updated
- [ ] Database migrations run
- [ ] App tested and working

---

## 📞 Need Help?

1. Check Vercel deployment logs
2. Verify all environment variables
3. Test backend health: `https://your-backend.vercel.app/health`
4. Check browser console for errors

---

## 🚀 You're Live!

Your Matchify.pro app is now deployed and accessible worldwide!

**Next Steps:**
- Share your app URL with users
- Set up custom domain (optional)
- Add API keys for full features (Razorpay, Cloudinary, etc.)
- Monitor usage and logs

---

**Built with ❤️ for Indian Badminton Community**
