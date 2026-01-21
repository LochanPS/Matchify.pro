# ADMIN DASHBOARD - COMPLETE TESTING CHECKLIST

## TEST ENVIRONMENT
- Backend: http://localhost:5000
- Frontend: http://localhost:5173
- Admin Email: ADMIN@gmail.com
- Admin Password: ADMIN@123(123)

---

## 1. LOGIN TEST ✓
**Steps:**
1. Go to http://localhost:5173/login
2. Enter: ADMIN@gmail.com
3. Enter: ADMIN@123(123)
4. Click Login

**Expected Result:**
- Should redirect to `/admin-dashboard` or `/admin/dashboard`
- Should see admin dashboard with stats
- No 404 errors in console

---

## 2. ADMIN DASHBOARD - STATS CARDS ✓
**What to Check:**
- [ ] Total Users count displays correctly
- [ ] Live Tournaments count displays correctly
- [ ] Completed Tournaments count displays correctly
- [ ] Total Revenue displays correctly (₹ format)

---

## 3. TOP NAVIGATION TABS ✓
**Tabs to Test:**
- [ ] Dashboard - stays on current page
- [ ] Users - navigates to `/admin/users`
- [ ] Tournaments - stays on current page (future feature)
- [ ] Academies - navigates to `/admin/academies`
- [ ] Revenue - navigates to `/admin/revenue`

---

## 4. ACTION BUTTONS WITH HALO EFFECTS ✓

### Button 1: QR SETTINGS
**Click:** QR Settings button
**Expected:**
- Navigates to `/admin/qr-settings`
- Shows current QR code image (if uploaded)
- Shows UPI ID: 9742628582@sbi
- Shows Account Holder: P S Lochan
- Has "Upload New QR Code" button
- Can upload new QR image
- Halo glow effect on hover

### Button 2: REVENUE
**Click:** Revenue button
**Expected:**
- Navigates to `/admin/revenue`
- Shows revenue analytics dashboard
- Shows platform earnings (5% of all registrations)
- Shows organizer payouts (95% split 50/50)
- Halo glow effect on hover

### Button 3: MANAGE USERS
**Click:** Manage Users button
**Expected:**
- Navigates to `/admin/users`
- Shows list of all users
- Can search users
- Can block/unblock users
- Can view user details
- Can impersonate users (Login as User)
- Halo glow effect on hover

### Button 4: VIEW TOURNAMENTS
**Click:** View Tournaments button
**Expected:**
- Navigates to `/tournaments`
- Shows all tournaments (public page)
- Can see ongoing, upcoming, completed tournaments
- Halo glow effect on hover

### Button 5: PAYMENTS
**Click:** Payments button
**Expected:**
- Navigates to `/admin/payment-verifications`
- Shows pending payment verifications
- Shows payment screenshots uploaded by players
- Can approve/reject payments
- Shows player name, tournament, amount
- Halo glow effect on hover

### Button 6: ACADEMIES
**Click:** Academies button
**Expected:**
- Navigates to `/admin/academies`
- Shows pending academy approvals
- Can approve/reject academy submissions
- Shows academy details
- Halo glow effect on hover

---

## 5. QR SETTINGS PAGE - DETAILED TEST

**Navigate to:** `/admin/qr-settings`

**Current QR Display:**
- [ ] Shows current QR code image
- [ ] Shows UPI ID: 9742628582@sbi
- [ ] Shows Account Holder: P S Lochan

**Upload New QR:**
- [ ] Click "Choose File" or upload area
- [ ] Select QR code image (PNG/JPG)
- [ ] Preview shows before saving
- [ ] Click "Save" or "Update"
- [ ] Success message appears
- [ ] New QR code is displayed
- [ ] Can change UPI ID
- [ ] Can change Account Holder name

**Validation:**
- [ ] File size limit (5MB max)
- [ ] File type validation (images only)
- [ ] Required fields validation

---

## 6. PAYMENT VERIFICATION PAGE - DETAILED TEST

**Navigate to:** `/admin/payment-verifications`

**Pending Payments List:**
- [ ] Shows all pending payment verifications
- [ ] Each item shows:
  - Player name
  - Tournament name
  - Category
  - Amount (₹)
  - Payment screenshot (clickable to view full size)
  - Timestamp

**Actions:**
- [ ] Click "View Screenshot" - opens full image
- [ ] Click "Approve" button
  - Confirms approval
  - Payment status changes to APPROVED
  - Player gets notification
  - Player can now participate in tournament
- [ ] Click "Reject" button
  - Shows reason input
  - Confirms rejection
  - Payment status changes to REJECTED
  - Player gets notification with reason

---

## 7. USER MANAGEMENT PAGE - DETAILED TEST

**Navigate to:** `/admin/users`

**User List:**
- [ ] Shows all registered users
- [ ] Search bar works (search by name/email)
- [ ] Filter by role (PLAYER, ORGANIZER, UMPIRE)
- [ ] Shows user details:
  - Name
  - Email
  - Phone
  - Roles
  - Registration date
  - Status (Active/Blocked)

**User Actions:**
- [ ] Click "View Details" - shows full user profile
- [ ] Click "Block User"
  - Confirms action
  - User status changes to blocked
  - User cannot login
