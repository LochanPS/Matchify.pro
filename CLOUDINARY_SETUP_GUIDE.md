# Cloudinary Setup Guide for Matchify.pro

## Why Cloudinary?

Render uses **ephemeral storage** - any files uploaded to the server are **deleted when the server restarts** (which happens during every deployment). This means:
- ❌ Payment screenshots disappear after deployment
- ❌ Tournament posters are lost
- ❌ Profile photos vanish
- ❌ Refund QR codes are deleted

**Solution**: Use Cloudinary to store all images permanently in the cloud.

## Step 1: Create Cloudinary Account

1. Go to https://cloudinary.com/users/register_free
2. Sign up for a **FREE account** (no credit card required)
3. Free tier includes:
   - 25 GB storage
   - 25 GB bandwidth/month
   - 25,000 transformations/month
   - More than enough for Matchify.pro!

## Step 2: Get Your Credentials

1. After signup, you'll be on the **Dashboard**
2. You'll see a section called **"Account Details"** or **"Product Environment Credentials"**
3. Copy these three values:
   - **Cloud Name**: (e.g., `dxxxxx` or `your-cloud-name`)
   - **API Key**: (e.g., `123456789012345`)
   - **API Secret**: (e.g., `abcdefghijklmnopqrstuvwxyz`)

## Step 3: Add to Render Environment Variables

1. Go to https://dashboard.render.com
2. Click on your **matchify-pro** backend service
3. Click **"Environment"** tab in the left sidebar
4. Click **"Add Environment Variable"** button
5. Add these three variables:

```
Key: CLOUDINARY_CLOUD_NAME
Value: [paste your Cloud Name]

Key: CLOUDINARY_API_KEY
Value: [paste your API Key]

Key: CLOUDINARY_API_SECRET
Value: [paste your API Secret]
```

6. Click **"Save Changes"**
7. Render will automatically redeploy your service

## Step 4: Verify It's Working

After Render redeploys (takes 2-3 minutes):

1. Go to your Matchify.pro website
2. Try uploading a payment screenshot when registering
3. Go to Cloudinary Dashboard → Media Library
4. You should see the uploaded image in the `matchify/payment-screenshots/` folder

## What Gets Uploaded to Cloudinary?

All images are now stored in Cloudinary:

### 1. Payment Screenshots
- **Folder**: `matchify/payment-screenshots/{tournamentId}/`
- **When**: Player registers with payment proof
- **Size**: Max 1200x1600px, optimized quality

### 2. Tournament Posters
- **Folder**: `matchify/tournaments/{tournamentId}/`
- **When**: Organizer creates tournament
- **Size**: Max 1200x1600px, optimized quality

### 3. Payment QR Codes
- **Folder**: `matchify/tournaments/{tournamentId}/payment/`
- **When**: Organizer uploads payment QR
- **Size**: Max 500x500px, optimized quality

### 4. Refund QR Codes
- **Folder**: `matchify/refund-qr/{tournamentId}/`
- **When**: Player requests refund
- **Size**: Max 500x500px, optimized quality

### 5. Profile Photos
- **Folder**: `matchify/profiles/`
- **When**: User updates profile
- **Size**: Max 500x500px, optimized quality

## Folder Structure in Cloudinary

```
matchify/
├── payment-screenshots/
│   ├── {tournament-id-1}/
│   │   ├── payment-123456.jpg
│   │   └── payment-789012.jpg
│   └── {tournament-id-2}/
│       └── payment-345678.jpg
├── tournaments/
│   ├── {tournament-id-1}/
│   │   ├── poster-1.jpg
│   │   └── poster-2.jpg
│   └── {tournament-id-2}/
│       └── payment/
│           └── qr-code.png
├── refund-qr/
│   └── {tournament-id-1}/
│       └── refund-qr-123456.png
└── profiles/
    ├── user-1-profile.jpg
    └── user-2-profile.jpg
```

## Benefits

✅ **Permanent Storage**: Images never disappear
✅ **Fast CDN**: Images load quickly worldwide
✅ **Automatic Optimization**: Images are compressed automatically
✅ **Transformations**: Resize, crop, optimize on-the-fly
✅ **Free Tier**: More than enough for your needs
✅ **Backup**: Cloudinary keeps backups of your images

## Troubleshooting

### Images still not showing?

1. **Check Render logs** for Cloudinary errors:
   ```
   ❌ Cloudinary not configured
   ❌ Cloudinary upload failed
   ```

2. **Verify environment variables** in Render:
   - Go to Environment tab
   - Make sure all 3 variables are set
   - No typos in variable names
   - Values don't have extra spaces

3. **Check Cloudinary Dashboard**:
   - Go to Media Library
   - Look for `matchify` folder
   - If images are there, Cloudinary is working

4. **Frontend image URL**:
   - Images should start with `https://res.cloudinary.com/`
   - Not `/uploads/...` (local path)

### Still having issues?

Check the Render logs after uploading an image. You'll see:
```
✅ Screenshot uploaded to Cloudinary: https://res.cloudinary.com/...
```

Or if there's an error:
```
❌ Cloudinary upload failed: [error message]
```

## Cost

**Free Tier Limits**:
- 25 GB storage
- 25 GB bandwidth/month
- 25,000 transformations/month

**Estimated Usage for Matchify.pro**:
- 100 tournaments/month × 5 images each = 500 images
- Average 500 KB per image = 250 MB/month
- Well within free tier limits!

## Security

- API Secret is kept secure in Render environment variables
- Never commit credentials to GitHub
- Images are served over HTTPS
- Access control via Cloudinary settings

## Next Steps

After setup:
1. Test by uploading a payment screenshot
2. Check Cloudinary Media Library
3. Verify images load on the website
4. All future uploads will work automatically!

---

**Need Help?**
- Cloudinary Docs: https://cloudinary.com/documentation
- Render Docs: https://render.com/docs/environment-variables
