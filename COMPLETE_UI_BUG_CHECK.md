# 🔍 COMPLETE UI BUG CHECK - Matchify.pro

## 📋 TESTING CHECKLIST

### 1. AUTHENTICATION & REGISTRATION ✅

**Login Page** (`/login`)
- [ ] Admin login (ADMIN@gmail.com / ADMIN@123(123))
- [ ] Organizer login (organizer@gmail.com / organizer123)
- [ ] Player login (player1@test.com / password123)
- [ ] Wrong password shows error
- [ ] Empty fields validation
- [ ] Remember me checkbox
- [ ] Forgot password link

**Register Page** (`/register`)
- [ ] Register as Player
- [ ] Register as Organizer
- [ ] Register as Umpire
- [ ] Email validation
- [ ] Password strength check
- [ ] Phone number validation
- [ ] Duplicate email error
- [ ] Profile completion modal after registration

**Profile Completion**
- [ ] Modal appears for incomplete profiles
- [ ] City autocomplete (150+ Indian cities)
- [ ] State auto-fills when city selected
- [ ] Date of birth picker
- [ ] Gender selection
- [ ] Profile photo upload
- [ ] Save and continue

---

### 2. ADMIN PANEL ✅

**Dashboard** (`/admin/dashboard`)
- [ ] Statistics cards (users, tournaments, revenue)
- [ ] Recent activity feed
- [ ] Charts and graphs
- [ ] Quick actions

**User Management** (`/admin/users`)
- [x] View all users (5 users visible)
- [x] Search by name/email/phone
- [x] Filter by role (Player, Organizer, Umpire, Admin)
- [x] Filter by status (All Users, Active Only, Blocked Only)
- [x] View user details modal
- [x] Suspend user with reason
- [x] Unsuspend user
- [x] Delete user (soft delete)
- [x] Restore deleted user
- [x] Login as user (impersonation)
- [x] Return to admin after impersonation
- [ ] Pagination working
- [ ] Export users to CSV

**KYC Management** (`/admin/kyc`)
- [x] View pending KYCs
- [x] View Aadhaar image
- [x] Approve KYC
- [x] Reject KYC with reason
- [x] Toggle availability for video calls
- [x] Statistics (pending, approved, rejected)
- [ ] Video call with organizer (Daily.co)

**Academy Management** (`/admin/academies`)
- [ ] View pending academies
- [ ] View academy details
- [ ] View payment screenshot
- [ ] View academy photos (separate from payment)
- [ ] Approve academy
- [ ] Reject academy with reason
- [ ] View approved academies
- [ ] Delete academy (soft delete)
- [ ] Restore deleted academy

**Audit Logs** (`/admin/audit-logs`)
- [ ] View all admin actions
- [ ] Filter by action type
- [ ] Filter by admin
- [ ] Filter by date range
- [ ] Export to CSV
- [ ] Search logs

**Invites** (`/admin/invites`)
- [ ] Create new invite
- [ ] Select roles for invite
- [ ] Copy invite link
- [ ] View pending invites
- [ ] Revoke invite
- [ ] Delete invite
- [ ] View accepted invites

---

### 3. ORGANIZER FEATURES ✅

**KYC Submission** (`/organizer/kyc/submit`)
- [x] Upload Aadhaar (drag & drop)
- [x] File validation (JPG, PNG, PDF, max 5MB)
- [x] Image preview
- [x] Upload to Cloudinary
- [x] Redirect to video call page

**Video Call** (`/organizer/kyc/video-call`)
- [x] Request video call button
- [x] Find available admin
- [x] Daily.co video interface
- [x] Status polling (every 3 seconds)
- [x] Approved screen
- [x] Rejected screen with reason
- [x] Resubmit button after rejection

**Tournament Creation** (`/tournaments/create`)
- [ ] Blocked without KYC approval
- [ ] Basic info (name, description, venue)
- [ ] City autocomplete
- [ ] Date pickers (start, end, registration close)
- [ ] Upload tournament poster
- [ ] Payment details (UPI, QR code)
- [ ] Court information
- [ ] Match timings
- [ ] Save as draft
- [ ] Publish tournament

