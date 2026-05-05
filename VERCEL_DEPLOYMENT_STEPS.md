# 🚀 Quick Vercel Deployment Steps

## ✅ Pre-Deployment Checklist

- [x] Code pushed to GitHub
- [ ] Vercel account created
- [ ] PostgreSQL database ready
- [ ] All API keys collected (Razorpay, Cloudinary, SendGrid)

---

## 📦 Part 1: Deploy Backend to Vercel

### Step 1: Create New Project for Backend
1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select your `Matchify.pro` repository
4. Click "Import"

### Step 2: Configure Backend Project
- **Project Name**: `matchify-backend` (or your choice)
- **Framework Preset**: Other
- **Root Directory**: `backend` ⚠️ IMPORTANT
- **Build Command**: `npm run build`
- **Output Directory**: (leave empty)
- **Install Command**: `npm install`

### Step 3: Add Backend Environment Variables
Click "Environment Variables" and add these:

```
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=generate_random_string_here
JWT_REFRESH_SECRET=generate_another_random_string
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
FRONTEND_URL=https://your-frontend-url.vercel.app
CORS_ORIGIN=https://your-frontend-url.vercel.app
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM_EMAIL=noreply@matchify.pro
ADMIN_EMAIL=admin@matchify.pro
ADMIN_PASSWORD=your_secure_password
```

### Step 4: Deploy Backend
- Click "Deploy"
- Wait for deployment to complete
- Copy your backend URL: `https://matchify-backend-xxx.vercel.app`

### Step 5: Setup Database (if using Vercel Postgres)
1. Go to your project dashboard
2. Click "Storage" tab
3. Click "Create Database"
4. Select "Postgres"
5. Choose a region close to your users
6. Click "Create"
7. Copy the `DATABASE_URL` connection string
8. Go to Settings → Environment Variables
9. Update `DATABASE_URL` with the new value
10. Redeploy the project

### Step 6: Run Database Migrations
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link to your project
cd backend
vercel link

# Pull environment variables
vercel env pull .env.production

# Run migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

---

## 🎨 Part 2: Deploy Frontend to Vercel

### Step 1: Create New Project for Frontend
1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select your `Matchify.pro` repository again
4. Click "Import"

### Step 2: Configure Frontend Project
- **Project Name**: `matchify-frontend` (or your choice)
- **Framework Preset**: Vite
- **Root Directory**: `frontend` ⚠️ IMPORTANT
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 3: Add Frontend Environment Variables
Click "Environment Variables" and add these:

```
VITE_API_URL=https://matchify-backend-xxx.vercel.app/api
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
VITE_APP_NAME=Matchify.pro
VITE_APP_VERSION=1.0.0
```

⚠️ **IMPORTANT**: Replace `https://matchify-backend-xxx.vercel.app` with your actual backend URL from Part 1

### Step 4: Deploy Frontend
- Click "Deploy"
- Wait for deployment to complete
- Copy your frontend URL: `https://matchify-frontend-xxx.vercel.app`

---

## 🔄 Part 3: Update CORS Settings

### Step 1: Update Backend Environment Variables
1. Go to your backend project on Vercel
2. Click Settings → Environment Variables
3. Update these variables with your actual frontend URL:
   ```
   FRONTEND_URL=https://matchify-frontend-xxx.vercel.app
   CORS_ORIGIN=https://matchify-frontend-xxx.vercel.app
   ```
4. Click "Save"

### Step 2: Redeploy Backend
1. Go to Deployments tab
2. Click the three dots on the latest deployment
3. Click "Redeploy"
4. Wait for redeployment to complete

---

## ✅ Part 4: Test Your Deployment

### Test Backend
1. Open: `https://matchify-backend-xxx.vercel.app/api/health`
2. You should see: `{"status":"ok"}`

### Test Frontend
1. Open: `https://matchify-frontend-xxx.vercel.app`
2. You should see the Matchify.pro homepage
3. Try to register a new user
4. Try to login
5. Check if API calls work

---

## 🎯 Part 5: Custom Domain (Optional)

### For Backend
1. Go to backend project → Settings → Domains
2. Add your custom domain: `api.matchify.pro`
3. Follow DNS configuration instructions
4. Update frontend `VITE_API_URL` to use new domain
5. Redeploy frontend

### For Frontend
1. Go to frontend project → Settings → Domains
2. Add your custom domain: `matchify.pro` or `www.matchify.pro`
3. Follow DNS configuration instructions
4. Update backend `CORS_ORIGIN` to use new domain
5. Redeploy backend

---

## 🐛 Troubleshooting

### Backend Issues

**Problem**: "Cannot find module 'prisma'"
```bash
# Solution: Add postinstall script to package.json
"scripts": {
  "postinstall": "prisma generate"
}
```

**Problem**: Database connection timeout
- Check if `DATABASE_URL` is correct
- Ensure database allows connections from Vercel IPs
- Try using connection pooling: Add `?pgbouncer=true` to DATABASE_URL

**Problem**: CORS errors
- Ensure `CORS_ORIGIN` matches frontend URL exactly (no trailing slash)
- Check if frontend URL is correct in environment variables
- Redeploy backend after updating CORS settings

### Frontend Issues

**Problem**: API calls return 404
- Check if `VITE_API_URL` is correct
- Ensure it ends with `/api` (e.g., `https://backend.vercel.app/api`)
- Check browser console for exact error

**Problem**: Environment variables not working
- Ensure all variables start with `VITE_` prefix
- Redeploy after adding/updating variables
- Clear browser cache

**Problem**: Build fails
- Check for TypeScript/ESLint errors locally first
- Run `npm run build` locally to test
- Check Vercel build logs for specific errors

---

## 📊 Monitoring

### View Logs
```bash
# Backend logs
vercel logs matchify-backend --prod

# Frontend logs
vercel logs matchify-frontend --prod
```

### Check Deployment Status
- Go to Vercel dashboard
- Click on your project
- View "Deployments" tab
- Check build logs and runtime logs

---

## 🔐 Security Reminders

- [ ] Change all default passwords
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Never commit `.env` files
- [ ] Enable 2FA on Vercel account
- [ ] Set up database backups
- [ ] Monitor error logs regularly
- [ ] Keep dependencies updated

---

## 🎉 Success!

Your Matchify.pro application is now live!

**Backend**: `https://matchify-backend-xxx.vercel.app`
**Frontend**: `https://matchify-frontend-xxx.vercel.app`

### Next Steps:
1. Test all features thoroughly
2. Set up custom domains
3. Configure monitoring and alerts
4. Set up automated backups
5. Share with users!

---

## 📞 Need Help?

- Check Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
- Review deployment logs
- Check environment variables
- Verify database connection
- Test API endpoints individually

**Built with ❤️ for Indian Badminton Community**
