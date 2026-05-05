# 🔐 Deployment Codes & Configuration

## 📋 Complete Environment Variables

### Backend Environment Variables (Vercel)

Copy and paste these into Vercel → Settings → Environment Variables:

```env
NODE_ENV=production
DATABASE_URL=postgresql://username:password@host:5432/database_name
JWT_SECRET=CHANGE_THIS_TO_RANDOM_32_CHARS
JWT_REFRESH_SECRET=CHANGE_THIS_TO_ANOTHER_RANDOM_32_CHARS
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
FRONTEND_URL=https://your-frontend-name.vercel.app
CORS_ORIGIN=https://your-frontend-name.vercel.app
RAZORPAY_KEY_ID=optional_for_testing
RAZORPAY_KEY_SECRET=optional_for_testing
RAZORPAY_WEBHOOK_SECRET=optional_for_testing
CLOUDINARY_CLOUD_NAME=optional_for_testing
CLOUDINARY_API_KEY=optional_for_testing
CLOUDINARY_API_SECRET=optional_for_testing
SENDGRID_API_KEY=optional_for_testing
SENDGRID_FROM_EMAIL=noreply@matchify.pro
ADMIN_EMAIL=admin@matchify.pro
ADMIN_PASSWORD=YourSecurePassword123
```

### Frontend Environment Variables (Vercel)

Copy and paste these into Vercel → Settings → Environment Variables:

```env
VITE_API_URL=https://your-backend-name.vercel.app/api
VITE_RAZORPAY_KEY_ID=optional_for_testing
VITE_APP_NAME=Matchify.pro
VITE_APP_VERSION=1.0.0
```

---

## 🔑 Generate Strong Secrets

### For JWT_SECRET and JWT_REFRESH_SECRET

**Option 1: PowerShell (Windows)**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

**Option 2: Node.js**
```javascript
require('crypto').randomBytes(32).toString('hex')
```

**Option 3: Online Generator**
Visit: https://generate-secret.vercel.app/32

---

## 🗄️ Database Options

### Option 1: Vercel Postgres (Recommended)

1. In Vercel Dashboard → Your Backend Project
2. Click "Storage" tab
3. Click "Create Database"
4. Select "Postgres"
5. Choose region (closest to your users)
6. Click "Create"
7. Copy the `DATABASE_URL` (starts with `postgresql://`)
8. Add it to Environment Variables
9. Redeploy

**Connection String Format:**
```
postgresql://username:password@host:5432/database_name?sslmode=require
```

### Option 2: Supabase (Free)