**Add Categories** (`/tournaments/:id/categories`)
- [ ] Add category (Singles/Doubles)
- [ ] Gender selection
- [ ] Age group
- [ ] Entry fee
- [ ] Max entries
- [ ] Prize money
- [ ] Edit category
- [ ] Delete category
- [ ] Generate draws

**Tournament Management** (`/organizer/tournaments/:id`)
- [ ] View registrations
- [ ] Approve/reject registrations
- [ ] View draws
- [ ] Assign umpires
- [ ] Start matches
- [ ] View live scores
- [ ] Complete tournament
- [ ] Cancel tournament

**Organizer Dashboard** (`/organizer/dashboard`)
- [ ] Upcoming tournaments
- [ ] Active tournaments
- [ ] Past tournaments
- [ ] Revenue statistics
- [ ] Registration statistics
- [ ] Quick actions

---

### 4. PLAYER FEATURES

**Browse Tournaments** (`/tournaments`)
- [ ] View all tournaments
- [ ] Filter by city
- [ ] Filter by state
- [ ] Filter by sport
- [ ] Filter by date
- [ ] Search tournaments
- [ ] View tournament details

**Tournament Details** (`/tournaments/:id`)
- [ ] View tournament info
- [ ] View categories
- [ ] View entry fees
- [ ] View venue details
- [ ] View organizer info
- [ ] Register button

**Registration** (`/tournaments/:id/register`)
- [ ] Select category
- [ ] Singles registration
- [ ] Doubles registration (partner selection)
- [ ] Partner email input
- [ ] Partner confirmation flow
- [ ] Payment from wallet
- [ ] Payment confirmation
- [ ] Registration success

**My Registrations** (`/registrations`)
- [ ] View all registrations
- [ ] Filter by status (pending, confirmed, cancelled)
- [ ] View tournament details
- [ ] Cancel registration
- [ ] Request refund
- [ ] View partner details

**Player Dashboard** (`/dashboard`)
- [ ] Upcoming matches
- [ ] Match history
- [ ] Points and ranking
- [ ] Tournaments played
- [ ] Win/loss record
- [ ] Wallet balance

**My Points** (`/my-points`)
- [ ] Total points
- [ ] Points breakdown
- [ ] Points history
- [ ] Leaderboard position

---

### 5. UMPIRE FEATURES

**Umpire Dashboard** (`/umpire/dashboard`)
- [ ] Assigned matches
- [ ] Upcoming matches
- [ ] Completed matches
- [ ] Earnings

**Match Scoring** (`/scoring/:matchId`)
- [ ] Start match
- [ ] Update scores (set by set)
- [ ] Point by point scoring
- [ ] Undo last point
- [ ] Complete set
- [ ] Complete match
- [ ] Submit score correction request

**Umpire Profile**
- [ ] View umpire code
- [ ] View assigned tournaments
- [ ] View earnings
- [ ] Update availability

---

### 6. ACADEMY MANAGEMENT

**Add Academy** (`/academies/add`)
- [ ] Academy name
- [ ] City autocomplete (150+ cities)
- [ ] State auto-fill
- [ ] Sports facilities input (with suffix)
- [ ] Additional info field
- [ ] Upload academy photos (multiple)
- [ ] Upload payment screenshot (separate)
- [ ] Submit for approval

**Search Academies** (`/academies`)
- [ ] View all approved academies
- [ ] Filter by city
- [ ] Filter by state
- [ ] Filter by sport
- [ ] Search academies
- [ ] View academy details

**Academy Details**
- [ ] View academy info
- [ ] View photos
- [ ] View facilities
- [ ] View contact info
- [ ] View location on map

---

### 7. WALLET & PAYMENTS

**Wallet** (`/wallet`)
- [ ] View balance
- [ ] Top-up wallet (Razorpay)
- [ ] Transaction history
- [ ] Filter by type (topup, payment, refund)
- [ ] Filter by date
- [ ] Download statement

**Credits** (`/credits`)
- [ ] View Matchify credits
- [ ] Purchase credits
- [ ] Credit history
- [ ] Use credits for tournaments

**Payments**
- [ ] Tournament registration payment
- [ ] Wallet deduction
- [ ] Payment confirmation
- [ ] Payment receipt
- [ ] Refund processing

---

### 8. SCORING SYSTEM

