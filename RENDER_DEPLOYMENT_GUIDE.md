# 🚀 Render Deployment Guide

## Current Issue

The deployment is failing because there are no PostgreSQL migrations yet. We need to create the initial migration before deploying to Render.

---

## ✅ Solution: Create Initial Migration

### Step 1: Set Up Local PostgreSQL (Required)

You MUST create the initial migration locally before deploying to Render.

1. **Install PostgreSQL** (if not already installed)
   - Windows: https://www.postgresql.org/download/windows/
   - Set password for `postgres` user

2. **Create Local Database**
   ```sql
   psql -U postgres
   CREATE DATABASE matchify_dev;
   \q
   ```

3. **Update .env** (if needed)
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/matchify_dev"
   ```

### Step 2: Create Initial Migration

```bash
cd backend

# Delete old SQLite migrations (if they exist)
rmdir /s /q prisma\migrations

# Generate Prisma Client
npx prisma generate

# Create initial migration
npx prisma migrate dev --name init
```

This will create a `prisma/migrations` folder with the initial migration.

### Step 3: Commit and Push

```bash
git add .
git commit -m "Add PostgreSQL initial migration for Render deployment"
git push origin main
```

---

## 🌐 Render Configuration

### What's Already Configured

The `render.yaml` file is set up with:

✅ **Build Command:**
```bash
npm install && npx prisma generate && npx prisma migrate deploy
```

✅ **Database:**
- PostgreSQL 15
- Free tier
- Region: Singapore

✅ **Environment Variables:**
- DATABASE_URL (auto-linked from database)
- JWT secrets (auto-generated)
- Cloudinary credentials
- Admin credentials
- Frontend URL

### Deployment Flow

1. **Render creates PostgreSQL database**
2. **Render runs build command:**
   - Installs npm packages
   - Generates Prisma Client
   - Runs migrations (`prisma migrate deploy`)
3. **Render starts the application**

---

## 🔧 Manual Render Setup (Alternative)

If you prefer to set up manually instead of using `render.yaml`:

### 1. Create PostgreSQL Database

1. Go to Render Dashboard
2. Click "New +" → "PostgreSQL"
3. Settings:
   - Name: `matchify-db`
   - Database: `matchify`
   - User: (auto-generated)
   - Region: Singapore (or closest to you)
   - Plan: Free
4. Click "Create Database"
5. Wait for database to be ready
6. Copy the **Internal Database URL**

### 2. Create Web Service

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Settings:
   - Name: `matchify-backend`
   - Region: Singapore (same as database)
   - Branch: `main`
   - Root Directory: `backend`
   - Environment: `Node`
   - Build Command: `npm install && npx prisma generate && npx prisma migrate deploy`
   - Start Command: `npm start`
   - Plan: Free

### 3. Add Environment Variables

Add these in the "Environment" tab:

```
NODE_ENV=production
PORT=5000
DATABASE_URL=[paste Internal Database URL from step 1]
FRONTEND_URL=https://your-frontend.vercel.app
CORS_ORIGIN=https://your-frontend.vercel.app
JWT_SECRET=[generate a random string]
JWT_REFRESH_SECRET=[generate a random string]
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
ADMIN_EMAIL=ADMIN@gmail.com
ADMIN_PASSWORD=ADMIN@123(123)
CLOUDINARY_CLOUD_NAME=dfg8tdgmf
CLOUDINARY_API_KEY=417764488597768
CLOUDINARY_API_SECRET=ithriq7poX0T-4_j3PWmhlVmHqI
FIREBASE_ENABLED=false
```

### 4. Deploy

Click "Create Web Service" and Render will deploy your application.

---

## 🐛 Troubleshooting

### Error: "No migration found"

**Cause:** Initial migration not created locally

**Solution:**
```bash
cd backend
npx prisma migrate dev --name init
git add prisma/migrations
git commit -m "Add initial migration"
git push
```

### Error: "Can't reach database server"

**Cause:** DATABASE_URL not set correctly

**Solution:**
- Check that DATABASE_URL is linked to your PostgreSQL database
- In Render, go to Web Service → Environment
- Verify DATABASE_URL is present and starts with `postgresql://`

### Error: "Prisma schema validation failed"

**Cause:** Schema syntax error

**Solution:**
```bash
# Validate schema locally
npx prisma validate

# Format schema
npx prisma format
```

### Error: "Build failed"

**Cause:** Various reasons

**Solution:**
1. Check Render logs for specific error
2. Verify all environment variables are set
3. Ensure migrations folder exists in repository
4. Test build locally:
   ```bash
   npm install
   npx prisma generate
   npx prisma migrate deploy
   ```

---

## ✅ Deployment Checklist

Before deploying to Render:

- [ ] PostgreSQL installed locally
- [ ] Local database created (`matchify_dev`)
- [ ] Initial migration created (`prisma/migrations` folder exists)
- [ ] Migration committed to Git
- [ ] Pushed to GitHub
- [ ] Render PostgreSQL database created
- [ ] Render Web Service configured
- [ ] All environment variables set
- [ ] Build command includes `prisma migrate deploy`

---

## 🎯 Expected Deployment Process

1. **Push to GitHub** → Triggers Render deployment
2. **Render clones repository**
3. **Render installs dependencies** → `npm install`
4. **Render generates Prisma Client** → `npx prisma generate`
5. **Render runs migrations** → `npx prisma migrate deploy`
6. **Render starts application** → `npm start`
7. **Application is live!** 🎉

---

## 📊 Post-Deployment

### Verify Deployment

1. **Check Health Endpoint:**
   ```
   https://your-app.onrender.com/health
   ```
   
   Expected response:
   ```json
   {
     "status": "ok",
     "timestamp": "2026-02-18T...",
     "environment": "production",
     "version": "1.0.0"
   }
   ```

2. **Check API Endpoint:**
   ```
   https://your-app.onrender.com/api
   ```

3. **Test Login:**
   - Use your frontend to login
   - Or use Postman/curl to test `/api/auth/login`

### Seed Production Database (Optional)

If you want to add initial data:

1. Connect to Render Shell (in Render dashboard)
2. Run:
   ```bash
   npm run prisma:seed
   ```

### View Database

1. In Render dashboard, go to your PostgreSQL database
2. Click "Connect" → "External Connection"
3. Use these credentials with a PostgreSQL client (like pgAdmin or DBeaver)

---

## 🔒 Security Notes

- Never commit `.env` file
- Use strong JWT secrets in production
- Rotate secrets regularly
- Enable SSL for database (Render does this automatically)
- Use environment variables for all sensitive data

---

## 📚 Resources

- Render Docs: https://render.com/docs
- Prisma Deployment: https://www.prisma.io/docs/guides/deployment
- PostgreSQL on Render: https://render.com/docs/databases

---

**Once the initial migration is created and pushed, Render deployment should succeed!**
