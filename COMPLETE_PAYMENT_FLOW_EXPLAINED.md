# Complete Payment Flow - Matchify.pro

## 📊 VERIFIED SYSTEM STATUS

**Tournament**: Ace Badminton  
**Total Registrations**: 27 confirmed players  
**Entry Fee**: ₹100 per player  
**Total Collected**: ₹2,700

### Payment Breakdown (CORRECT):
- **Platform Fee (5%)**: ₹135 → Goes to YOU
- **First Payout (30%)**: ₹810 → Pay to organizer BEFORE tournament
- **Second Payout (65%)**: ₹1,755 → Pay to organizer AFTER tournament
- **Total**: ₹135 + ₹810 + ₹1,755 = ₹2,700 ✅

---

## 🔄 COMPLETE PAYMENT FLOW

### STEP 1: Player Registers 👤

**Player Actions:**
1. Goes to tournament page
2. Selects category (e.g., "mens singles")
3. Sees entry fee: ₹100
4. Clicks "Register"
5. **Uploads payment screenshot** (proof they paid to Matchify.pro's QR code)
6. Submits registration

**System Actions:**
```javascript
// Creates Registration
{
  status: "pending",
  paymentStatus: "submitted",
  paymentScreenshot: "cloudinary_url_of_screenshot",
  amountTotal: 100
}

// Creates PaymentVerification
{
  status: "pending",
  amount: 100,
  paymentScreenshot: "cloudinary_url_of_screenshot",
  tournamentId: "xxx",
  userId: "player_id"
}

// Creates Notification for ADMIN
{
  type: "PAYMENT_VERIFICATION_REQUIRED",
  title: "New Payment to Verify",
  message: "Player XYZ paid ₹100 for Ace Badminton"
}
```

**What Player Sees:**
- "Registration pending - waiting for payment verification"

---

### STEP 2: Admin Verifies Payment 👨‍💼

**Admin Goes To:**
- Dashboard → Payment Verification
- OR: Admin Dashboard → "X Pending Verifications"

**Admin Sees:**
- List of all pending payments
- Each payment shows:
  - Player name
  - Tournament name
  - Amount: ₹100
  - **Payment screenshot** (can click to view full size)
  - Date submitted
  - Approve/Reject buttons

**Admin Actions:**

#### Option A: APPROVE ✅
1. Admin clicks "Approve"
2. System updates:

```javascript
// Registration updated
{
  status: "confirmed",
  paymentStatus: "completed"  // or "verified"
}

// PaymentVerification updated
{
  status: "approved",
  verifiedBy: "admin_id",
  verifiedAt: "2026-01-25T10:30:00Z"
}

// TournamentPayment updated
{
  totalCollected: 2700,  // += 100
  totalRegistrations: 27,  // += 1
  platformFeeAmount: 135,  // += 5
  payout50Percent1: 810,   // += 30
  payout50Percent2: 1755,  // += 65
  payout50Status1: "pending",
  payout50Status2: "pending"
}

// Notification sent to PLAYER
{
  type: "REGISTRATION_CONFIRMED",
  title: "Payment Approved!",
  message: "Your registration for Ace Badminton is confirmed"
}
```

**What Player Sees:**
- "Registration confirmed! ✅"
- Can now see draw when published

#### Option B: REJECT ❌
1. Admin enters rejection reason
2. Admin clicks "Reject"
3. System updates:

```javascript
// Registration updated
{
  status: "cancelled",
  paymentStatus: "rejected"
}

// PaymentVerification updated
{
  status: "rejected",
  rejectionReason: "Screenshot unclear / Wrong amount / etc.",
  verifiedBy: "admin_id",
  verifiedAt: "2026-01-25T10:30:00Z"
}

// Notification sent to PLAYER
{
  type: "PAYMENT_REJECTED",
  title: "Payment Rejected",
  message: "Reason: Screenshot unclear. Please re-register with clear screenshot."
}
```

---

### STEP 3: Revenue Dashboard Updates 💰

**Admin Can View:**

**Location**: Admin Dashboard → Revenue Dashboard

**Shows:**
```
Total Collected: ₹2,700
Platform Fee (5%): ₹135
Organizer Total (30% + 65%): ₹2,565

Breakdown:
├─ First Payout (30%): ₹810 [Pending]
└─ Second Payout (65%): ₹1,755 [Pending]
```

**Also Shows:**
- Pending verifications count
- Payments due today
- Overdue payments
- Monthly revenue
- Platform earnings

---

### STEP 4: Admin Pays Organizer - First 30% 💸

**When**: Before tournament starts (1 day before)

**Admin Goes To:**
- Admin Dashboard → Organizer Payouts
- OR: Admin Dashboard → "X Pending Payouts"

**Admin Sees:**
```
Pending First 30% Payouts

Tournament: Ace Badminton
Organizer: John Doe
Amount: ₹810
Status: Pending
Tournament Date: Jan 28, 2026
```

**Admin Actions:**
1. Admin sends ₹810 to organizer via UPI (outside the system)
2. Admin clicks "Mark as Paid"
3. Admin enters notes: "Paid via UPI to 9876543210@paytm on Jan 27, 2026"
4. Admin clicks "Confirm"

**System Updates:**
```javascript
// TournamentPayment updated
{
  payout50Status1: "paid",
  payout50PaidAt1: "2026-01-27T14:30:00Z",
  payout50PaidBy1: "admin_id",
  payout50Notes1: "Paid via UPI to 9876543210@paytm on Jan 27, 2026"
}

// Notification sent to ORGANIZER
{
  type: "PAYOUT_RECEIVED",
  title: "First Payment Received",
  message: "You received ₹810 (30% payout) for Ace Badminton"
}
```

**What Organizer Sees:**
- Notification: "First payment received: ₹810"
- In their dashboard: "First 30%: ₹810 [Paid ✅]"

---

### STEP 5: Tournament Happens 🏸

- Tournament runs
- Matches are played
- Winners are determined
- Tournament status → "completed"

---

### STEP 6: Admin Pays Organizer - Second 65% 💸

**When**: After tournament completes (1 day after)

**Admin Goes To:**
- Admin Dashboard → Organizer Payouts
- Filters: "Pending Second 65%"

**Admin Sees:**
```
Pending Second 65% Payouts

Tournament: Ace Badminton
Organizer: John Doe
Amount: ₹1,755
Status: Pending
Tournament Completed: Jan 28, 2026
```

**Admin Actions:**
1. Admin sends ₹1,755 to organizer via UPI
2. Admin clicks "Mark as Paid"
3. Admin enters notes: "Paid via UPI to 9876543210@paytm on Jan 29, 2026"
4. Admin clicks "Confirm"

**System Updates:**
```javascript
// TournamentPayment updated
{
  payout50Status2: "paid",
  payout50PaidAt2: "2026-01-29T16:00:00Z",
  payout50PaidBy2: "admin_id",
  payout50Notes2: "Paid via UPI to 9876543210@paytm on Jan 29, 2026"
}

// Notification sent to ORGANIZER
{
  type: "PAYOUT_RECEIVED",
  title: "Second Payment Received",
  message: "You received ₹1,755 (65% payout) for Ace Badminton"
}
```

**What Organizer Sees:**
- Notification: "Second payment received: ₹1,755"
- In their dashboard: "Second 65%: ₹1,755 [Paid ✅]"

---

## 📊 FINAL STATUS

After all payments complete:

```
Tournament: Ace Badminton
Total Collected: ₹2,700

Platform (You): ₹135 ✅
Organizer First: ₹810 ✅ Paid
Organizer Second: ₹1,755 ✅ Paid

All payments complete! ✅
```

---

## 🔍 WHERE TO FIND EVERYTHING

### For Admin:

1. **Payment Verification**
   - Path: `/admin/payment-verification`
   - Shows: All pending payment screenshots
   - Actions: Approve/Reject

2. **Revenue Dashboard**
   - Path: `/admin/revenue`
   - Shows: Total collected, platform fees, breakdown

3. **Organizer Payouts**
   - Path: `/admin/organizer-payouts`
   - Shows: Pending 30% and 65% payouts
   - Actions: Mark as paid

4. **Tournament Payments**
   - Path: `/admin/tournament-payments`
   - Shows: All tournaments with payment details

### For Player:

1. **My Registrations**
   - Path: `/my-registrations`
   - Shows: All their registrations with status

2. **Notifications**
   - Bell icon in navbar
   - Shows: Payment approved/rejected notifications

### For Organizer:

1. **Tournament Management**
   - Path: `/organizer/tournaments/:id`
   - Shows: Payment status, payout status

2. **Notifications**
   - Bell icon in navbar
   - Shows: Payout received notifications

---

## ✅ VERIFICATION CHECKLIST

Current Status for Ace Badminton:

- [x] 27 players registered
- [x] All payments verified (paymentStatus: "completed")
- [x] TournamentPayment record created
- [x] Total collected: ₹2,700 ✅
- [x] Platform fee: ₹135 (5%) ✅
- [x] First payout: ₹810 (30%) - Status: pending
- [x] Second payout: ₹1,755 (65%) - Status: pending
- [x] Math verified: ₹135 + ₹810 + ₹1,755 = ₹2,700 ✅

**Everything is working correctly!** ✅

---

## 🎯 KEY POINTS

1. **Players pay to Matchify.pro** (not directly to organizer)
2. **Admin verifies all payments** by checking screenshots
3. **System calculates**: 5% + 30% + 65% = 100%
4. **Admin pays organizer** in two installments:
   - 30% before tournament
   - 65% after tournament
5. **Platform keeps 5%** as platform fee
6. **All payments tracked** in TournamentPayment table
7. **Notifications sent** at every step

---

**Last Updated**: January 25, 2026  
**Status**: ✅ System Working Correctly