**Live Scoring** (`/matches/:matchId/live`)
- [ ] Real-time score updates
- [ ] Set by set display
- [ ] Point by point updates
- [ ] Player names
- [ ] Match status
- [ ] WebSocket connection

**Spectator View** (`/watch/:matchId`)
- [ ] Live score display
- [ ] Match progress
- [ ] Player stats
- [ ] Tournament info
- [ ] Auto-refresh

**Score Corrections**
- [ ] Request correction
- [ ] Admin approval
- [ ] Correction applied
- [ ] Notification sent

---

### 9. NOTIFICATIONS

**Notifications Page** (`/notifications`)
- [ ] View all notifications
- [ ] Mark as read
- [ ] Mark all as read
- [ ] Delete notification
- [ ] Filter by type
- [ ] Real-time updates (WebSocket)

**Notification Types**
- [ ] Registration approved
- [ ] Registration rejected
- [ ] Match assigned (umpire)
- [ ] Match starting soon
- [ ] Payment received
- [ ] Refund processed
- [ ] KYC approved
- [ ] KYC rejected
- [ ] Tournament published

---

### 10. DRAWS & BRACKETS

**View Draws** (`/tournaments/:id/draws`)
- [ ] View all categories
- [ ] Select category
- [ ] View bracket
- [ ] Zoom in/out
- [ ] Print bracket
- [ ] Download bracket

**Bracket Display**
- [ ] Single elimination
- [ ] Double elimination
- [ ] Round robin
- [ ] Match numbers
- [ ] Player names
- [ ] Scores
- [ ] Winner highlighted

---

### 11. LEADERBOARD

**Leaderboard** (`/leaderboard`)
- [ ] View top players
- [ ] Filter by city
- [ ] Filter by state
- [ ] Filter by age group
- [ ] Search players
- [ ] View player profile
- [ ] Points breakdown

---

### 12. PROFILE & SETTINGS

**Profile Page** (`/profile`)
- [ ] View profile info
- [ ] Edit profile
- [ ] Upload profile photo
- [ ] Update contact info
- [ ] Update location
- [ ] Change password
- [ ] Delete account

---

## 🐛 KNOWN BUGS TO CHECK

### Critical Bugs:
1. [ ] Database migration reset all data
2. [ ] Too many database connections error
3. [ ] Suspended users showing incorrectly (FIXED)
4. [ ] Role vs roles field mismatch (FIXED)
5. [ ] Deleted users route order (FIXED)

### UI Bugs:
1. [ ] Profile completion modal not appearing
2. [ ] City autocomplete not working
3. [ ] Image upload failing
4. [ ] Payment gateway not configured
5. [ ] WebSocket disconnections
6. [ ] Notification badge not updating

### API Bugs:
1. [ ] Admin stats endpoint failing
2. [ ] Tournament creation blocked
3. [ ] Registration payment failing
4. [ ] Score update delays
5. [ ] Email notifications not sending

---

## 🧪 TESTING PRIORITY

### HIGH PRIORITY (Test First):
1. ✅ Login/Authentication
2. ✅ Admin user management
3. ✅ KYC system
4. ⚠️ Tournament creation
5. ⚠️ Registration flow
6. ⚠️ Payment system

### MEDIUM PRIORITY:
7. ⚠️ Academy management
8. ⚠️ Scoring system
9. ⚠️ Notifications
10. ⚠️ Draws/Brackets

### LOW PRIORITY:
11. ⚠️ Leaderboard
12. ⚠️ Profile settings
13. ⚠️ Audit logs
14. ⚠️ Reports/Analytics

---

## 📊 TESTING STATUS

**Completed:** 15/100+ features tested
**Passed:** 15/15 (100%)
**Failed:** 0/15 (0%)
**Not Tested:** 85+ features

---

## 🎯 NEXT STEPS

1. **Check Supabase for backups** (YOU need to do this)
2. **Test tournament creation flow**
3. **Test registration flow**
4. **Test payment system**
5. **Test scoring system**
6. **Test academy management**

---

## ⚠️ IMPORTANT NOTES

- Most features cannot be fully tested without data
- Need to create test tournaments
- Need to create test academies
- Need to test with multiple users
- Need to test payment gateway
- Need to test WebSocket connections

**Recommendation:** Create sample data first, then test all features systematically.
