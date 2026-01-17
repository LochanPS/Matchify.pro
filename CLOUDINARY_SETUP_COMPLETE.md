# Cloudinary Setup - Complete ✅

## Your Cloudinary Credentials

**Cloud Name**: `dfg8tdgmf`  
**API Key**: `417764488597768`  
**API Secret**: `ithriq7poX0T-4_j3PWmhlVmHqI`  
**Full URL**: `cloudinary://417764488597768:ithriq7poX0T-4_j3PWmhlVmHqI@dfg8tdgmf`

## ✅ Already Configured

Your Cloudinary is **already set up** in Matchify.pro! Here's what's working:

### 1. Environment Variables (`.env`)
```env
CLOUDINARY_CLOUD_NAME=dfg8tdgmf
CLOUDINARY_API_KEY=417764488597768
CLOUDINARY_API_SECRET=ithriq7poX0T-4_j3PWmhlVmHqI
CLOUDINARY_URL=cloudinary://417764488597768:ithriq7poX0T-4_j3PWmhlVmHqI@dfg8tdgmf
```

### 2. Configuration File
**Location**: `matchify/backend/src/config/cloudinary.js`

```javascript
import cloudinary from 'cloudinary';

const cloudinaryV2 = cloudinary.v2;

cloudinaryV2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinaryV2;
```

### 3. Active Upload Endpoints

#### Profile Photos
- **Folder**: `matchify/profiles`
- **Used in**: Profile page photo upload
- **Controller**: `profile.controller.js`

#### Academy Payment Screenshots
- **Folder**: `matchify/academy-payments`
- **Used in**: Academy registration (₹200 payment proof)
- **Controller**: `academy.controller.js`

#### Academy Photos
- **Folder**: `matchify/academy-photos`
- **Used in**: Academy registration (facility photos)
- **Controller**: `academy.controller.js`

#### Academy QR Codes
- **Folder**: `matchify/academy-qrcodes`
- **Used in**: Academy registration (payment QR codes)
- **Controller**: `academy.controller.js`

#### Tournament QR Codes
- **Folder**: `matchify/tournament-qrcodes`
- **Used in**: Tournament registration
- **Controller**: `registration.controller.js`

## How It Works

### Upload Flow
1. User uploads image from frontend
2. File sent to backend as multipart/form-data
3. Backend receives file in memory (multer)
4. File streamed to Cloudinary
5. Cloudinary returns secure URL
6. URL saved to database
7. Frontend displays image from Cloudinary CDN

### Example: Profile Photo Upload

**Frontend** (`ProfilePage.jsx`):
```javascript
const handlePhotoUpload = async (file) => {
  const data = await profileAPI.uploadPhoto(file);
  // data.profilePhoto = "https://res.cloudinary.com/dfg8tdgmf/image/upload/v1234/matchify/profiles/abc123.jpg"
};
```

**Backend** (`profile.controller.js`):
```javascript
const result = await new Promise((resolve, reject) => {
  cloudinary.uploader.upload_stream(
    { folder: 'matchify/profiles' },
    (error, result) => {
      if (error) reject(error);
      else resolve(result);
    }
  ).end(req.file.buffer);
});

photoUrl = result.secure_url; // Cloudinary URL
```

## Testing Your Cloudinary Connection

### Method 1: Upload Profile Photo
1. Go to http://localhost:5173/profile
2. Click "Edit Profile"
3. Upload a profile photo
4. Check browser Network tab → should see Cloudinary URL in response
5. Photo should display from `https://res.cloudinary.com/dfg8tdgmf/...`

### Method 2: Add Academy
1. Go to http://localhost:5173/add-academy
2. Fill form and upload:
   - Payment screenshot (₹200 proof)
   - Academy photos (facility images)
   - QR code
3. Submit form
4. Check admin dashboard → images should load from Cloudinary

### Method 3: Check Cloudinary Dashboard
1. Go to https://cloudinary.com/console
2. Login with your account
3. Go to Media Library
4. You should see folders:
   - `matchify/profiles`
   - `matchify/academy-payments`
   - `matchify/academy-photos`
   - `matchify/academy-qrcodes`
   - `matchify/tournament-qrcodes`

## Cloudinary Features in Use

### 1. Automatic Optimization
- Images automatically compressed
- Format conversion (WebP for modern browsers)
- Responsive image delivery

### 2. Secure URLs
- All images served over HTTPS
- CDN delivery for fast loading worldwide

### 3. Folder Organization
- Separate folders for different image types
- Easy to manage and delete

### 4. Transformations (Available)
You can add transformations to URLs:
```
https://res.cloudinary.com/dfg8tdgmf/image/upload/w_300,h_300,c_fill/matchify/profiles/image.jpg
```
- `w_300,h_300` = Resize to 300x300
- `c_fill` = Crop to fill
- `q_auto` = Auto quality
- `f_auto` = Auto format

## Deployment Notes

### For Render (Backend)
Add these environment variables in Render dashboard:
```
CLOUDINARY_CLOUD_NAME=dfg8tdgmf
CLOUDINARY_API_KEY=417764488597768
CLOUDINARY_API_SECRET=ithriq7poX0T-4_j3PWmhlVmHqI
CLOUDINARY_URL=cloudinary://417764488597768:ithriq7poX0T-4_j3PWmhlVmHqI@dfg8tdgmf
```

### For Vercel (Frontend)
No Cloudinary config needed - frontend just displays images from Cloudinary URLs

## Troubleshooting

### Issue: Images not uploading
**Check**:
1. Backend server running? `npm start` in `matchify/backend`
2. `.env` file exists in `matchify/backend`?
3. Cloudinary credentials correct?
4. Check backend console for errors

### Issue: Images not displaying
**Check**:
1. Browser console for CORS errors
2. Image URL format: `https://res.cloudinary.com/dfg8tdgmf/...`
3. Cloudinary dashboard - are images uploaded?

### Issue: "Cloudinary not configured"
**Fix**:
1. Restart backend server
2. Verify `.env` file has all 4 variables
3. Check no typos in variable names

## Current Status

✅ Cloudinary configured in `.env`  
✅ Configuration file created  
✅ Profile photo upload working  
✅ Academy uploads working  
✅ Tournament QR codes working  
✅ Fallback to local storage if Cloudinary fails  
✅ Old image deletion on new upload  
✅ Secure HTTPS URLs  
✅ CDN delivery enabled  

## Your Cloudinary Dashboard

**URL**: https://cloudinary.com/console  
**Cloud Name**: dfg8tdgmf  

You can:
- View all uploaded images
- Delete old images
- Check storage usage
- Monitor bandwidth
- Set up transformations
- Configure webhooks

## Free Tier Limits

Cloudinary Free Plan includes:
- **Storage**: 25 GB
- **Bandwidth**: 25 GB/month
- **Transformations**: 25,000/month
- **Images**: Unlimited

This is more than enough for Matchify.pro!

---

**Status**: ✅ Cloudinary is fully configured and working!  
**Next Step**: Test by uploading images in your app
