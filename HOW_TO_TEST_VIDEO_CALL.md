# 🎥 HOW TO TEST VIDEO CALL FEATURE

## Quick Test Guide (5 Minutes)

---

## ✅ PREREQUISITES

Both servers are already running:
- ✅ Backend: http://localhost:5000
- ✅ Frontend: http://localhost:5173

---

## 🧪 TEST SCENARIO

You'll test the complete KYC video verification flow from both sides.

---

## 👤 PART 1: ORGANIZER SIDE (2 minutes)

### Step 1: Login as Organizer
1. Open browser: http://localhost:5173
2. Click "Login"
3. Enter credentials:
   ```
   Email: organizer@gmail.com
   Password: organizer123
   ```
4. Click "Login"

### Step 2: Navigate to KYC Submission
1. Look for "KYC Verification" or "Submit KYC" in the menu
2. Or go directly to: http://localhost:5173/organizer/kyc/submit

### Step 3: Upload Aadhaar
1. You'll see a drag & drop area
2. Upload ANY image file (JPG, PNG, or PDF)
   - Can be any photo from your computer
   - Max size: 5MB
3. You'll see a preview of the uploaded image
4. Click "Submit KYC"

### Step 4: Request Video Call
1. After submission, you'll be redirected to video call page
2. You'll see "Ready for Video Verification?" screen
3. Click "Request Video Call" button
4. Wait 2-3 seconds...
5. Daily.co video interface will load in an iframe
6. **Allow camera and microphone access when prompted**

### What You'll See:
- ✅ Video call interface (Daily.co)
- ✅ Your camera feed
- ✅ Waiting for admin to join
- ✅ Yellow banner: "Video call in progress with admin"

---

## 👨‍💼 PART 2: ADMIN SIDE (2 minutes)

### Step 1: Login as Admin (New Browser Window)
1. Open NEW browser window (or incognito mode)
2. Go to: http://localhost:5173
3. Click "Login"
4. Enter credentials:
   ```
   Email: ADMIN@gmail.com
   Password: ADMIN@123(123)
   ```
5. Click "Login"

### Step 2: Navigate to KYC Dashboard
1. Look for "Admin" menu
2. Click "KYC Management" or "KYC Dashboard"
3. Or go directly to: http://localhost:5173/admin/kyc

### Step 3: Toggle Availability
1. You'll see "Available for KYC Calls" toggle
2. Click the toggle to turn it ON (green)
3. This allows you to receive KYC requests

### Step 4: View Pending KYC
1. Scroll down to "Pending KYC Verifications"
2. You'll see the organizer's KYC submission
3. Details shown:
   - Organizer name
   - Email
   - Phone
   - Status: PENDING or IN_PROGRESS
   - Submission time

### Step 5: View Aadhaar Document
1. Click "View Aadhaar" button
2. Modal opens showing the uploaded image
3. Review the document

### Step 6: Approve or Reject
**Option A: Approve**
1. Click "Approve KYC" button
2. Confirm the action
3. KYC is approved ✅
4. Organizer can now create tournaments

**Option B: Reject**
1. Click "Reject KYC" button
2. Enter rejection reason (e.g., "Image is unclear")
3. Click "Reject KYC"
4. Organizer will see rejection and can resubmit

---

## 🎬 WHAT HAPPENS DURING VIDEO CALL

### Organizer Side:
- ✅ Sees Daily.co video interface
- ✅ Camera and microphone active
- ✅ Can see admin when they join
- ✅ Status updates every 3 seconds
- ✅ Automatically redirects when approved/rejected

### Admin Side:
- ✅ Can join the same Daily.co room
- ✅ Can see organizer's video
- ✅ Can verify identity
- ✅ Can approve/reject after verification

### System:
- ✅ Creates private Daily.co room
- ✅ Room expires in 30 minutes
- ✅ Max 2 participants (organizer + admin)
- ✅ Automatic cleanup after call

---

## 📊 EXPECTED RESULTS

### After Approval:
1. **Organizer sees:**
   - ✅ "KYC Approved! 🎉" screen
   - ✅ Green checkmark
   - ✅ "Create Your First Tournament" button
   - ✅ Can now create tournaments

2. **Admin sees:**
   - ✅ KYC moved from "Pending" to "Approved"
   - ✅ Stats updated (Approved count +1)
   - ✅ Organizer removed from pending list

### After Rejection:
1. **Organizer sees:**
   - ✅ "KYC Not Approved" screen
   - ✅ Red X icon
   - ✅ Rejection reason displayed
   - ✅ "Resubmit KYC" button
   - ✅ Can upload new Aadhaar and try again

2. **Admin sees:**
   - ✅ KYC moved from "Pending" to "Rejected"
   - ✅ Stats updated (Rejected count +1)
   - ✅ Organizer removed from pending list

---

## 🔍 VERIFICATION CHECKLIST

### ✅ Backend Working:
- [ ] Organizer can login
- [ ] Admin can login
- [ ] File upload to Cloudinary works
- [ ] KYC submission creates database record
- [ ] Daily.co room is created
- [ ] Admin can toggle availability
- [ ] Admin can see pending KYCs
- [ ] Approve/Reject updates database

### ✅ Frontend Working:
- [ ] File upload UI works
- [ ] Drag & drop works
- [ ] Image preview shows
- [ ] Video call page loads
- [ ] Daily.co iframe embeds correctly
- [ ] Admin dashboard shows stats
- [ ] Pending list displays correctly
- [ ] Modals open/close properly

### ✅ Integration Working:
- [ ] Organizer → Backend → Cloudinary
- [ ] Backend → Daily.co API
- [ ] Admin → Backend → Database
- [ ] Real-time status updates
- [ ] Approve/Reject flow complete
- [ ] KYC blocks tournament creation

---

## 🐛 TROUBLESHOOTING

### Issue: "No admin available"
**Solution:** Make sure admin has toggled availability to ON

### Issue: Video call not loading
**Solution:** 
1. Check Daily.co API key in `.env`
2. Check browser console for errors
3. Allow camera/microphone permissions

### Issue: File upload fails
**Solution:**
1. Check Cloudinary credentials in `.env`
2. Check file size (max 5MB)
3. Check file type (JPG, PNG, PDF only)

### Issue: Can't see pending KYC
**Solution:**
1. Refresh admin dashboard
2. Check if KYC was submitted successfully
3. Check browser console for errors

---

## 🎯 SUCCESS CRITERIA

You'll know it's working when:
1. ✅ Organizer can upload Aadhaar
2. ✅ Video call interface loads
3. ✅ Admin can see pending KYC
4. ✅ Admin can view Aadhaar image
5. ✅ Admin can approve/reject
6. ✅ Organizer sees approval/rejection
7. ✅ Approved organizer can create tournaments

---

## 📝 NOTES

- **Daily.co API Key:** Already configured
- **Test Duration:** 5 minutes total
- **Camera Required:** Yes (for video call)
- **Two Browsers:** Recommended (one for organizer, one for admin)
- **Internet Required:** Yes (for Daily.co video)

---

## 🚀 READY TO TEST?

1. ✅ Backend running on http://localhost:5000
2. ✅ Frontend running on http://localhost:5173
3. ✅ Daily.co API key configured
4. ✅ Cloudinary configured
5. ✅ Test accounts ready

**Let's go! Start with PART 1: ORGANIZER SIDE** 👆

---

**Need Help?** Check the console logs in both browser and terminal for any errors.
