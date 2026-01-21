# 🚫 What Happens When You Reject a Payment

## Scenario: Player Pays Wrong Amount

### Example Situation
- **Entry Fee Required**: ₹100
- **Player Actually Paid**: ₹80
- **Problem**: Player paid less than required

---

## Step-by-Step: What Happens When You Reject

### 1. Player Submits Registration

**What Player Did**:
- Selected tournament
- Saw entry fee: ₹100
- Paid only ₹80 to your UPI
- Took screenshot showing ₹80
- Uploaded screenshot
- Submitted registration

**Database Status**:
```
Registration:
  status: 'PENDING'
  paymentStatus: 'pending'

PaymentVerification:
  status: 'pending'
  amount: ₹100 (expected)
  screenshotUrl: [player's screenshot]
```

---

### 2. You Review the Payment

**What You See** (Admin → Payment Verification):
- Player name: "John Doe"
- Tournament: "ACE BADMINTON"
- Category: "Men's Singles"
- **Expected Amount**: ₹100
- **Screenshot**: Shows ₹80 payment
- Status: Pending

**You Notice**: Player paid ₹80 instead of ₹100 ❌

---

### 3. You Reject the Payment

**Your Actions**:
1. Click "Reject" button
2. Enter rejection reason: "Incorrect amount. You paid ₹80 but entry fee is ₹100. Please pay the correct amount."
3. Click "Confirm Rejection"

---

### 4. What Happens Automatically

#### A. Payment Verification Updated
```javascript
PaymentVerification:
  status: 'rejected' ← Changed from 'pending'
  verifiedBy: 'admin' ← Your admin ID
  verifiedAt: '2026-01-20 14:30:00' ← Current timestamp
  rejectionReason: 'Incorrect amount. You paid ₹80 but entry fee is ₹100. Please pay the correct amount.'
```

#### B. Registration Cancelled
```javascript
Registration:
  status: 'cancelled' ← Changed from 'PENDING'
  paymentStatus: 'rejected' ← Changed from 'pending'
```

**Important**: The registration is CANCELLED, not just pending!

#### C. Player Receives Notification
```javascript
Notification sent to player:
  type: 'PAYMENT_REJECTED'
  title: 'Payment Rejected'
  message: 'Your payment was rejected. Reason: Incorrect amount. You paid ₹80 but entry fee is ₹100. Please pay the correct amount.'
```

Player sees this notification in their account.

#### D. NO Money Tracking
- **NO** TournamentPayment record created
- **NO** amount added to total collected
- **NO** calculation of 30%, 65%, 5%
- **NO** notification to organizer

**Why?** Because the payment was rejected, so it doesn't count as valid revenue.

---

## What Happens Next?

### Option 1: Player Re-registers (Recommended)

**Player's Actions**:
1. Player sees rejection notification
2. Player reads reason: "Incorrect amount. You paid ₹80 but entry fee is ₹100"
3. Player goes back to tournament page
4. Player clicks "Register" again
5. Player pays correct amount (₹100) this time
6. Player uploads new screenshot showing ₹100
7. Player submits new registration

**Result**: 
- New registration created (separate from cancelled one)
- New payment verification created
- You review and approve the new one
- Player gets confirmed

### Option 2: Player Contacts You

**Player's Actions**:
1. Player sees rejection
2. Player contacts admin/support
3. Explains the situation
4. You guide them to re-register with correct amount

### Option 3: Player Doesn't Re-register

**Result**:
- Registration remains cancelled
- Player is NOT registered for tournament
- Player is NOT in the tournament
- No further action needed from you

---

## Important Points

### ❌ What Does NOT Happen When You Reject

1. **NO refund needed** - Player paid to your account, but you're not tracking it in the system
2. **NO organizer notification** - Organizer never knows about this failed registration
3. **NO tournament payment tracking** - The ₹80 is not counted in tournament revenue
4. **NO payout calculations** - No 30%, 65%, 5% calculated
5. **Player NOT in tournament** - Registration is cancelled

### ✅ What DOES Happen When You Reject

1. **Registration cancelled** - Player's registration status becomes "cancelled"
2. **Payment marked rejected** - Payment verification status becomes "rejected"
3. **Player notified** - Player receives notification with your rejection reason
4. **Reason saved** - Your rejection reason is saved in database
5. **Audit trail** - System records who rejected (you) and when

---

## Real-World Scenarios

### Scenario 1: Wrong Amount (Your Example)

**Situation**: Entry fee ₹100, player paid ₹80

**Your Action**: 
- Reject with reason: "Incorrect amount. Entry fee is ₹100, you paid ₹80. Please re-register and pay ₹100."

**Result**:
- Registration cancelled
- Player sees notification
- Player can re-register with correct amount
- The ₹80 they paid stays in your account (they paid you via UPI)
- You can manually refund the ₹80 if you want, or tell them to pay additional ₹20

### Scenario 2: Fake Screenshot

**Situation**: Player uploads fake/edited screenshot

**Your Action**:
- Reject with reason: "Invalid payment proof. Please provide genuine payment screenshot."

**Result**:
- Registration cancelled
- Player notified
- Player cannot participate unless they re-register with valid proof

### Scenario 3: Payment to Wrong Account

