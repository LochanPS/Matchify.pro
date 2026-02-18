# 🧪 MATCHIFY.PRO - Complete Feature Testing Checklist

**Test Date:** February 15, 2026  
**Tester:** _____________  
**Environment:** Local Development (localhost:5173 / localhost:5000)

---

## 🔐 AUTHENTICATION & USER MANAGEMENT

### Registration & Login
- [ ] Register new player account
- [ ] Register new organizer account
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (should fail)
- [ ] Logout functionality
- [ ] JWT token stored in localStorage
- [ ] Token refresh on page reload

### Profile Management
- [ ] View profile page
- [ ] Edit profile (name, email, phone)
- [ ] Upload profile photo
- [ ] Update city/state/country
- [ ] Change password
- [ ] Profile completion modal appears for incomplete profiles

---

## 👥 PLAYER FEATURES

### Tournament Discovery
- [ ] Browse all tournaments on homepage
- [ ] View tournament discovery page
- [ ] Search tournaments by name
- [ ] Filter by city
- [ ] Filter by state
- [ ] Filter by date
- [ ] View tournament details page
- [ ] See tournament poster
- [ ] See registration deadline
- [ ] See entry fees

### Tournament Registration
- [ ] Register for tournament (solo)
- [ ] Register with partner (doubles)
- [ ] Upload payment screenshot
- [ ] View payment QR code
- [ ] Registration blocked after deadline
- [ ] View "Registration Closed" message after deadline
- [ ] Receive registration confirmation notification
- [ ] View registration in "My Registrations"

### My Registrations
- [ ] View all my registrations
- [ ] See registration status (Pending/Approved/Rejected)
- [ ] Request cancellation
- [ ] View refund status
- [ ] Filter by tournament

### Tournament Participation
- [ ] View tournament draws/brackets
- [ ] See my matches
- [ ] View match schedule
- [ ] See opponent details
- [ ] View live match scores
- [ ] Receive match notifications

### Points & Leaderboard
- [ ] View global leaderboard
- [ ] View city leaderboard
- [ ] View state leaderboard
- [ ] View my rank
- [ ] View my points on "My Points" page
- [ ] See tournaments played count
- [ ] See matches won/lost
- [ ] Points update after match completion

### Wallet
- [ ] View wallet balance
- [ ] View transaction history
- [ ] Top-up wallet (if Razorpay configured)
- [ ] Receive refunds to wallet
- [ ] Use wallet for tournament payment

---

## 🏆 ORGANIZER FEATURES

### Tournament Creation
- [ ] Access "Create Tournament" page
- [ ] Fill tournament details (name, description, dates)
- [ ] Upload tournament poster
- [ ] Set registration deadline
- [ ] Set tournament location
- [ ] Add UPI ID for payments
- [ ] Upload payment QR code
- [ ] Create tournament successfully
- [ ] View created tournament in organizer dashboard

### Category Management
- [ ] Add categories (Men's Singles, Women's Doubles, etc.)
- [ ] Set entry fee per category
- [ ] Add skill levels (Beginner, Intermediate, Advanced)
- [ ] Edit category details
- [ ] Delete category
- [ ] End category/level

### Registration Management
- [ ] View all registrations for tournament
- [ ] See pending registrations
- [ ] View payment screenshots
- [ ] Approve registration
- [ ] Reject registration
- [ ] View approved registrations count
- [ ] Manual registration approval

### Draw Generation
- [ ] Generate round-robin draw
- [ ] Generate knockout draw
- [ ] View generated draws
- [ ] Arrange knockout matchups manually
- [ ] Quick add players to draws
- [ ] Restart draws
- [ ] Edit draw arrangements

### Match Management
- [ ] View all matches
- [ ] Create match manually
- [ ] Assign umpire to match
- [ ] Start match
- [ ] View match status
- [ ] Conduct match page
- [ ] View live match scores
- [ ] Complete match
- [ ] Winner advances in knockout

### Tournament Management
- [ ] Edit tournament details
- [ ] View tournament dashboard
- [ ] See registration statistics
- [ ] View revenue
- [ ] View participant list
- [ ] End tournament
- [ ] View tournament in history

### Organizer Dashboard
- [ ] View all my tournaments
- [ ] See active tournaments
- [ ] See completed tournaments
- [ ] View tournament statistics
- [ ] Access tournament management
- [ ] View revenue summary

---

## 🎯 UMPIRE FEATURES

### Umpire Dashboard
- [ ] View assigned matches
- [ ] See upcoming matches
- [ ] See completed matches
- [ ] View match details
- [ ] Access scoring console

### Match Scoring
- [ ] Open scoring console
- [ ] Start match
- [ ] Score point for player 1
- [ ] Score point for player 2
- [ ] Complete set
- [ ] Start new set
- [ ] Complete match
- [ ] Declare winner
- [ ] Real-time score updates
- [ ] Undo last point (if available)

---

## 👨‍💼 ADMIN FEATURES

### Admin Dashboard
- [ ] View platform statistics
- [ ] See total users count
- [ ] See total tournaments count
- [ ] See total revenue
- [ ] See active tournaments
- [ ] See pending approvals

### User Management
- [ ] View all users
- [ ] Search users by email/name
- [ ] Filter by role
- [ ] View user details
- [ ] Suspend user
- [ ] Unsuspend user
- [ ] Delete user
- [ ] Login as user (impersonation)
- [ ] Return to admin from impersonation
- [ ] View user ledger

### User Impersonation
- [ ] Click "Login as User"
- [ ] Orange banner appears
- [ ] Can access user's features
- [ ] Click "Return to Admin"
- [ ] Button shows loading state
- [ ] Successfully returns to admin dashboard
- [ ] No console errors

