# 🚀 Matchify.pro Deployment Guide

## Quick Links
- **Frontend (Vercel)**: https://matchify.vercel.app
- **Backend (Render)**: https://matchify-backend.onrender.com
- **Health Check**: https://matchify-backend.onrender.com/health

---

## 📋 Pre-Deployment Checklist

- [x] All code committed to Git
- [x] Safety backup branch created (`pre-deployment-backup`)
- [x] Version tag created (`v1.0-local`)
- [x] Environment files configured
- [x] CORS settings updated for production
- [x] Package.json scripts updated

---

## 🔧 PART 1: Backend Deployment (Render)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Prepare for production deployment"
git push origin master
```

### Step 2: Create Render Web Service

1. Go to [render.com](https://render.com) → Sign in with GitHub
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:

| Setting | Value |
|---------|-------|
| Name | matchify-backend |
| Branch | master |
| Root Directory | backend |
| Environment | Node |
| Region | Singapore |
| Build Command | `npm install && npx prisma generate` |
| Start Command | `npm start` |

### Step 3: Add Environment Variables in Render

Go to **Environment** tab and add:

```
NODE_ENV=production
DATABASE_URL=<your_postgresql_url>
JWT_SECRET=<generate_64_char_random_string>
JWT_REFRESH_SECRET=<generate_64_char_random_string>
FRONTEND_URL=https://matchify.vercel.app
CORS_ORIGIN=https://matchify.vercel.app
RAZORPAY_KEY_ID=<your_live_key>
RAZORPAY_KEY_SECRET=<your_live_secret>
CLOUDINARY_CLOUD_NAME=<your_cloud_name>
CLOUDINARY_API_KEY=<your_api_key>
CLOUDINARY_API_SECRET=<your_api_secret>
SENDGRID_API_KEY=<your_sendgrid_key>
FROM_EMAIL=noreply@matchify.pro
```

### Step 4: Create PostgreSQL Database

**Option A: Render PostgreSQL**
1. In Render → "New +" → "PostgreSQL"
2. Name: `matchify-db`
3. Copy the **Internal Database URL**
4. Add to backend environment as `DATABASE_URL`

**Option B: Railway PostgreSQL**
1. Go to [railway.app](https://railway.app)
2. Create new project → Add PostgreSQL
3. Copy Database URL
4. Add to Render environment variables

### Step 5: Run Migrations

After DATABASE_URL is set:
1. Go to Render → Your service → **Shell** tab
2. Run: `npx prisma migrate deploy`

Or trigger a new deploy - migrations run automatically.

---

## 🎨 PART 2: Frontend Deployment (Vercel)

### Step 1: Create Vercel Project

1. Go to [vercel.com](https://vercel.com) → Sign in with GitHub
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure:

| Setting | Value |
|---------|-------|
| Framework Preset | Vite |
| Root Directory | frontend |
| Build Command | `npm run build` |
| Output Directory | `dist` |

### Step 2: Add Environment Variables

In Vercel → Settings → Environment Variables:

```
VITE_API_URL=https://matchify-backend.onrender.com/api
VITE_RAZORPAY_KEY_ID=<your_live_key>
```

### Step 3: Deploy

Click **"Deploy"** - Vercel will build and deploy automatically.

---

## 🔗 PART 3: Connect Frontend & Backend

After both are deployed:

1. Go to Render → Backend service → Environment
2. Update:
   ```
   FRONTEND_URL=https://matchify.vercel.app
   CORS_ORIGIN=https://matchify.vercel.app
   ```
3. Save → Render will auto-redeploy

---

## ✅ Testing Checklist

### Authentication
- [ ] Register new account
- [ ] Login successfully
- [ ] JWT token stored
- [ ] Protected routes work

### Tournaments
- [ ] Create tournament (as organizer)
- [ ] Upload poster (Cloudinary)
- [ ] Register for tournament
- [ ] Payment via QR code

### Notifications
- [ ] Receive notifications
- [ ] Mark as read

### WebSocket
- [ ] Real-time updates work

---

## 🚨 Troubleshooting

### CORS Error
```javascript
// Check backend CORS config allows your Vercel URL
origin: [
  'https://matchify.vercel.app',
  'https://matchify-*.vercel.app'
]
```

### Database Connection Error
- Verify DATABASE_URL is correct
- Check if database is in same region as backend

### Environment Variables Not Working
- Vercel: Redeploy after adding variables
- Render: Variables apply immediately

---

## 💾 Rollback Plan

If something breaks:

```bash
# Return to safe checkpoint
git checkout v1.0-local

# Or restore from backup branch
git checkout pre-deployment-backup
```

In Render/Vercel dashboards:
- Go to Deployments
- Find last successful deployment
- Click "Redeploy" or "Promote to Production"

---

## 📊 Monitoring

### Render Logs
- Dashboard → Your service → Logs tab

### Vercel Analytics
- Dashboard → Your project → Analytics

### Health Check
```bash
curl https://matchify-backend.onrender.com/health
```

---

## 🎉 You're Live!

**Production URLs:**
- Frontend: https://matchify.vercel.app
- Backend: https://matchify-backend.onrender.com
- API: https://matchify-backend.onrender.com/api
