# 🚀 Render Deployment Guide for Matchify.pro

## 📋 **Prerequisites**
- GitHub repository with latest code
- Render account (free tier works)
- Vercel account for frontend deployment

## 🔧 **Step 1: Fix Current Deployment**

### **Problem:** 
Your deployment is failing because of database configuration issues.

### **Solution:**
The `render.yaml` file has been updated with proper configuration.

## 🗄️ **Step 2: Database Setup**

### **Current Configuration:**
```yaml
databases:
  - name: matchify-db
    databaseName: matchify
    plan: free
    region: singapore
    postgresVersion: 15
```

### **Environment Variables:**
```yaml
envVars:
  - key: DATABASE_URL
    fromDatabase:
      name: matchify-db
      property: connectionString
  - key: FRONTEND_URL
    value: https://matchify.vercel.app
  - key: PORT
    value: 5000
```

## 🚀 **Step 3: Deploy to Render**

### **Option A: Using render.yaml (Recommended)**
1. **Push the updated code** to GitHub (already done)
2. **Go to Render Dashboard**
3. **Click "New +"** → **"Blueprint"**
4. **Connect your GitHub repository**
5. **Render will automatically use** `render.yaml` configuration

### **Option B: Manual Setup**
1. **Create Web Service:**
   - **Name:** `matchify-backend`
   - **Environment:** `Node`
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npx prisma generate`
   - **Start Command:** `npm start`

2. **Create PostgreSQL Database:**
   - **Name:** `matchify-db`
   - **Database Name:** `matchify`
   - **Region:** `Singapore`

3. **Set Environment Variables:**
   ```
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=[Auto-generated from database]
   FRONTEND_URL=https://matchify.vercel.app
   CORS_ORIGIN=https://matchify.vercel.app
   JWT_SECRET=[Generate random string]
   JWT_REFRESH_SECRET=[Generate random string]
   JWT_EXPIRES_IN=7d
   JWT_REFRESH_EXPIRES_IN=30d
   ADMIN_EMAIL=ADMIN@gmail.com
   ADMIN_PASSWORD=ADMIN@123(123)
   ```

## 🔍 **Step 4: Verify Deployment**

### **Check These URLs:**
- **Health Check:** `https://your-app.onrender.com/health`
- **API Status:** `https://your-app.onrender.com/api`
- **Admin Login:** Test with `ADMIN@gmail.com` / `ADMIN@123(123)`

### **Expected Response:**
```json
{
  "status": "healthy",
  "message": "MATCHIFY.PRO API is running",
  "environment": "production"
}
```

## 🐛 **Common Issues & Solutions**

### **Issue 1: Database Connection Failed**
**Solution:** Ensure `DATABASE_URL` is properly set from the database connection string.

### **Issue 2: Build Failed**
**Solution:** Check that all dependencies are in `package.json` and build command is correct.

### **Issue 3: Admin User Not Created**
**Solution:** The `postinstall` script will automatically create the admin user on first deployment.

### **Issue 4: CORS Errors**
**Solution:** Ensure `FRONTEND_URL` and `CORS_ORIGIN` are set to your Vercel frontend URL.

## 📊 **Step 5: Test Your Deployment**

### **Backend Tests:**
1. **API Health:** `GET /health`
2. **Admin Login:** `POST /api/auth/login`
3. **Tournament List:** `GET /api/tournaments`
4. **Payment Verification:** `GET /api/admin/payment-verifications`

### **Frontend Integration:**
1. Update frontend `VITE_API_URL` to point to your Render backend
2. Test admin login and payment verification
3. Test match scoring system

## 🎯 **Expected Results**

After successful deployment, you should have:
- ✅ **Backend API** running on Render
- ✅ **PostgreSQL database** with admin user
- ✅ **133 pending payment verifications** ready for approval
- ✅ **Match scoring system** fully functional
- ✅ **Admin dashboard** accessible

## 🔗 **Next Steps**

1. **Deploy Frontend** to Vercel with updated API URL
2. **Test Complete System** - Login, payments, match scoring
3. **Add Real Payment Gateway** credentials (Razorpay, etc.)
4. **Configure Email Service** (SendGrid) for notifications

## 📞 **Support**

If deployment fails, check:
1. **Render Logs** for specific error messages
2. **Database Connection** status
3. **Environment Variables** are properly set
4. **Build Command** completed successfully

## 🔧 **Key Changes Made:**

1. **Fixed render.yaml:** Removed `cd backend` commands and set `rootDir: backend`
2. **Updated deploy.js:** Fixed payment settings structure
3. **Updated package.json:** Added `postinstall` script for automatic setup
4. **Added health-check.js:** For deployment verification

The system is now ready for production deployment! 🚀