### Academy Management
- [ ] View academy submissions
- [ ] See pending academies
- [ ] View academy details
- [ ] Approve academy
- [ ] Reject academy with reason
- [ ] View approved academies

### Payment Management
- [ ] View payment verifications
- [ ] See pending payments
- [ ] View payment screenshots
- [ ] Approve payment
- [ ] Reject payment
- [ ] View tournament payments
- [ ] View organizer payouts
- [ ] Issue refund
- [ ] View refund history

### Revenue Dashboard
- [ ] View total revenue
- [ ] See Type 1 revenue (Player → Organizer)
- [ ] See Type 2 revenue (Organizer → Admin)
- [ ] Filter by date range
- [ ] View revenue by tournament
- [ ] Export revenue report (if available)

### QR Settings
- [ ] View current QR codes
- [ ] Upload new QR code
- [ ] Set UPI ID
- [ ] Update payment settings
- [ ] View payment settings history

### Tournament Management
- [ ] View all tournaments
- [ ] Filter tournaments
- [ ] View tournament details
- [ ] Cancel tournament
- [ ] View tournament payments
- [ ] View tournament registrations

### Invite System
- [ ] Create admin invite
- [ ] Generate invite code
- [ ] View active invites
- [ ] View used invites
- [ ] Revoke invite
- [ ] View invite usage

### Audit Logs
- [ ] View all audit logs
- [ ] Filter by user
- [ ] Filter by action
- [ ] Filter by date
- [ ] View log details

---

## 🔔 NOTIFICATION SYSTEM

### Notifications
- [ ] Receive registration approval notification
- [ ] Receive registration rejection notification
- [ ] Receive match scheduled notification
- [ ] Receive match starting notification
- [ ] Receive match completed notification
- [ ] Receive tournament update notification
- [ ] Receive payment confirmation notification
- [ ] Receive refund notification
- [ ] View notification center
- [ ] Mark notification as read
- [ ] View notification details
- [ ] Notification badge shows unread count

---

## 🔴 LIVE FEATURES

### Live Matches
- [ ] View live matches page
- [ ] See ongoing matches
- [ ] View live scores
- [ ] Real-time score updates
- [ ] View match details
- [ ] Spectator view works

### Live Tournament Dashboard
- [ ] View live tournament dashboard
- [ ] See all ongoing matches
- [ ] Real-time updates
- [ ] View tournament progress
- [ ] See completed matches

### WebSocket
- [ ] WebSocket connection established
- [ ] Real-time score updates work
- [ ] Match status updates in real-time
- [ ] Notifications appear in real-time

---

## 💰 PAYMENT SYSTEM

### Payment Flow
- [ ] View payment QR code during registration
- [ ] Upload payment screenshot
- [ ] Payment verification by admin
- [ ] Payment approval notification
- [ ] Registration approved after payment
- [ ] Wallet payment option works
- [ ] Refund to wallet works

### Cancellation & Refunds
- [ ] Request tournament cancellation
- [ ] View cancellation request status
- [ ] Admin processes refund
- [ ] Refund appears in wallet
- [ ] Refund notification received
- [ ] Transaction appears in wallet history

---

## 🎪 TOURNAMENT FORMATS

### Round-Robin
- [ ] Generate round-robin draw
- [ ] All players play each other
- [ ] Points table updates
- [ ] Winner determined by points
- [ ] Matches created correctly

### Knockout
- [ ] Generate knockout bracket
- [ ] Single elimination works
- [ ] Winner advances automatically
- [ ] TBD players handled correctly
- [ ] Manual matchup arrangement works
- [ ] Final winner declared

---

## 🔒 SECURITY & PERMISSIONS

### Role-Based Access
- [ ] Player can't access organizer features
- [ ] Organizer can't access admin features
- [ ] Umpire can only score assigned matches
- [ ] Admin can access all features
- [ ] Blocked routes redirect properly

### Authentication
- [ ] Protected routes require login
- [ ] Invalid token redirects to login
- [ ] Token expiry handled correctly
- [ ] Refresh token works

---

## 📱 UI/UX FEATURES

### Responsive Design
- [ ] Works on desktop
- [ ] Works on tablet
- [ ] Works on mobile
- [ ] Navigation menu works
- [ ] Modals display correctly

### User Experience
- [ ] Loading states show
- [ ] Error messages display
- [ ] Success messages display
- [ ] Forms validate input
- [ ] Buttons disabled during loading
- [ ] No double-click issues

---

## 🐛 KNOWN ISSUES TO VERIFY

### Fixed Issues (Should Work)
- [ ] Return to Admin button works without errors
- [ ] No double-click on Return to Admin
- [ ] Registration blocked after deadline
- [ ] End Tournament button works
- [ ] Progress bar removed from draws page
- [ ] Match completion navigation works

---

## ⚠️ FEATURES TO DISABLE/REMOVE

### KYC Features (To Be Removed)
- [ ] KYC banner should NOT appear
- [ ] KYC submission page should NOT be accessible
- [ ] KYC routes should be disabled
- [ ] Admin KYC dashboard should be removed
- [ ] Video call page should be removed
- [ ] Phone verification should be removed (if KYC-related)

---

## 📊 TEST RESULTS SUMMARY

**Total Features Tested:** _____ / _____  
**Passed:** _____  
**Failed:** _____  
**Blocked:** _____  

### Critical Issues Found:
1. 
2. 
3. 

### Minor Issues Found:
1. 
2. 
3. 

### Recommendations:
1. 
2. 
3. 

---

**Test Completed By:** _____________  
**Date:** _____________  
**Sign-off:** _____________