1. Go to [supabase.com](https://supabase.com)
2. Create account and new project
3. Go to Settings → Database
4. Copy "Connection string" (URI format)
5. Replace `[YOUR-PASSWORD]` with your actual password
6. Add to Vercel environment variables

**Example:**
```
postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:5432/postgres
```

### Option 3: Render (Free)

1. Go to [render.com](https://render.com)
2. Create account
3. New → PostgreSQL
4. Name: `matchify-db`
5. Free plan
6. Create Database
7. Copy "External Database URL"
8. Add to Vercel environment variables

**Example:**
```
postgresql://user:pass@dpg-xxx.oregon-postgres.render.com/dbname
```

### Option 4: Railway (Free Trial)

1. Go to [railway.app](https://railway.app)
2. Create account
3. New Project → Provision PostgreSQL
4. Click database → Connect
5. Copy "Postgres Connection URL"
6. Add to Vercel environment variables

---

## 🚀 Vercel Deployment Configuration

### Backend Configuration

```json
{
  "name": "matchify-backend",
  "framework": "Other",
  "rootDirectory": "backend",
  "buildCommand": "npm run build",
  "outputDirectory": "",
  "installCommand": "npm install",
  "devCommand": "npm run dev"
}
```

### Frontend Configuration

```json
{
  "name": "matchify-frontend",
  "framework": "Vite",
  "rootDirectory": "frontend",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "devCommand": "npm run dev"
}
```

---

## 📝 Vercel CLI Commands

### Install Vercel CLI
```bash
npm install -g vercel
```

### Login to Vercel
```bash
vercel login
```

### Deploy Backend
```bash
cd backend
vercel --prod
```

### Deploy Frontend
```bash
cd frontend
vercel --prod
```

### Link Project
```bash
vercel link
```

### Pull Environment Variables
```bash
vercel env pull
```

### View Logs
```bash
vercel logs
```

---

## 🔧 Database Migration Commands

After deploying backend and setting up database:

```bash
# Navigate to backend
cd backend

# Install Vercel CLI (if not installed)
npm install -g vercel

# Login to Vercel
vercel login

# Link to your backend project
vercel link

# Pull production environment variables
vercel env pull .env.production

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# (Optional) Seed database with test data
npx prisma db seed
```

---

## 🎯 Deployment Checklist

### Pre-Deployment
- [ ] Code pushed to GitHub
- [ ] Database ready (Vercel Postgres, Supabase, Render, or Railway)
- [ ] JWT secrets generated
- [ ] Admin password chosen

### Backend Deployment
- [ ] Create new Vercel project
- [ ] Set root directory to `backend`
- [ ] Add all environment variables
- [ ] Deploy
- [ ] Copy backend URL
- [ ] Run database migrations

### Frontend Deployment
- [ ] Create new Vercel project
- [ ] Set root directory to `frontend`
- [ ] Add environment variables (use backend URL)
- [ ] Deploy
- [ ] Copy frontend URL

### Post-Deployment
- [ ] Update backend CORS_ORIGIN with frontend URL
- [ ] Update backend FRONTEND_URL with frontend URL
- [ ] Redeploy backend
- [ ] Test health endpoint: `https://backend-url/health`
- [ ] Test frontend: `https://frontend-url`
- [ ] Register test user
- [ ] Login test user
- [ ] Create test tournament

---

## 🧪 Testing Endpoints

### Backend Health Check
```bash
curl https://your-backend.vercel.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "environment": "production",
  "version": "1.0.0"
}
```

### API Health Check
```bash
curl https://your-backend.vercel.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "message": "MATCHIFY.PRO API is running",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "uptime": 123.45,
  "environment": "production",
  "version": "1.0.0"
}
```

---

## 🔐 Security Best Practices

### Strong Passwords
- Admin password: At least 12 characters, mix of letters, numbers, symbols
- Database password: Auto-generated by provider (don't change)

### JWT Secrets
- Use 32+ character random strings
- Never reuse secrets across environments
- Never commit secrets to Git

### Environment Variables
- Never commit `.env` files
- Use Vercel's environment variable system
- Separate dev/staging/production secrets

### CORS Configuration
- Only allow your frontend domain
- Update CORS_ORIGIN after frontend deployment
- Don't use wildcards (*) in production

---

## 📊 Monitoring & Logs

### View Deployment Logs
1. Go to Vercel Dashboard
2. Select your project
3. Click "Deployments"
4. Click on latest deployment
5. View build logs and runtime logs

### View Runtime Logs (CLI)
```bash
# Backend logs
vercel logs matchify-backend --prod

# Frontend logs
vercel logs matchify-frontend --prod

# Follow logs in real-time
vercel logs matchify-backend --prod --follow
```

### Common Log Locations
- Build errors: Deployment → Build Logs
- Runtime errors: Deployment → Runtime Logs
- Database errors: Check DATABASE_URL connection
- CORS errors: Check CORS_ORIGIN matches frontend URL

---

## 🐛 Troubleshooting

### "Cannot connect to database"
```bash
# Test database connection locally
cd backend
vercel env pull
npx prisma db push
```

### "CORS error in browser"
1. Check backend CORS_ORIGIN matches frontend URL exactly
2. No trailing slash in URLs
3. Redeploy backend after updating

### "Environment variables not working"
1. Frontend vars must start with `VITE_`
2. Redeploy after adding variables
3. Clear browser cache

### "Build failed"
```bash
# Test build locally
cd backend
npm run build

cd frontend
npm run build
```

### "Prisma errors"
```bash
# Regenerate Prisma client
npx prisma generate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Deploy migrations
npx prisma migrate deploy
```

---

## 🎉 Success Indicators

### Backend is Working
- ✅ Health endpoint returns 200 OK
- ✅ API endpoint returns JSON
- ✅ No CORS errors in browser console
- ✅ Database migrations completed

### Frontend is Working
- ✅ Homepage loads
- ✅ No console errors
- ✅ Can navigate between pages
- ✅ API calls work (check Network tab)

### Full System is Working
- ✅ Can register new user
- ✅ Can login
- ✅ Can view tournaments
- ✅ Can create tournament (as organizer)
- ✅ Can register for tournament (as player)

---

## 📞 Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs
- **React Docs**: https://react.dev
- **Vite Docs**: https://vitejs.dev

---

## 🚀 Your Deployment URLs

After deployment, save these:

```
GitHub Repository: https://github.com/LochanPS/Matchify.pro
Backend URL: https://matchify-backend-xxx.vercel.app
Frontend URL: https://matchify-frontend-xxx.vercel.app
Database: [Your database provider and URL]
```

---

**Built with ❤️ for Indian Badminton Community**

*Last Updated: May 5, 2026*
