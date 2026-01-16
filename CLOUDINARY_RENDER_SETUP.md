# 🚀 Cloudinary Setup for Render - Step by Step

## ✅ Step 1: Add Environment Variables to Render

1. **Go to Render Dashboard**
   - Open: https://dashboard.render.com
   - Click on your **matchify-pro** backend service

2. **Open Environment Tab**
   - Click **"Environment"** in the left sidebar
   - You'll see a list of existing environment variables

3. **Add Cloudinary Variables**
   - Click **"Add Environment Variable"** button (top right)
   - Add these **4 variables** one by one:

### Variable 1: CLOUDINARY_CLOUD_NAME
```
Key: CLOUDINARY_CLOUD_NAME
Value: dfg8tdgmf
```

### Variable 2: CLOUDINARY_API_KEY
```
Key: CLOUDINARY_API_KEY
Value: 417764488597768
```

### Variable 3: CLOUDINARY_API_SECRET
```
Key: CLOUDINARY_API_SECRET
Value: ithriq7poX0T-4_j3PWmhlVmHqI
```

### Variable 4: CLOUDINARY_URL (Optional but recommended)
```
Key: CLOUDINARY_URL
Value: cloudinary://417764488597768:ithriq7poX0T-4_j3PWmhlVmHqI@dfg8tdgmf
```

4. **Save Changes**
   - Click **"Save Changes"** button at the bottom
   - Render will automatically redeploy your service
   - Wait 2-3 minutes for deployment to complete

---

## ✅ Step 2: Verify Deployment

1. **Check Render Logs**
   - Go to **"Logs"** tab in Render
   - Look for: `🚀 Ready to serve badminton tournaments!`
   - Should NOT see: `❌ Cloudinary not configured`

2. **Check Server Startup**
   - Logs should show:
   ```
   ✅ Socket.IO initialized
   🚀 Ready to serve badminton tournaments!
   ```

---

## ✅ Step 3: Test Image Upload

### Test 1: Payment Screenshot Upload

1. Go to your Matchify.pro website
2. Register for a tournament
3. Upload a payment screenshot
4. Click Submit

**Expected Result:**
- Registration should succeed
- No errors about "image upload service not configured"

### Test 2: Check Cloudinary Dashboard

1. Go to https://cloudinary.com/console
2. Login to your account
3. Click **"Media Library"** in the left sidebar
4. Look for folder: `matchify/payment-screenshots/`
5. You should see the uploaded image!

### Test 3: View Image in App

1. As organizer, go to Tournament Management
2. Click on a registration with payment screenshot
3. Click to view the screenshot
4. Image should load from Cloudinary URL:
   ```
   https://res.cloudinary.com/dfg8tdgmf/image/upload/...
   ```

---

## ✅ Step 4: Verify All Image Types Work

Test these uploads:

### 1. Tournament Posters ✅
- Create tournament
- Upload poster images
- Should appear in: `matchify/tournaments/{id}/`

### 2. Payment QR Codes ✅
- Create tournament
- Upload payment QR code
- Should appear in: `matchify/tournaments/{id}/payment/`

### 3. Payment Screenshots ✅
- Register for tournament
- Upload payment proof
- Should appear in: `matchify/payment-screenshots/{id}/`

### 4. Refund QR Codes ✅
- Request cancellation
- Upload refund QR (optional)
- Should appear in: `matchify/refund-qr/{id}/`

### 5. Profile Photos ✅
- Update user profile
- Upload profile photo
- Should appear in: `matchify/profiles/`

---

## 🔍 Troubleshooting

### Issue 1: "Image upload service not configured"

**Cause**: Environment variables not set correctly in Render

**Fix**:
1. Go to Render → Environment tab
2. Verify all 3 variables are present:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
3. Check for typos in variable names
4. Make sure values don't have extra spaces
5. Click "Save Changes" and wait for redeploy

### Issue 2: Images not showing in app

**Cause**: Old images were stored locally, new images use Cloudinary

**Fix**:
1. Old images (before Cloudinary setup) won't work
2. Upload new images - they will work
3. Ask users to re-upload payment screenshots if needed

### Issue 3: "Failed to upload payment screenshot"

**Check Render Logs**:
```
❌ Cloudinary upload failed: [error message]
```

**Common causes**:
- Wrong API credentials
- Network issue
- File too large (max 5MB)

**Fix**:
1. Verify credentials in Render Environment tab
2. Check file size (must be < 5MB)
3. Try again

### Issue 4: Can't see images in Cloudinary Dashboard

**Cause**: Images uploaded before Cloudinary was configured

**Fix**:
1. Only NEW uploads will appear in Cloudinary
2. Test by uploading a new image
3. Check Media Library → `matchify` folder

---

## 📊 Monitor Usage

### Check Cloudinary Usage

1. Go to https://cloudinary.com/console
2. Click **"Dashboard"**
3. See usage stats:
   - **Storage**: How much space used
   - **Bandwidth**: How much data transferred
   - **Transformations**: How many images processed

### Free Tier Limits

- ✅ 25 GB storage
- ✅ 25 GB bandwidth/month
- ✅ 25,000 transformations/month

**Your estimated usage:**
- 100 tournaments/month × 10 images = 1,000 images
- Average 500 KB per image = 500 MB/month
- **Well within free tier!** 🎉

---

## 🎯 What Happens Now?

### ✅ All New Uploads Go to Cloudinary

- Payment screenshots → Cloudinary
- Tournament posters → Cloudinary
- Payment QR codes → Cloudinary
- Refund QR codes → Cloudinary
- Profile photos → Cloudinary

### ✅ Images Are Permanent

- Never deleted on deployment
- Always accessible
- Fast loading via CDN
- Automatic optimization

### ✅ Old Local Images

- Old images stored locally are gone (Render deleted them)
- Users need to re-upload if needed
- All future uploads will work perfectly

---

## 🔐 Security Notes

- ✅ API Secret is secure in Render environment variables
- ✅ Never committed to GitHub
- ✅ Only backend can upload images
- ✅ Images served over HTTPS
- ✅ Cloudinary handles security

---

## ✨ Success Checklist

- [ ] Added 3 environment variables to Render
- [ ] Render redeployed successfully
- [ ] No errors in Render logs
- [ ] Uploaded test payment screenshot
- [ ] Image appears in Cloudinary Media Library
- [ ] Image loads in Matchify.pro app
- [ ] Image URL starts with `https://res.cloudinary.com/`

---

## 🎉 You're Done!

Your Matchify.pro app now uses Cloudinary for all image storage. Images will never disappear again!

**Next Steps:**
1. Test all image upload features
2. Monitor Cloudinary usage dashboard
3. Enjoy permanent image storage! 🚀

---

**Need Help?**
- Cloudinary Docs: https://cloudinary.com/documentation
- Render Docs: https://render.com/docs/environment-variables
- Check Render logs for detailed error messages
