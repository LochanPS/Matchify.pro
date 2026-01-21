# Complete Deployment Guide for Matchify.pro

## ✅ Pre-Deployment Checklist

All files are ready and configured:
- ✅ render.yaml - Complete with database and all environment variables
- ✅ deploy.js - Auto-creates admin user and payment settings
- ✅ health-check.js - Verifies deployment success
- ✅ firebase.js - Crash-proof configuration
- ✅ paymentTrackingService.js - Correct 30% + 65% + 5% formula
- ✅ package.json - Postinstall script configured
- ✅ Frontend .env.production - Correct API URL

## 🚀 Step-by-Step Deployment

### Step 1: Deploy to Render (Backend + Database)

1. **Login to Render Dashboard**
   - Go to: https://dashboard.render.com
   - Use your backup Render account

2. **Create New Blueprint**
   - Click "New +" button
   - Select "Blueprint"
   - Connect to GitHub repository: `LochanPS/Matchify.pro`
   - Render will automatically detect `render.yaml`

3. **Review Configuration**
   - Service name: `matchify-backend`
   - Database name: `matchify-db`
   - Region: Singapore
   - Plan: Free tier
   - All environment variables will be auto-configured

4. **Click "Apply"**
   - Render will create both the web service and database
   - Build process will take 5-10 minutes

5. **Monitor Build Logs**
   Watch for these success messages:
   ```
   ✅ npm install completed
   ✅ prisma generate completed
   ✅ prisma db push completed
   ✅ Admin user created
   ✅ Payment settings created
   ✅ Deploy succeeded
   ```

6. **Get Your Backend URL**
   - After deployment, you'll get a URL like:
   - `https://matchify-backend.onrender.com`
   - **SAVE THIS URL** - you'll need it for frontend

### Step 2: Verify Backend Deployment

Test these endpoints using a browser or Postman:

1. **Health Check**
   ```
   GET https://matchify-backend.onrender.com/health
   ```
   Expected response:
   ```json
   {
     "status": "ok",
     "message": "Server is running"
   }
   ```

2. **API Health**
   ```
   GET https://matchify-backend.onrender.com/api/health
   ```
   Expected response:
   ```json
   {
     "status": "healthy",
     "message": "MATCHIFY.PRO API is running"
   }
   ```

3. **Admin Login**
   ```
   POST https://matchify-backend.onrender.com/api/auth/login
   Content-Type: application/json

   {
     "email": "ADMIN@gmail.com",
     "password": "ADMIN@123(123)"
   }
   ```
   Expected: JWT token in response

### Step 3: Update Frontend Configuration

1. **Update .env.production**
   ```bash
   cd MATCHIFY.PRO/matchify/frontend
   ```
   
   Edit `.env.production`:
   ```
   VITE_API_URL=https://matchify-backend.onrender.com
   ```
   (Replace with your actual Render URL)

2. **Commit and Push**
   ```bash
   git add .env.production
   git commit -m "Update production API URL"
   git push origin main
   ```

### Step 4: Deploy Frontend to Vercel

1. **Login to Vercel**
   - Go to: https://vercel.com/dashboard
   - Login with your account

2. **Import Project**
   - Click "Add New..." → "Project"
   - Import from GitHub: `LochanPS/Matchify.pro`

3. **Configure Project**
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Environment Variables**
   Add this variable:
   ```
   VITE_API_URL=https://matchify-backend.onrender.com
   ```
   (Use your actual Render URL)

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build
   - You'll get a URL like: `https://matchify.vercel.app`

### Step 5: Update Backend CORS

After getting your Vercel URL, update Render environment variables:

1. Go to Render Dashboard → matchify-backend → Environment
2. Update these variables:
   ```
   FRONTEND_URL=https://matchify.vercel.app
   CORS_ORIGIN=https://matchify.vercel.app
   ```
   (Use your actual Vercel URL)
3. Save changes (service will auto-redeploy)

### Step 6: Final Testing

1. **Open Frontend**
   - Go to your Vercel URL
   - Should load without errors

2. **Test Admin Login**
   - Email: `ADMIN@gmail.com`
   - Password: `ADMIN@123(123)`
   - Should login successfully

3. **Check Admin Dashboard**
   - Navigate to Admin section
   - Verify all pages load

4. **Test Payment Verification**
   - Go to Payment Verification page
   - Should see 133 pending payments (if test data exists)

5. **Verify Revenue Dashboard**
   - Check payment calculations
   - Should show: 5% platform, 30% first, 65% second

## 🎯 Success Criteria

Your deployment is successful when:

✅ Backend health endpoint returns 200 OK
✅ Admin can login with ADMIN@gmail.com
✅ Frontend connects to backend (no CORS errors)
✅ Admin dashboard loads all pages
✅ Payment verification page works
✅ Revenue calculations are correct (30% + 65% + 5%)
✅ No Firebase crashes
✅ Database has admin user and payment settings

## 🔧 Troubleshooting

### Issue: Build fails on Render

**Solution:**
- Check build logs for specific error
- Verify `render.yaml` is in root directory
- Ensure `rootDir: backend` is set correctly

### Issue: Database connection fails

**Solution:**
- Verify DATABASE_URL is set from database
- Check database is in same region (Singapore)
- Wait 1-2 minutes for database to be ready

### Issue: Admin user not created

**Solution:**
- Check deploy.js ran successfully in logs
- Manually run: `node backend/deploy.js`
- Verify ADMIN_EMAIL and ADMIN_PASSWORD env vars

### Issue: Frontend can't connect to backend

**Solution:**
- Verify VITE_API_URL in frontend .env.production
- Check CORS_ORIGIN in backend matches frontend URL
- Clear browser cache and hard refresh

### Issue: Payment calculations wrong

**Solution:**
- Check paymentTrackingService.js has correct formula
- Verify: platformFee = 5%, first = 30%, second = 65%
- Run health-check.js to verify math

## 📊 Post-Deployment Monitoring

### Check Logs

**Render:**
- Dashboard → matchify-backend → Logs
- Watch for errors or warnings

**Vercel:**
- Dashboard → matchify → Deployments → View Function Logs

### Monitor Performance

- Backend response times
- Database query performance
- Frontend load times
- Error rates

### Regular Maintenance

- Check logs daily for first week
- Monitor database size
- Review error reports
- Update dependencies monthly

## 🎉 Deployment Complete!

Your Matchify.pro platform is now live and ready for users!

**Important URLs:**
- Backend: https://matchify-backend.onrender.com
- Frontend: https://matchify.vercel.app
- Admin Login: ADMIN@gmail.com / ADMIN@123(123)

**Next Steps:**
1. Test all features thoroughly
2. Create real organizer accounts
3. Set up monitoring and alerts
4. Configure custom domain (optional)
5. Enable SSL/HTTPS (automatic on Render/Vercel)

Good luck! 🚀
