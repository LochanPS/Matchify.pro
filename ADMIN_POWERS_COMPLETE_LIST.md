# 🔐 Admin Powers - Complete Feature List

## 👤 Admin Account Details
- **Email:** ADMIN@gmail.com
- **Password:** ADMIN@123(123)
- **Role:** ADMIN (Super Administrator)
- **Access Level:** Full System Access

---

## 🎯 Core Admin Powers

### 1. 👥 USER MANAGEMENT
**Location:** `/admin/users`

**Powers:**
- ✅ View all users with pagination and search
- ✅ Filter users by role (Player, Organizer, Umpire, Admin)
- ✅ Filter users by status (Active, Suspended, Inactive)
- ✅ Search users by name, email, or phone
- ✅ View detailed user profiles
- ✅ **Login as any user (Impersonation)**
  - Can access any user's account
  - See their dashboard
  - Test features as that user
  - Return to admin account anytime
- ✅ **Suspend/Unsuspend users**
  - Block users from platform
  - Set suspension reason
  - Set suspension duration
- ✅ View user statistics:
  - Wallet balance
  - Total points
  - Tournaments played
  - Matches won/lost
  - Registrations count
  - Tournaments organized

**Special Features:**
- Cannot impersonate other admin accounts (security)
- Cannot suspend admin accounts
- Full audit trail of actions

---

### 2. 🏆 TOURNAMENT MANAGEMENT
**Location:** `/tournaments` (Admin view)

**Powers:**
- ✅ View all tournaments (public + private)
- ✅ See tournament details
- ✅ Monitor tournament status
- ✅ View registrations for any tournament
- ✅ **Quick Add Players** (bypass payment)
  - Add players directly to tournaments
  - No payment required
  - Instant registration
- ✅ **Award Tournament Points manually**
  - Override automatic point calculation
  - Award custom points to players
- ✅ **Cancel tournaments**
  - Process refunds
  - Notify all participants
- ✅ View tournament analytics:
  - Total registrations
  - Revenue generated
  - Completion status
  - Match progress

**Admin-Specific Actions:**
- View organizer details
- Monitor tournament health
- Intervene in disputes
- Override tournament settings

---

### 3. 💰 PAYMENT MANAGEMENT

#### A. Payment Verification
**Location:** `/admin/payment-verifications`

**Powers:**
- ✅ View all payment screenshots
- ✅ **Approve/Reject payments**
  - Verify payment screenshots
  - Approve registrations
  - Reject with reason
- ✅ Filter by status (Pending, Approved, Rejected)
- ✅ Search by tournament or user
- ✅ View payment details:
  - Amount paid
  - Screenshot image
  - User information
  - Tournament details

#### B. QR Code Settings
**Location:** `/admin/qr-settings`

**Powers:**
- ✅ **Upload platform payment QR code**
  - Set admin's UPI ID
  - Upload QR code image
  - Set account holder name
- ✅ Update payment settings
- ✅ View current QR code
- ✅ All tournaments use this QR code

#### C. Tournament Payments & Payouts
**Location:** `/admin/tournament-payments`

**Powers:**
- ✅ View all tournament revenue
- ✅ **Process organizer payouts**
  - First 50% payout (before tournament)
  - Second 50% payout (after tournament)
- ✅ Track platform fees (5%)
- ✅ View payout history
- ✅ Upload payment proof
- ✅ Mark payouts as completed

#### D. Organizer Payouts
**Location:** `/admin/organizer-payouts`

**Powers:**
- ✅ View pending payouts
- ✅ Process refunds
- ✅ Upload payment screenshots
- ✅ Track payout status
- ✅ View organizer bank details

---

### 4. 🏢 ACADEMY MANAGEMENT
**Location:** `/admin/academies`

**Powers:**
- ✅ View all academy submissions
- ✅ **Approve/Reject academies**
  - Review academy details
  - Verify payment screenshots
  - Approve for listing
  - Reject with reason
- ✅ **Block/Unblock academies**
  - Temporarily block academies
  - Set block reason
- ✅ **Delete academies** (soft delete)
  - Remove from listings
  - Set deletion reason
- ✅ View academy details:
  - Name, address, location
  - Sports offered
  - Contact information
  - Payment proof
  - Photos

---

### 5. 📊 REVENUE & ANALYTICS
**Location:** `/admin/revenue`

**Powers:**
- ✅ View total platform revenue
- ✅ Revenue breakdown by:
  - Tournament fees
  - Registration fees
  - Platform fees (5%)
- ✅ View revenue trends
- ✅ Export revenue reports
- ✅ Track organizer payouts
- ✅ Monitor payment flow
- ✅ View financial statistics:
  - Total collected
  - Total paid out
  - Platform earnings
  - Pending payouts

---

### 6. 🎥 KYC & VERIFICATION

#### A. Organizer KYC
**Location:** `/admin/kyc-dashboard`

**Powers:**
- ✅ View KYC submissions
- ✅ Review Aadhaar documents
- ✅ **Conduct video call interviews**
  - Schedule video calls
  - Join video rooms
  - Interview organizers
- ✅ **Approve/Reject KYC**
  - Approve verified organizers
  - Reject with reason
  - Add admin notes
- ✅ **Grant blue tick verification**
  - Mark organizers as verified
  - Display blue tick on profile

#### B. KYC Payment Verification
**Location:** `/admin/kyc-payment-verification`

**Powers:**
- ✅ Verify KYC payment screenshots
- ✅ Approve/Reject KYC payments
- ✅ Track KYC payment status

#### C. Video Call Management
**Location:** `/admin/video-call`

**Powers:**
- ✅ View scheduled calls
- ✅ Join video rooms
- ✅ Conduct interviews
- ✅ Record interview notes
- ✅ Mark availability for KYC