**Situation**: Player paid to organizer instead of admin

**Your Action**:
- Reject with reason: "Payment made to wrong account. Please pay to admin account (9742628582@slc) and re-register."

**Result**:
- Registration cancelled
- Player needs to pay to correct account (yours)
- Player re-registers with correct payment proof

### Scenario 4: Duplicate Registration

**Situation**: Player registered twice by mistake

**Your Action**:
- Approve one registration
- Reject duplicate with reason: "Duplicate registration. Your first registration has been approved."

**Result**:
- One registration confirmed
- Duplicate cancelled
- Player only registered once

### Scenario 5: Tournament Full

**Situation**: Tournament reached maximum participants

**Your Action**:
- Reject with reason: "Tournament is full. Maximum participants reached. Registration closed."

**Result**:
- Registration cancelled
- Player notified tournament is full
- You can manually refund if player already paid

---

## The Money Question

### "What about the ₹80 the player paid?"

**Important**: When player pays via UPI to your account, the money goes directly to your bank account. The system doesn't control your bank account.

**Options**:

#### Option A: Keep it and ask for balance
- Player paid ₹80
- You reject and tell them to pay additional ₹20
- Player pays ₹20 more
- Total: ₹100 received
- Player re-registers with proof of ₹20 payment
- You approve

#### Option B: Refund and ask for full payment
- Player paid ₹80
- You reject
- You manually refund ₹80 via UPI to player
- Player pays ₹100 (full amount)
- Player re-registers with new proof
- You approve

#### Option C: Keep it (if player doesn't re-register)
- Player paid ₹80
- You reject
- Player doesn't re-register
- ₹80 stays in your account
- Player is not registered for tournament

**Recommendation**: Option A is easiest - ask player to pay the difference (₹20) and re-register.

---

## Technical Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│              PAYMENT REJECTION FLOW                          │
└─────────────────────────────────────────────────────────────┘

1. PLAYER SUBMITS
   ┌──────────────────┐
   │ Player pays ₹80  │
   │ (should be ₹100) │
   └────────┬─────────┘
            │
            ▼
   ┌──────────────────┐
   │ Uploads          │
   │ screenshot       │
   └────────┬─────────┘
            │
            ▼
   ┌──────────────────┐
   │ Registration     │
   │ Status: PENDING  │
   └──────────────────┘

2. ADMIN REVIEWS
   ┌──────────────────┐
   │ Admin sees       │
   │ screenshot       │
   │ shows ₹80        │
   └────────┬─────────┘
            │
            ▼
   ┌──────────────────┐
   │ Admin notices    │
   │ wrong amount     │
   └────────┬─────────┘
            │
            ▼
   ┌──────────────────┐
   │ Admin clicks     │
   │ "Reject"         │
   └────────┬─────────┘
            │
            ▼
   ┌──────────────────┐
   │ Enters reason:   │
   │ "Wrong amount"   │
   └────────┬─────────┘
            │
            ▼
   ┌──────────────────┐
   │ Confirms         │
   │ rejection        │
   └────────┬─────────┘

3. SYSTEM UPDATES
            │
            ├─────────────────────────────┐
            │                             │
            ▼                             ▼
   ┌──────────────────┐      ┌──────────────────┐
   │ PaymentVerif     │      │ Registration     │
   │ status:          │      │ status:          │
   │ 'rejected'       │      │ 'cancelled'      │
   └──────────────────┘      └──────────────────┘
            │
            ▼
   ┌──────────────────┐
   │ Notification     │
   │ sent to player   │
   └────────┬─────────┘

4. PLAYER SEES
            │
            ▼
   ┌──────────────────┐
   │ Player receives  │
   │ notification:    │
   │ "Payment         │
   │ Rejected"        │
   └────────┬─────────┘
            │
            ▼
   ┌──────────────────┐
   │ Player reads     │
   │ reason:          │
   │ "Wrong amount"   │
   └────────┬─────────┘

5. PLAYER OPTIONS
            │
            ├─────────────────┬─────────────────┐
            │                 │                 │
            ▼                 ▼                 ▼
   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
   │ Re-register  │  │ Contact      │  │ Give up      │
   │ with ₹100    │  │ admin        │  │ (not         │
   │              │  │              │  │ registered)  │
   └──────────────┘  └──────────────┘  └──────────────┘
```

---

## Summary

### When You Reject a Payment:

✅ **Registration is CANCELLED** - Player is not registered
✅ **Player is NOTIFIED** - They see your rejection reason
✅ **NO money tracking** - Not counted in tournament revenue
✅ **NO organizer notification** - Organizer doesn't know
✅ **NO payout calculations** - No 30%, 65%, 5% calculated
✅ **Player can re-register** - They can try again with correct payment

### The ₹80 in Your Account:

- Money is in YOUR bank account (via UPI)
- System doesn't track rejected payments
- You decide: refund, keep, or ask for balance
- Recommended: Ask player to pay ₹20 more and re-register

### Key Point:

**Rejection = Complete Cancellation**

The registration is completely cancelled. It's as if the player never registered. They need to start over with a new registration if they want to participate.

---

**Last Updated**: January 20, 2026
**Status**: ✅ Complete Explanation