- [ ] Click "Unblock User"
  - Confirms action
  - User status changes to active
  - User can login again
- [ ] Click "Login as User" (Impersonate)
  - Logs in as that user
  - Shows impersonation banner at top
  - Can perform actions as that user
  - Click "Return to Admin" to go back

---

## 8. REVENUE DASHBOARD - DETAILED TEST

**Navigate to:** `/admin/revenue`

**Revenue Stats:**
- [ ] Total Revenue (all registration fees collected)
- [ ] Platform Earnings (5% of all fees)
- [ ] Organizer Payouts (95% of fees, split 50/50)
- [ ] Pending Payouts
- [ ] Completed Payouts

**Revenue Breakdown:**
- [ ] By tournament
- [ ] By date range
- [ ] By organizer
- [ ] Export to CSV/Excel

**Payout Management:**
- [ ] Shows pending first 50% payouts
- [ ] Shows pending second 50% payouts
- [ ] Can mark payouts as paid
- [ ] Can view payout history

---

## 9. ACADEMIES APPROVAL PAGE - DETAILED TEST

**Navigate to:** `/admin/academies`

**Pending Academies:**
- [ ] Shows all pending academy submissions
- [ ] Each shows:
  - Academy name
  - Owner name
  - Location (city, state)
  - Contact details
  - Facilities
  - Submission date

**Actions:**
- [ ] Click "View Details" - shows full academy info
- [ ] Click "Approve"
  - Confirms approval
  - Academy status changes to APPROVED
  - Owner gets notification
  - Academy appears in public search
- [ ] Click "Reject"
  - Shows reason input
  - Confirms rejection
  - Owner gets notification with reason

---

## 10. TOURNAMENT PAYMENTS PAGE - DETAILED TEST

**Navigate to:** `/admin/tournament-payments`

**Tournament List:**
- [ ] Shows all tournaments with payments
- [ ] Each shows:
  - Tournament name
  - Organizer name
  - Total registrations
  - Total fees collected
  - Platform fee (5%)
  - Organizer share (95%)
  - First 50% payout status
  - Second 50% payout status

**Payout Actions:**
- [ ] Click "Mark First 50% as Paid"
  - Confirms payment
  - Updates status
  - Organizer gets notification
- [ ] Click "Mark Second 50% as Paid"
  - Only available after tournament completion
  - Confirms payment
  - Updates status
  - Organizer gets notification

---

## 11. ORGANIZER PAYOUTS PAGE - DETAILED TEST

**Navigate to:** `/admin/organizer-payouts`

**Payout List:**
- [ ] Shows all organizer payouts
- [ ] Filter by status (Pending/Paid)
- [ ] Each shows:
  - Organizer name
  - Tournament name
  - Amount
  - Payout type (First 50% / Second 50%)
  - Status
  - Due date

**Actions:**
- [ ] Click "Mark as Paid"
- [ ] Add payment reference number
- [ ] Upload payment proof (optional)
- [ ] Confirm payment

---

## 12. NOTIFICATIONS ✓

**Bell Icon (Top Right):**
- [ ] Shows unread count badge
- [ ] Click to open notifications dropdown
- [ ] Shows recent notifications:
  - New registrations
  - Payment verifications needed
  - Academy submissions
  - User reports
- [ ] Click notification to view details
- [ ] Mark as read functionality

---

## 13. LOGOUT ✓

**Logout Button:**
- [ ] Click "Logout" button (top right)
- [ ] Clears session
- [ ] Redirects to login page
- [ ] Cannot access admin pages without login

---

## 14. RESPONSIVE DESIGN ✓

**Test on Different Screen Sizes:**
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

**Check:**
- [ ] All buttons are clickable
- [ ] Text is readable
- [ ] Images scale properly
- [ ] Navigation works
- [ ] No horizontal scroll

---

## 15. ERROR HANDLING ✓

**Test Error Scenarios:**
- [ ] Invalid file upload (wrong format)
- [ ] File too large (>5MB)
- [ ] Network error during save
- [ ] Session timeout
- [ ] Invalid data submission

**Expected:**
- [ ] Clear error messages
- [ ] No app crashes
- [ ] User can retry action

---

## CRITICAL ISSUES TO FIX

### Issue 1: Admin Profile 404 Error ✓ FIXED
- Admin user (userId: 'admin') was trying to fetch profile from users table
- Fixed by skipping profile fetch for super admin in AuthContext

### Issue 2: Button Navigation Not Working
- Buttons were not navigating to correct pages
- Need to verify after hard refresh

### Issue 3: Halo Effects
- All buttons should have glowing halo effect on hover
- Already implemented with Tailwind classes

---

## TESTING STATUS

**Last Updated:** January 19, 2026
**Tested By:** AI Assistant
**Status:** In Progress

**Next Steps:**
1. Hard refresh browser (Ctrl+Shift+R)
2. Login as admin
3. Test each button one by one
4. Report which buttons work and which don't
5. Fix issues as they come up

---

## NOTES

- All payments go to admin's UPI: 9742628582@sbi (P S Lochan)
- Platform fee: 5% to admin, 95% to organizer
- Organizer payments split: 50% before tournament, 50% after completion
- Only admin can verify payments (organizers cannot)
- All users get PLAYER, UMPIRE, ORGANIZER roles by default
- No KYC required
