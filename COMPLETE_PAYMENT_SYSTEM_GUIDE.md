# 🎯 Complete Payment System Guide - Matchify.pro

## Overview

This is a complete guide explaining how the payment system works in Matchify.pro from start to finish.

---

## 📋 Table of Contents

1. [System Setup](#system-setup)
2. [Tournament Creation](#tournament-creation)
3. [Player Registration](#player-registration)
4. [Payment Approval](#payment-approval)
5. [Payment Tracking](#payment-tracking)
6. [Organizer Payouts](#organizer-payouts)
7. [Complete Flow Diagram](#complete-flow-diagram)

---

## 1. System Setup

### Admin QR Code Setup

**Who**: Admin (You)
**When**: One-time setup
**Where**: Admin Dashboard → QR Settings

**Steps**:
1. Login as admin (ADMIN@gmail.com)
2. Go to Admin Dashboard
3. Click "QR Settings"
4. Upload your UPI QR code image
5. Enter your UPI ID (e.g., 9742628582@slc)
6. Enter account holder name (e.g., P S Lochan)
7. Save settings

**Purpose**: This QR code will be shown to ALL players when they register for ANY tournament. All payments come to you first.

---

## 2. Tournament Creation

### Organizer Creates Tournament

**Who**: Tournament Organizer
**When**: Before tournament
**Where**: Organizer Dashboard → Create Tournament

**Steps**:
1. Organizer logs in
2. Fills tournament details:
   - Tournament name
   - Location (city, state)
   - Date and time
   - Categories (Men's Singles, Women's Doubles, etc.)
   - Entry fees per category
   - Maximum participants
3. **Uploads their own QR code** (important!)
4. Enters their UPI ID
5. Submits tournament

**Important**: The organizer's QR code is saved with the tournament. You'll use this later to pay them.

**Database**: Tournament record created with:
- Tournament details
- Organizer's QR code URL
- Organizer's UPI ID
- Entry fees per category

---

## 3. Player Registration

### Player Registers for Tournament

**Who**: Player
**When**: Before tournament starts
**Where**: Browse Tournaments → Select Tournament → Register

**Steps**:

#### Step 1: Player Selects Tournament
- Player browses available tournaments
- Clicks on tournament they want to join
- Clicks "Register" button

#### Step 2: Player Fills Registration Form
- Selects category (e.g., Men's Singles)
- If doubles/mixed: Enters partner email
- Sees entry fee amount

#### Step 3: Payment Screen
**This is where the magic happens!**

Player sees:
- **Admin's QR Code** (YOUR QR code - not organizer's!)
- Admin's UPI ID (9742628582@slc)
- Account holder name (P S Lochan)
- Amount to pay (entry fee)
- Security notice: "All payments are processed through Matchify.pro admin for security"

#### Step 4: Player Makes Payment
1. Player scans YOUR QR code with their UPI app
2. Pays the entry fee to YOU
3. Takes screenshot of payment confirmation
4. Uploads screenshot in the registration form
5. Submits registration

**Database**: 
- Registration record created (status: PENDING)
- PaymentVerification record created with:
  - Screenshot URL
  - Amount
  - Status: PENDING
  - Link to registration

**Important**: Player pays YOU (admin), not the organizer!

---

## 4. Payment Approval

### Admin Reviews and Approves Payment

**Who**: Admin (You)
**When**: After player submits registration
**Where**: Admin Dashboard → Payment Verification

**Steps**:

#### Step 1: View Pending Payments
- Login as admin
- Go to Admin Dashboard
- Click "Payment Verification"
- See list of pending payment verifications

#### Step 2: Review Payment Screenshot
For each pending payment, you see:
- Player name and email
- Tournament name
- Category
- Amount paid
- Payment screenshot (uploaded by player)
- Registration date

#### Step 3: Verify Payment
- Click on payment to view full screenshot
- Check if payment is genuine
- Verify amount matches entry fee
- Check payment date/time

#### Step 4: Approve or Reject

**If Approved**:
1. Click "Approve" button
2. Confirm approval

**What happens automatically**:
- Registration status changes to CONFIRMED
- Player receives confirmation notification
- **Organizer receives notification** with player details
- **TournamentPayment record created/updated** with:
  - Total collected amount increases
  - Registration count increases
  - Platform fee calculated (5%)
  - First 30% calculated
  - Remaining 65% calculated

**If Rejected**:
1. Click "Reject" button
2. Enter rejection reason
3. Confirm rejection
4. Player receives rejection notification
5. Registration remains PENDING or gets cancelled

**Database Updates**:
```javascript
// PaymentVerification
status: 'APPROVED'
approvedBy: admin_id
approvedAt: current_timestamp

// Registration
status: 'CONFIRMED'

// TournamentPayment (created or updated)
totalCollected: += entry_fee
totalRegistrations: += 1
platformFeeAmount: totalCollected × 0.05
payout50Percent1: totalCollected × 0.30  // First 30%
payout50Percent2: totalCollected × 0.65  // Remaining 65%
organizerShare: payout50Percent1 + payout50Percent2
payout50Status1: 'pending'
payout50Status2: 'pending'
```

---

## 5. Payment Tracking

### Tournament Payments Page

**Who**: Admin (You)
**When**: Anytime
**Where**: Admin Dashboard → Tournament Payments

**What You See**:

#### Stats Cards (Top)
- **Total Collected**: Sum of all payments received
- **Platform Fees**: Your 5% from all tournaments
- **Pending First 30% Payouts**: Count of tournaments waiting for first payment
- **Pending Remaining 65% Payouts**: Count of tournaments waiting for second payment

#### Tournament List (Compact View)
Each tournament shows:
- Tournament name
- Location and date
- Status (upcoming/ongoing/completed)
- Total collected amount
- Your platform fee (5%)
- Payout status indicators (colored dots)
  - 🟡 Yellow = Pending
  - 🟢 Green = Paid

#### Expanded View (Click to Expand)
Click on any tournament to see:

**Tournament Details**:
- Full location
- Start date
- Organizer name
- Number of registrations

**Revenue Breakdown**:
- Total collected: ₹X
- Platform fee (5%): ₹Y (you keep)
- Organizer share (95%): ₹Z

**Payout Status**:
- First 30%: ₹A (pending/paid)
- Remaining 65%: ₹B (pending/paid)
- "Process Payout" button (if pending)

**Example**:
```
Tournament: ACE BADMINTON
Total Collected: ₹10,000
Platform Fee (5%): ₹500 (you keep)
Organizer Share: ₹9,500

First 30%: ₹3,000 (pending) ← Pay before tournament
Remaining 65%: ₹6,500 (pending) ← Pay after tournament
```

---

## 6. Organizer Payouts

### Paying Organizers

**Who**: Admin (You)
**When**: 
- First 30%: Before tournament starts
- Remaining 65%: After tournament completes
**Where**: Admin Dashboard → Organizer Payouts

**Steps**:

#### Step 1: View Pending Payouts
- Login as admin
- Go to Admin Dashboard
- Click "Organizer Payouts"

#### Step 2: Summary Cards
You see:
- **Pending First 30% Payouts**: X tournaments, Total: ₹Y
- **Pending Remaining 65% Payouts**: X tournaments, Total: ₹Y
- **Total Pending Amount**: ₹Z

#### Step 3: Filter Payouts
Use filter tabs:
- **All Pending**: Shows all pending payouts
- **Pending First 30%**: Shows only first payments
- **Pending Remaining 65%**: Shows only second payments

#### Step 4: View Tournament Details (Compact)
Each tournament shows:
- Tournament name
- Organizer name
- Location
- Status
- Total collected
- Amount to pay
- Status badges (1st 30% / Rem 65%)

#### Step 5: Expand to See Full Details
Click on tournament to expand and see:

**Organizer Details**:
- Name
- Email
- Phone
- **Organizer's QR Code** (the one they uploaded!)
- UPI ID

**Payment Breakdown**:
- Total collected
- Platform fee (5%)
- Organizer share (95%)

**Payout Actions**:
- First 30% section with amount and "Mark as Paid" button
- Remaining 65% section with amount and "Mark as Paid" button

#### Step 6: Pay Organizer

**For First 30% (Before Tournament)**:
1. Expand tournament details
2. See organizer's QR code
3. Open your UPI app
4. Scan organizer's QR code
5. Pay the First 30% amount (e.g., ₹3,000)
6. Complete payment in UPI app
7. Return to Matchify.pro
8. Click "Mark as Paid" button
9. Add notes (optional): "Paid via UPI, Txn ID: XXXXXX"
10. Confirm

**What happens**:
- First 30% status changes to PAID
- Paid date recorded
- Organizer receives notification
- Amount no longer shows in pending

**For Remaining 65% (After Tournament)**:
1. Wait for tournament to complete
2. Go to Organizer Payouts page
3. Expand tournament details
4. See organizer's QR code
5. Open your UPI app
6. Scan organizer's QR code
7. Pay the Remaining 65% amount (e.g., ₹6,500)
8. Complete payment in UPI app
9. Return to Matchify.pro
10. Click "Mark as Paid" button for Remaining 65%
11. Add notes (optional)
12. Confirm

**What happens**:
- Remaining 65% status changes to PAID
- Paid date recorded
- Organizer receives notification
- Tournament fully settled

**Database Updates**:
```javascript
// For First 30%
payout50Status1: 'paid'
payout50PaidAt1: current_timestamp
payout50PaidBy1: admin_id
payout50Notes1: "Paid via UPI, Txn ID: XXXXXX"

// For Remaining 65%
payout50Status2: 'paid'
payout50PaidAt2: current_timestamp
payout50PaidBy2: admin_id
payout50Notes2: "Paid via UPI, Txn ID: XXXXXX"
```

---

## 7. Complete Flow Diagram

### Visual Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    PAYMENT SYSTEM FLOW                       │
└─────────────────────────────────────────────────────────────┘

1. SETUP PHASE
   ┌──────────────┐
   │ Admin Setup  │
   │ QR Settings  │
   └──────┬───────┘
          │
          ▼
   ┌──────────────────┐
   │ Admin QR Code    │
   │ 9742628582@slc   │
   │ P S Lochan       │
   └──────────────────┘

2. TOURNAMENT CREATION
   ┌──────────────────┐
   │ Organizer        │
   │ Creates          │
   │ Tournament       │
   └──────┬───────────┘
          │
          ▼
   ┌──────────────────┐
   │ Uploads Own      │
   │ QR Code          │
   │ (for payouts)    │
   └──────────────────┘

3. PLAYER REGISTRATION
   ┌──────────────────┐
   │ Player Selects   │
   │ Tournament       │
   └──────┬───────────┘
          │
          ▼
   ┌──────────────────┐
   │ Sees ADMIN's     │
   │ QR Code          │
   │ (not organizer)  │
   └──────┬───────────┘
          │
          ▼
   ┌──────────────────┐
   │ Pays to Admin    │
   │ via UPI          │
   │ ₹500 (example)   │
   └──────┬───────────┘
          │
          ▼
   ┌──────────────────┐
   │ Uploads Payment  │
   │ Screenshot       │
   └──────┬───────────┘
          │
          ▼
   ┌──────────────────┐
   │ Registration     │
   │ Status: PENDING  │
   └──────────────────┘

4. PAYMENT APPROVAL
   ┌──────────────────┐
   │ Admin Reviews    │
   │ Screenshot       │
   └──────┬───────────┘
          │
          ▼
   ┌──────────────────┐
   │ Admin Approves   │
   └──────┬───────────┘
          │
          ├─────────────────────────────┐
          │                             │
          ▼                             ▼
   ┌──────────────────┐      ┌──────────────────┐
   │ Player Confirmed │      │ Organizer        │
   │ Notification     │      │ Notified         │
   └──────────────────┘      └──────────────────┘
          │
          ▼
   ┌──────────────────────────────────────────┐
   │ TournamentPayment Record Updated         │
   │                                          │
   │ Total Collected: ₹500                    │
   │ Platform Fee (5%): ₹25 (you keep)       │
   │ First 30%: ₹150 (pending)                │
   │ Remaining 65%: ₹325 (pending)            │
   └──────────────────────────────────────────┘

5. PAYMENT TRACKING
   ┌──────────────────┐
   │ Tournament       │
   │ Payments Page    │
   └──────┬───────────┘
          │
          ▼
   ┌──────────────────────────────────────────┐
   │ Shows all tournaments with breakdown     │
   │ - Total collected                        │
   │ - Platform fees (yours)                  │
   │ - Pending payouts                        │
   └──────────────────────────────────────────┘

6. ORGANIZER PAYOUTS
   
   BEFORE TOURNAMENT:
   ┌──────────────────┐
   │ Admin goes to    │
   │ Organizer        │
   │ Payouts Page     │
   └──────┬───────────┘
          │
          ▼
   ┌──────────────────┐
   │ Sees Organizer's │
   │ QR Code          │
   └──────┬───────────┘
          │
          ▼
   ┌──────────────────┐
   │ Pays First 30%   │
   │ ₹150 to          │
   │ Organizer        │
   └──────┬───────────┘
          │
          ▼
   ┌──────────────────┐
   │ Marks as Paid    │
   │ in System        │
   └──────┬───────────┘
          │
          ▼
   ┌──────────────────┐
   │ Organizer        │
   │ Notified         │
   └──────────────────┘

   AFTER TOURNAMENT:
   ┌──────────────────┐
   │ Tournament       │
   │ Completes        │
   └──────┬───────────┘
          │
          ▼
   ┌──────────────────┐
   │ Admin goes to    │
   │ Organizer        │
   │ Payouts Page     │
   └──────┬───────────┘
          │
          ▼
   ┌──────────────────┐
   │ Sees Organizer's │
   │ QR Code          │
   └──────┬───────────┘
          │
          ▼
   ┌──────────────────┐
   │ Pays Remaining   │
   │ 65% = ₹325 to    │
   │ Organizer        │
   └──────┬───────────┘
          │
          ▼
   ┌──────────────────┐
   │ Marks as Paid    │
   │ in System        │
   └──────┬───────────┘
          │
          ▼
   ┌──────────────────┐
   │ Organizer        │
   │ Notified         │
   └──────────────────┘
          │
          ▼
   ┌──────────────────┐
   │ Tournament       │
   │ Fully Settled    │
   └──────────────────┘

7. YOUR EARNINGS
   ┌──────────────────────────────────────────┐
   │ Platform Fee (5%) stays with you         │
   │ Automatically calculated                 │
   │ No action needed                         │
   │                                          │
   │ Example: ₹500 collected                  │
   │ You keep: ₹25 (5%)                       │
   └──────────────────────────────────────────┘
```

---

## 💰 Money Flow Example

### Scenario: 10 Players Register for Tournament

**Entry Fee**: ₹500 per player
**Total Players**: 10
**Total Collected**: ₹5,000

### Step-by-Step Money Flow:

#### 1. Players Pay You
- Player 1 pays ₹500 → Your account
- Player 2 pays ₹500 → Your account
- Player 3 pays ₹500 → Your account
- ... (all 10 players)
- **Total in your account**: ₹5,000

#### 2. You Approve Payments
- Approve all 10 payments
- System calculates:
  ```
  Total Collected: ₹5,000
  Platform Fee (5%): ₹250 (you keep)
  First 30%: ₹1,500 (pay to organizer)
  Remaining 65%: ₹3,250 (pay to organizer)
  ```

#### 3. Before Tournament Starts
- You pay organizer: ₹1,500 (First 30%)
- **Your balance**: ₹5,000 - ₹1,500 = ₹3,500

#### 4. After Tournament Completes
- You pay organizer: ₹3,250 (Remaining 65%)
- **Your balance**: ₹3,500 - ₹3,250 = ₹250

#### 5. Final Result
- **You keep**: ₹250 (5% platform fee)
- **Organizer received**: ₹4,750 (₹1,500 + ₹3,250)
- **Total**: ₹250 + ₹4,750 = ₹5,000 ✅

---

## 🔐 Security Features

### Why Players Pay Admin First

1. **Trust**: Players trust the platform more than individual organizers
2. **Security**: Centralized payment verification
3. **Dispute Resolution**: Admin can mediate if issues arise
4. **Fraud Prevention**: Admin verifies all payments before confirming
5. **Refund Management**: Easier to process refunds if needed

### Payment Verification Process

1. **Screenshot Upload**: Player must provide proof
2. **Manual Review**: Admin verifies each payment
3. **Approval Required**: No auto-approval
4. **Rejection Option**: Can reject suspicious payments
5. **Notification System**: All parties notified of status changes

---

## 📊 Reports and Analytics

### What You Can Track

1. **Total Revenue**: All money collected across all tournaments
2. **Platform Fees**: Your 5% earnings
3. **Pending Payouts**: Money you need to pay organizers
4. **Paid Payouts**: Money already paid to organizers
5. **Balance in Hand**: Money currently with you

### Revenue Analytics Page

Access: Admin Dashboard → Revenue Analytics

Shows:
- Total collected amount
- Platform fees earned
- Total paid to organizers
- Balance in hand
- Revenue by tournament
- Revenue by organizer
- Revenue timeline

---

## ❓ Common Scenarios

### Scenario 1: Player Pays Wrong Amount

**Problem**: Player pays ₹400 instead of ₹500

**Solution**:
1. Admin sees screenshot showing ₹400
2. Admin rejects payment with reason: "Incorrect amount. Please pay ₹500"
3. Player receives notification
4. Player pays correct amount
5. Player uploads new screenshot
6. Admin approves

### Scenario 2: Tournament Gets Cancelled

**Problem**: Tournament cancelled, need to refund players

**Solution**:
1. Admin has all player payment details
2. Admin can refund each player manually via UPI
3. Mark registrations as cancelled
4. No payment to organizer needed

### Scenario 3: Organizer Disputes Amount

**Problem**: Organizer says they should receive more

**Solution**:
1. Admin shows Tournament Payments page
2. Shows exact calculation:
   - Total collected
   - Platform fee (5%)
   - First 30% and Remaining 65%
3. All transparent and documented

### Scenario 4: Multiple Tournaments Same Day

**Problem**: 5 tournaments on same day, need to track separately

**Solution**:
- Each tournament has separate TournamentPayment record
- Tournament Payments page shows all separately
- Can filter and sort by tournament
- Each organizer paid separately

---

## 🎯 Best Practices

### For Admins

1. **Review payments daily**: Don't let them pile up
2. **Verify screenshots carefully**: Check amount, date, time
3. **Pay organizers on time**: 
   - First 30% before tournament
   - Remaining 65% within 2-3 days after tournament
4. **Keep records**: Add notes when marking payouts as paid
5. **Communicate**: Notify organizers about payment status

### For Organizers

1. **Upload clear QR code**: Make sure it's scannable
2. **Provide correct UPI ID**: Double-check before submitting
3. **Monitor registrations**: Check who registered
4. **Wait for confirmation**: Don't start tournament until payments confirmed
5. **Confirm receipt**: Acknowledge when you receive payouts

### For Players

1. **Pay exact amount**: Match the entry fee shown
2. **Take clear screenshot**: Include amount, date, time, transaction ID
3. **Upload immediately**: Don't wait days
4. **Check confirmation**: Wait for approval notification
5. **Contact admin if issues**: Use support if payment not approved

---

## 🔧 Technical Details

### Database Tables Involved

1. **User**: Stores admin, organizer, player accounts
2. **Tournament**: Stores tournament details and organizer's QR code
3. **Registration**: Stores player registrations
4. **PaymentVerification**: Stores payment screenshots and approval status
5. **TournamentPayment**: Stores payment tracking per tournament
6. **Notification**: Stores all notifications

### API Endpoints

**Payment Verification**:
- `GET /api/admin/payment-verifications` - List pending payments
- `POST /api/admin/payment-verifications/:id/approve` - Approve payment
- `POST /api/admin/payment-verifications/:id/reject` - Reject payment

**Tournament Payments**:
- `GET /api/admin/tournament-payments` - List all tournament payments
- `GET /api/admin/tournament-payments/stats/overview` - Get stats
- `GET /api/admin/tournament-payments/pending/payouts` - Get pending payouts

**Organizer Payouts**:
- `POST /api/admin/tournament-payments/:id/payout-50-1/mark-paid` - Mark first 30% paid
- `POST /api/admin/tournament-payments/:id/payout-50-2/mark-paid` - Mark remaining 65% paid

---

## 📱 Mobile Experience

All pages are mobile-responsive:
- Players can register from mobile
- Upload screenshots from phone gallery
- Admin can approve payments from mobile
- View organizer QR codes on mobile
- Make UPI payments directly from phone

---

## ✅ Summary

### The Complete Cycle

1. **Setup**: Admin uploads QR code once
2. **Create**: Organizer creates tournament with their QR code
3. **Register**: Players pay admin and upload screenshot
4. **Approve**: Admin verifies and approves payments
5. **Track**: System calculates 30%, 65%, 5% automatically
6. **Pay 1**: Admin pays organizer 30% before tournament
7. **Tournament**: Tournament happens
8. **Pay 2**: Admin pays organizer 65% after tournament
9. **Keep**: Admin keeps 5% platform fee
10. **Repeat**: Process repeats for every tournament

### Key Points

✅ All player payments go to admin first
✅ Admin verifies every payment manually
✅ System calculates splits automatically (30% + 65% + 5%)
✅ Admin pays organizers using their QR codes
✅ Admin keeps 5% as platform fee
✅ Everything is tracked and transparent
✅ Notifications keep everyone informed

---

**Last Updated**: January 20, 2026
**System Version**: 30% + 65% + 5% Split
**Status**: ✅ Fully Operational
