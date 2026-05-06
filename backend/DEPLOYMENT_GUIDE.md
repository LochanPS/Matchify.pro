# 🚀 Matchify.pro Backend Deployment Guide

## ✅ Pre-Deployment Checklist

Before deploying the backend, ensure all environment variables are configured.

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | JWT token secret (min 32 chars) | `your-super-secret-jwt-key` |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | `your-refresh-secret-key` |
| `FRONTEND_URL` | Frontend application URL | `https://www.matchify.pro` |
| `CORS_ORIGIN` | Allowed CORS origins | `https://www.matchify.pro,https://matchify-pro.vercel.app` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `your-cloud-name` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `your-api-secret` |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `JWT_EXPIRES_IN` | JWT expiry time | `7d` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | `30d` |
| `RAZORPAY_KEY_ID` | Razorpay payment key | - |
| `RAZORPAY_KEY_SECRET` | Razorpay secret | - |
| `SENDGRID_API_KEY` | SendGrid email API key | - |

---

## 🔧 Vercel Deployment Steps

### 1. Configure Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your backend project: `matchify-probackend`
3. Navigate to **Settings** → **Environment Variables**
4. Add all required variables listed above
5. Select environments: **Production**, **Preview**, **Development**
6. Click **Save**

### 2. Deploy

#### Option A: Automatic Deployment (Recommended)
- Push code to GitHub main branch
- Vercel will automatically deploy

#### Option B: Manual Deployment
1. Go to **Deployments** tab
2. Click **Redeploy** on latest deployment
3. Wait 2-3 minutes for completion

### 3. Verify Deployment

After deployment, verify the backend is working:

```bash
# Check health endpoint
curl https://matchify-probackend.vercel.app/api/health

# Expected response:
{
  "status": "healthy",
  "message": "MATCHIFY.PRO API is running",
  "configuration": {
    "database": true,
    "jwt": true,
    "cors": true,
    "cloudinary": true
  }
}
```

---

## 🛡️ Environment Variable Validation

The backend now includes automatic environment variable validation:

### On Startup
- All required variables are checked
- Server will NOT start if critical variables are missing
- Clear error messages indicate what's missing

### Health Check Endpoint
```bash
GET /api/health
```

Returns detailed configuration status:
- ✅ All configured variables
- ❌ Missing required variables
- ⚠️ Missing optional variables

### Verification Script
Run before deploying:
```bash
npm run verify
```

This checks all environment variables locally before deployment.

---

## 🚨 Troubleshooting

### Issue: Login Returns 500 Error

**Cause:** Environment variables not configured or backend not redeployed after adding variables.

**Solution:**
1. Verify all required variables are set in Vercel
2. Redeploy the backend
3. Check `/api/health` endpoint for configuration status

### Issue: Database Connection Error

**Cause:** `DATABASE_URL` not configured or incorrect format.

**Solution:**
1. Verify `DATABASE_URL` is set in Vercel
2. Check format: `postgresql://user:pass@host:5432/dbname`
3. Test database connection from Vercel logs

### Issue: CORS Error

**Cause:** `CORS_ORIGIN` not configured or doesn't include frontend URL.

**Solution:**
1. Set `CORS_ORIGIN` to include all frontend URLs
2. Format: `https://www.matchify.pro,https://matchify-pro.vercel.app`
3. No spaces between URLs

### Issue: JWT Token Error

**Cause:** `JWT_SECRET` or `JWT_REFRESH_SECRET` not configured.

**Solution:**
1. Generate secure secrets (min 32 characters)
2. Add both secrets to Vercel environment variables
3. Redeploy backend

---

## 📊 Monitoring

### Health Check
Monitor backend health:
```bash
curl https://matchify-probackend.vercel.app/api/health
```

### Logs
View deployment logs in Vercel:
1. Go to **Deployments** tab
2. Click on deployment
3. Click **View Function Logs**

### Error Tracking
The backend now provides detailed error messages:
- Database errors: `DATABASE_CONNECTION_ERROR`
- JWT errors: `JWT_NOT_CONFIGURED`
- Configuration errors: `DATABASE_NOT_CONFIGURED`

---

## 🔄 Redeployment Process

### When to Redeploy

Redeploy the backend when:
- ✅ Environment variables are added/changed
- ✅ Code is updated in GitHub
- ✅ Database schema changes
- ✅ Dependencies are updated

### How to Redeploy

1. **Automatic:** Push to GitHub main branch
2. **Manual:** Vercel Dashboard → Deployments → Redeploy

### After Redeployment

1. Wait 2-3 minutes for deployment to complete
2. Check `/api/health` endpoint
3. Test login functionality
4. Verify all features work

---

## ✅ Deployment Verification Checklist

After every deployment, verify:

- [ ] Health endpoint returns 200 OK
- [ ] All required environment variables are configured
- [ ] Database connection is working
- [ ] Login functionality works
- [ ] JWT tokens are generated correctly
- [ ] CORS is configured properly
- [ ] Image uploads work (Cloudinary)
- [ ] Payment gateway works (if configured)
- [ ] Email service works (if configured)

---

## 🆘 Support

If you encounter issues:

1. Check `/api/health` endpoint for configuration status
2. Review Vercel function logs
3. Verify all environment variables are set
4. Ensure backend is redeployed after variable changes
5. Check database connectivity

---

## 📝 Notes

- Environment variables are NOT committed to Git (security)
- Variables must be set in Vercel Dashboard
- Backend must be redeployed after adding/changing variables
- Use strong secrets for JWT (min 32 characters)
- Keep sensitive variables secure (never share publicly)

---

**Last Updated:** May 6, 2026  
**Version:** 1.0.0  
**Deployment Platform:** Vercel
