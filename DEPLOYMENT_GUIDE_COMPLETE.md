# 🚀 Complete Deployment Guide for Matchify.pro

## 📋 Project Overview

**Matchify.pro** is a full-stack badminton tournament management platform built with:

### Backend (Node.js + Express + PostgreSQL)
- **Tech Stack**: Node.js, Express.js, Prisma ORM, PostgreSQL
- **Features**: 
  - JWT Authentication
  - Tournament Management
  - Match Scheduling & Scoring
  - Payment Integration (Razorpay)
  - Real-time Updates (Socket.io)
  - Image Upload (Cloudinary)
  - Email Notifications (SendGrid)
- **Port**: 5000 (local)
- **Entry Point**: `backend/src/server.js`

### Frontend (React + Vite + Tailwind CSS)
- **Tech Stack**: React 18, Vite, Tailwind CSS, React Router
- **Features**:
  - Player Dashboard
  - Organizer Dashboard
  - Admin Dashboard
  - Tournament Registration
  - Live Match Tracking
  - Leaderboards
- **Port**: 5173 (local)
- **Entry Point**: `frontend/src/main.jsx`

---

## 🎯 Deployment Strategy

### Backend → Vercel (Serverless)
### Frontend → Vercel (Static)
### Database → Vercel Postgres or External PostgreSQL

---

## 📦 Step 1: Prepare for GitHub

### 1.1 Check Git Status
```bash
cd Matchify.pro
git status
```

### 1.2 Add All Changes
```bash
git add .
```

### 1.3 Commit Changes
```bash
git commit -m "Prepare for Vercel deployment - Backend and Frontend ready"
```

### 1.4 Push to GitHub
```bash
git push origin main
```

---

## 🔧 Step 2: Backend Deployment on Vercel

### 2.1 Backend Structure for Vercel
The backend is already configured with `backend/vercel.json` and `backend/api/index.js`

### 2.2 Deploy Backend to Vercel

**Option A: Using Vercel CLI**
```bash
cd backend
npm install -g vercel
vercel login
vercel --prod
```

**Option B: Using Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. **Root Directory**: `backend`
5. **Framework Preset**: Other
6. **Build Command**: `npm run build`
7. **Output Directory**: Leave empty
8. Click "Deploy"

### 2.3 Configure Backend Environment Variables on Vercel

Go to your Vercel project → Settings → Environment Variables and add:

```env
NODE_ENV=production
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_super_secret_jwt_key_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
FRONTEND_URL=https://your-frontend.vercel.app
CORS_ORIGIN=https://your-frontend.vercel.app
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@matchify.pro
ADMIN_EMAIL=admin@matchify.pro
ADMIN_PASSWORD=your_secure_admin_password
```

### 2.4 Database Setup Options

**Option A: Vercel Postgres (Recommended)**
1. In Vercel Dashboard → Storage → Create Database
2. Select "Postgres"
3. Copy the `DATABASE_URL` connection string
4. Add it to Environment Variables

**Option B: External PostgreSQL (Render, Railway, Supabase)**
1. Create a PostgreSQL database on your preferred platform
2. Copy the connection string
3. Add it to Vercel Environment Variables

### 2.5 Run Database Migrations
After deployment, run migrations:
```bash
# Using Vercel CLI
vercel env pull .env.production
npx prisma migrate deploy
```

---

## 🎨 Step 3: Frontend Deployment on Vercel

### 3.1 Deploy Frontend to Vercel

**Option A: Using Vercel CLI**
```bash
cd frontend
vercel --prod
```

**Option B: Using Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository (or create a new project)
4. **Root Directory**: `frontend`
5. **Framework Preset**: Vite
6. **Build Command**: `npm run build`
7. **Output Directory**: `dist`
8. Click "Deploy"

### 3.2 Configure Frontend Environment Variables on Vercel

Go to your Vercel project → Settings → Environment Variables and add:

```env
VITE_API_URL=https://your-backend.vercel.app/api
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
VITE_APP_NAME=Matchify.pro
VITE_APP_VERSION=1.0.0
```

**Important**: Replace `https://your-backend.vercel.app` with your actual backend Vercel URL

---

## 🔄 Step 4: Update CORS Settings

After both deployments, update the backend CORS settings:

1. Go to Backend Vercel Project → Settings → Environment Variables
2. Update `FRONTEND_URL` and `CORS_ORIGIN` with your actual frontend URL:
   ```
   FRONTEND_URL=https://your-frontend.vercel.app
   CORS_ORIGIN=https://your-frontend.vercel.app
   ```
3. Redeploy the backend

---

## ✅ Step 5: Verify Deployment

### 5.1 Test Backend
Visit: `https://your-backend.vercel.app/api/health`

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

### 5.2 Test Frontend
Visit: `https://your-frontend.vercel.app`

You should see the Matchify.pro homepage

### 5.3 Test Full Flow
1. Register a new user
2. Login
3. Create a tournament (as organizer)
4. Register for a tournament (as player)

---

## 🔐 Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secrets (generate with `openssl rand -base64 32`)
- [ ] Enable HTTPS only
- [ ] Set proper CORS origins
- [ ] Secure all API keys
- [ ] Enable rate limiting
- [ ] Set up database backups

---

## 📊 Monitoring & Logs

### View Backend Logs
```bash
vercel logs your-backend-project-name --prod
```

### View Frontend Logs
```bash
vercel logs your-frontend-project-name --prod
```

---

## 🐛 Troubleshooting

### Backend Issues

**Problem**: Database connection fails
- **Solution**: Check `DATABASE_URL` format and credentials
- Ensure database allows connections from Vercel IPs

**Problem**: CORS errors
- **Solution**: Update `CORS_ORIGIN` to match frontend URL exactly

**Problem**: Prisma errors
- **Solution**: Run `npx prisma generate` and `npx prisma migrate deploy`

### Frontend Issues

**Problem**: API calls fail
- **Solution**: Check `VITE_API_URL` points to correct backend URL

**Problem**: Build fails
- **Solution**: Check for TypeScript/ESLint errors locally first

**Problem**: Environment variables not working
- **Solution**: Ensure all env vars start with `VITE_` prefix

---

## 🔄 Continuous Deployment

Both projects are now set up for automatic deployment:
- Push to `main` branch → Automatic deployment to production
- Push to other branches → Preview deployments

---

## 📝 Quick Commands Reference

### Local Development
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

### Deployment
```bash
# Deploy Backend
cd backend
vercel --prod

# Deploy Frontend
cd frontend
vercel --prod
```

### Database Management
```bash
# Generate Prisma Client
npx prisma generate

# Run Migrations
npx prisma migrate deploy

# Open Prisma Studio
npx prisma studio
```

---

## 🎉 You're All Set!

Your Matchify.pro application is now live on Vercel!

**Backend URL**: `https://your-backend.vercel.app`
**Frontend URL**: `https://your-frontend.vercel.app`

---

## 📞 Support

For issues or questions:
- Check Vercel logs
- Review environment variables
- Ensure database is accessible
- Verify CORS settings

**Built with ❤️ for Indian Badminton Community**
