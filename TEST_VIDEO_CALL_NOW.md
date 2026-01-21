# 🎥 TEST VIDEO CALLS NOW!

## Quick Test Guide

### Step 1: Admin Setup (30 seconds)
```
1. Open browser: http://localhost:5173/admin/kyc
2. Login: ADMIN@gmail.com / ADMIN@123(123)
3. Toggle "Available for KYC Calls" to ON (green)
4. Keep this tab open
```

### Step 2: Organizer Request (1 minute)
```
1. Open NEW browser tab/window (or incognito)
2. Go to: http://localhost:5173
3. Logout if logged in
4. Login: organizer@gmail.com / organizer123
5. Go to: http://localhost:5173/organizer/kyc/submit
6. Upload any image (JPG/PNG)
7. Click "Request Video Call"
```

### Step 3: Video Call! (2-5 minutes)
```
Both users should now see:
- Daily.co video interface
- Your camera preview
- Microphone controls
- Each other's video!

Admin:
- Verify organizer's face matches Aadhaar
- Go back to dashboard tab
- Click "Approve"

Organizer:
- Wait for approval
- See "KYC Approved!" screen
- Click "Create Your First Tournament"
```

---

## 🎯 What You'll See

### Organizer Screen:
- Full-screen video call
- Yellow banner: "Video call in progress with admin"
- Daily.co controls (mute, camera, leave)
- Your video + admin's video

### Admin Screen:
- Same video room
- Can see organizer
- Can verify face matches Aadhaar
- Dashboard shows pending KYC

---

## 🔧 Troubleshooting

**Camera/Microphone Permission:**
- Browser will ask for permission
- Click "Allow"
- If denied, click lock icon in address bar → reset permissions

**No Video Showing:**
- Check camera is not used by another app
- Try different browser (Chrome recommended)
- Check browser console for errors

**"No admin available" Error:**
- Make sure admin toggled availability ON
- Check admin is logged in
- Refresh admin dashboard

**Room Not Loading:**
- Check backend console for Daily.co errors
- Verify API key in .env file
- Check internet connection

---

## 📊 Expected Behavior

**Room Creation:**
- Room name: `kyc-{id}-{timestamp}`
- Example: `kyc-abc123-1705612345678`
- Visible in Daily.co dashboard

**Room Deletion:**
- Happens automatically after approval
- Happens automatically after rejection
- Check Daily.co dashboard (should be deleted)

**Call Duration:**
- Typical: 2-5 minutes
- Maximum: 30 minutes (auto-expires)

---

## ✅ Success Indicators

**Video Call Working:**
- ✅ Both users see video interface
- ✅ Camera preview visible
- ✅ Can see each other
- ✅ Audio works
- ✅ Controls responsive

**Approval Working:**
- ✅ Admin clicks approve
- ✅ Organizer sees success screen
- ✅ Room deleted from Daily.co
- ✅ Can create tournaments

**System Working:**
- ✅ No errors in console
- ✅ Smooth video quality
- ✅ Quick room creation
- ✅ Automatic cleanup

---

## 🎉 You're Ready!

Your KYC system now has:
- ✅ Real video calls
- ✅ Face-to-face verification
- ✅ Automatic room management
- ✅ Complete approval workflow

**Test it now and see the magic! 🎥**

