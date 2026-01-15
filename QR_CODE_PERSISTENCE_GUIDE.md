# QR Code Persistence Guide

## How QR Code Storage Works

### During Tournament Creation (Draft Mode)
When you're creating a tournament and haven't published it yet:
- ✅ QR code is stored **temporarily** in browser localStorage as a preview
- ❌ QR code is **NOT uploaded to server** until you publish
- ⚠️ If you close the browser, the QR preview will be lost (blob URLs expire)
- 💡 You need to **re-upload the QR** if you resume the draft

### After Tournament is Published
Once you click "Publish Tournament":
- ✅ QR code is **uploaded to Cloudinary** (or local storage)
- ✅ QR URL is **saved in database** (paymentQRUrl field)
- ✅ QR code **persists forever** and can be viewed anytime
- ✅ You can see it in **Edit Tournament** page

## How to View Your Saved QR Code

### Option 1: Edit Tournament Page
1. Go to **Organizer Dashboard**
2. Find your tournament
3. Click **"Edit"** button
4. Scroll to **"Payment QR Code"** section
5. Your QR will be displayed there

### Option 2: Tournament Detail Page (for players)
1. Go to the tournament page
2. Click **"Register"** button
3. Players will see your QR code in the payment section

## Common Scenarios

### Scenario 1: "I uploaded QR but it's gone when I come back"
**Cause**: You're in draft mode and haven't published the tournament yet.

**Solution**: 
1. Complete all steps in tournament creation
2. Click **"Publish Tournament"** button
3. QR will be uploaded to server and saved permanently

### Scenario 2: "I published the tournament but don't see the QR"
**Cause**: You might be going to "Create New Tournament" instead of "Edit Tournament"

**Solution**:
1. Don't click "Create Tournament" again
2. Go to **Organizer Dashboard**
3. Find your existing tournament
4. Click **"Edit"** to see the saved QR

### Scenario 3: "I want to change the QR code"
**Solution**:
1. Go to **Organizer Dashboard**
2. Click **"Edit"** on your tournament
3. Scroll to **"Payment QR Code"** section
4. Click **"Change QR Code"** button
5. Upload new QR
6. Click **"Save Payment Info"**

## Technical Details

### Where QR is Stored
- **Production (Render)**: Cloudinary CDN
- **Local Development**: `/uploads/payment-qr/{tournamentId}/` folder

### Database Fields
```javascript
Tournament {
  paymentQRUrl: String        // Full URL to QR image
  paymentQRPublicId: String   // Cloudinary public ID
  upiId: String               // UPI ID for text payments
  accountHolderName: String   // Account holder name
}
```

### API Endpoints
- **Upload QR**: `POST /api/tournaments/:id/payment-qr`
- **Update Payment Info**: `PUT /api/tournaments/:id/payment-info`
- **Get Tournament**: `GET /api/tournaments/:id` (includes QR URL)

## Debugging

If you're not seeing your QR code:

1. **Open Browser Console** (F12)
2. Look for this log when you open Edit Tournament:
   ```
   📋 Fetched tournament data: {
     id: "...",
     name: "...",
     hasQR: true/false,
     qrUrl: "...",
     upiId: "...",
     accountHolder: "..."
   }
   ```
3. Check if `hasQR` is `true` and `qrUrl` has a value
4. If `hasQR` is `false`, the QR was never uploaded - you need to upload it again

## Best Practice

1. **Complete tournament creation in one session** if possible
2. **Publish immediately** after adding all details
3. **Use "Edit Tournament"** to view/modify existing tournaments
4. **Don't use "Create Tournament"** to view existing tournaments
5. **Save payment details** for future tournaments (checkbox in payment step)

## Summary

- ✅ **Published tournaments**: QR is saved permanently in database
- ❌ **Draft tournaments**: QR preview is temporary (browser only)
- 🔄 **To view saved QR**: Use "Edit Tournament" page
- 📝 **To change QR**: Edit tournament → Upload new QR → Save