---

### 7. 📱 PHONE VERIFICATION
**Location:** `/admin/phone-verification`

**Powers:**
- ✅ View phone verification requests
- ✅ Manage SMS logs
- ✅ Track verification status
- ✅ Resend verification codes
- ✅ Manual verification override

---

### 8. 📝 AUDIT LOGS
**Location:** `/admin/audit-logs`

**Powers:**
- ✅ View all admin actions
- ✅ Track who did what and when
- ✅ Filter by:
  - Admin user
  - Action type
  - Date range
  - Entity type
- ✅ View detailed action logs:
  - User suspensions
  - Payment approvals
  - KYC decisions
  - Tournament actions
- ✅ Export audit reports
- ✅ Monitor system security

---

### 9. 💳 USER LEDGER
**Location:** `/admin/user-ledger`

**Powers:**
- ✅ View all wallet transactions
- ✅ Track user balances
- ✅ View transaction history
- ✅ Filter by user or transaction type
- ✅ Monitor wallet activity
- ✅ Investigate payment issues

---

### 10. 🎫 INVITE MANAGEMENT
**Location:** `/admin/invite-management`

**Powers:**
- ✅ Create admin invites
- ✅ Generate invite tokens
- ✅ Set invite expiration
- ✅ Track invite usage
- ✅ Revoke invites
- ✅ View invite history

---

### 11. 🚫 TOURNAMENT CANCELLATION
**Location:** `/admin/tournament-cancellation`

**Powers:**
- ✅ View cancellation requests
- ✅ **Approve/Reject cancellations**
- ✅ **Process refunds**
  - Approve refund requests
  - Set refund amounts
  - Upload refund payment proof
- ✅ Track refund status
- ✅ View cancellation reasons
- ✅ Notify affected users

---

### 12. 🗑️ DATA MANAGEMENT
**Location:** `/admin/delete-all-data` (Dangerous!)

**Powers:**
- ✅ **Delete all platform data** (SUPER DANGEROUS)
  - Remove all users
  - Delete all tournaments
  - Clear all payments
  - Reset database
- ⚠️ **USE WITH EXTREME CAUTION**
- ⚠️ **IRREVERSIBLE ACTION**

---

## 🔒 Security Features

### Admin-Only Access
- ✅ All admin routes protected by authentication
- ✅ Requires ADMIN role in JWT token
- ✅ Cannot be accessed by regular users
- ✅ Automatic logout on unauthorized access

### Impersonation Safety
- ✅ Cannot impersonate other admins
- ✅ Impersonation tracked in JWT token
- ✅ Can return to admin account anytime
- ✅ 24-hour impersonation token expiry

### Audit Trail
- ✅ All admin actions logged
- ✅ IP address tracking
- ✅ User agent logging
- ✅ Timestamp for every action

---

## 🚫 Admin Restrictions

### What Admin CANNOT Do:
- ❌ Create tournaments (blocked for admins)
- ❌ Register for tournaments (blocked for admins)
- ❌ Participate as player/umpire (blocked for admins)
- ❌ Submit KYC as organizer (blocked for admins)
- ❌ Impersonate other admin accounts
- ❌ Suspend other admin accounts

### Why These Restrictions?
- Admins are meant to **manage and oversee**, not participate
- Prevents conflicts of interest
- Maintains platform integrity
- Separates admin duties from user activities

---

## 📊 Dashboard Statistics

### Real-Time Stats:
- ✅ Total users count
- ✅ Live tournaments count
- ✅ Completed tournaments count
- ✅ Total platform revenue
- ✅ Pending verifications
- ✅ Active suspensions

---

## 🎯 Quick Actions

### From Admin Dashboard:
1. **QR Settings** - Upload payment QR code
2. **Revenue** - View financial analytics
3. **Manage Users** - User management panel
4. **View Tournaments** - Browse all tournaments
5. **Payments** - Verify payment screenshots
6. **Academies** - Approve academy listings

---

## 🔐 Admin Privileges Summary

| Feature | Admin Power | Regular User |
|---------|-------------|--------------|
| View all users | ✅ Yes | ❌ No |
| Suspend users | ✅ Yes | ❌ No |
| Login as user | ✅ Yes | ❌ No |
| Approve payments | ✅ Yes | ❌ No |
| Process refunds | ✅ Yes | ❌ No |
| Approve KYC | ✅ Yes | ❌ No |
| View revenue | ✅ Yes | ❌ No |
| Manage academies | ✅ Yes | ❌ No |
| Quick add players | ✅ Yes | ❌ No |
| Award points | ✅ Yes | ❌ No |
| View audit logs | ✅ Yes | ❌ No |
| Cancel tournaments | ✅ Yes | ❌ No (only organizer) |
| Create tournaments | ❌ No | ✅ Yes (organizers) |
| Register for tournaments | ❌ No | ✅ Yes (players) |

---

## 🎉 Summary

**The Admin has COMPLETE CONTROL over:**
1. ✅ All users and their accounts
2. ✅ All tournaments and registrations
3. ✅ All payments and refunds
4. ✅ All academies and listings
5. ✅ All KYC and verifications
6. ✅ All revenue and payouts
7. ✅ All system settings
8. ✅ All platform data

**The Admin is the SUPREME AUTHORITY on the platform!**

---

## 🚀 Getting Started as Admin

1. **Login** with ADMIN@gmail.com
2. **Dashboard** - View platform overview
3. **Users** - Manage user accounts
4. **Payments** - Verify pending payments
5. **KYC** - Approve organizer verifications
6. **Revenue** - Monitor financial health
7. **Academies** - Approve new listings

---

**Admin = Platform God Mode! 🔥**

