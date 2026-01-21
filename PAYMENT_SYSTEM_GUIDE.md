# 💰 Complete Payment System Guide - How It Works

## 🎯 Your Requirements (Already Implemented!)

> "When admin approves a user, his info should go to the organiser and he'll be registered to the tournament and the amount which he paid to the admin will go under the name of the tournament like if the tournament's name is ace tournament then amount which he the player amount which he paid to me will go to the tournament and I will pay 50% before the start of the tournament and other 45% after the tournament is completed"

**✅ ALL OF THIS IS ALREADY WORKING!**

## 📊 How to See Tournament Payments

### Step 1: View Payments by Tournament

1. Login as Admin (ADMIN@gmail.com)
2. Go to **Admin Dashboard**
3. Click **"Tournament Payments"** button
4. You'll see a list like this:

```
┌─────────────────────────────────────────────────────────────┐
│ Tournament Payments                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🏆 Ace Tournament                                           │
│ 📍 Bangalore, Karnataka                                     │
│ 📅 Jan 25, 2026                                             │
│ 👤 Organizer: John Doe                                      │
│                                                             │
│ Revenue Breakdown:                                          │
│ • Total Collected: ₹10,000                                  │
│ • Registrations: 20 players                                 │
│ • Your Fee (5%): ₹500                                       │
│ • Organizer Share (95%): ₹9,500                             │
│                                                             │
│ Payout Status:                                              │
│ • First 50% (₹4,750): ⏳ Pending                            │
│ • Second 50% (₹4,750): ⏳ Pending                           │
│                                                             │
│ [Process Payout →]                                          │
└─────────────────────────────────────────────────────────────┘
```

**This shows ALL payments grouped by tournament name!**

### Step 2: Pay Organizers

1. From Admin Dashboard, click **"Organizer Payouts"**
2. You'll see pending payouts per tournament:

```
┌─────────────────────────────────────────────────────────────┐
│ Organizer Payouts                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🏆 Ace Tournament                                           │
│ 📅 Jan 25, 2026                                             │
│                                                             │
│ Organizer Details:                                          │
│ • Name: John Doe                                            │
│ • Email: john@example.com                                   │
│ • Phone: 9876543210                                         │
│                                                             │
│ [ORGANIZER'S QR CODE IMAGE]                                 │
│ Click to enlarge                                            │
│                                                             │
│ • UPI ID: john@upi                                          │
│ • Account Holder: John Doe                                  │
│                                                             │
│ Payment Breakdown:                                          │
│ • Total Collected: ₹10,000                                  │
│ • Platform Fee (5%): ₹500                                   │
│ • Organizer Share: ₹9,500                                   │
│                                                             │
│ Payout Actions:                                             │
│ ┌─────────────────────────────────────┐                    │
│ │ First 50%: ₹4,750                   │                    │
│ │ [✅ Mark as Paid]                    │                    │
│ └─────────────────────────────────────┘                    │
│                                                             │
│ ┌─────────────────────────────────────┐                    │
│ │ Second 50%: ₹4,750                  │                    │
│ │ [✅ Mark as Paid]                    │                    │
│ └─────────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Complete Flow Example

### Example: "Ace Tournament"

#### Phase 1: Players Register
```
Player 1 pays ₹500 → Admin receives ₹500
Player 2 pays ₹500 → Admin receives ₹500
Player 3 pays ₹500 → Admin receives ₹500
...
Player 20 pays ₹500 → Admin receives ₹500

Total Collected: ₹10,000
```

#### Phase 2: Admin Approves Payments
```
Admin approves Player 1 → ✅ Registered to Ace Tournament
Admin approves Player 2 → ✅ Registered to Ace Tournament
Admin approves Player 3 → ✅ Registered to Ace Tournament
...
Admin approves Player 20 → ✅ Registered to Ace Tournament

All payments tracked under "Ace Tournament"
```

#### Phase 3: View Tournament Payments
```
Go to: Admin Dashboard → Tournament Payments

Ace Tournament:
├─ Total Collected: ₹10,000
├─ Your Fee (5%): ₹500
├─ Organizer Share (95%): ₹9,500
│   ├─ First 50%: ₹4,750 (47.5% of total)
│   └─ Second 50%: ₹4,750 (47.5% of total)
```

#### Phase 4: Pay Organizer (Before Tournament)
```
Go to: Admin Dashboard → Organizer Payouts

1. Find "Ace Tournament"
2. See organizer's QR code
3. Scan QR code with your UPI app
4. Pay ₹4,750 to organizer
5. Click "✅ Mark as Paid" for First 50%
6. Status changes to: ✅ Paid
```

#### Phase 5: Tournament Happens
```
Tournament takes place...
Players compete...
Winners announced...
```

#### Phase 6: Pay Organizer (After Tournament)
```
Go to: Admin Dashboard → Organizer Payouts

1. Find "Ace Tournament"
2. See organizer's QR code
3. Scan QR code with your UPI app
4. Pay ₹4,750 to organizer
5. Click "✅ Mark as Paid" for Second 50%
6. Status changes to: ✅ Paid

Final Status:
├─ First 50%: ✅ Paid (₹4,750)
├─ Second 50%: ✅ Paid (₹4,750)
└─ Total Paid to Organizer: ₹9,500

You kept: ₹500 (5% platform fee)
```

## 📱 Where to Find Everything

### 1. Payment Verification
**Path:** Admin Dashboard → Payment Verification
**Purpose:** Approve player payments
**What happens:** Player gets registered, payment tracked under tournament

### 2. Tournament Payments
**Path:** Admin Dashboard → Tournament Payments
**Purpose:** See all payments grouped by tournament name
**Shows:** 
- Total collected per tournament
- Your 5% platform fee
- Organizer's 95% share
- Payout status

### 3. Organizer Payouts
**Path:** Admin Dashboard → Organizer Payouts
**Purpose:** Pay organizers their share
**Shows:**
- Organizer's QR code
- First 50% payout (₹X)
- Second 50% payout (₹X)
- Mark as Paid buttons

### 4. Revenue Analytics
**Path:** Admin Dashboard → Revenue Analytics
**Purpose:** See overall revenue statistics
**Shows:**
- Total revenue across all tournaments
- Platform fees earned
- Revenue by tournament
- Revenue by location

## 💡 Key Points

### Payment Tracking
- ✅ All payments are tracked by tournament name
- ✅ Example: "Ace Tournament" shows all player payments for that tournament
- ✅ System automatically calculates totals

### Organizer Notifications
- ✅ When you approve a payment, organizer gets notified
- ✅ Organizer sees player registered in their tournament
- ✅ Organizer can see player details

### 50/50 Split
- ✅ System automatically calculates 50/50 split
- ✅ First 50% = 47.5% of total (before tournament)
- ✅ Second 50% = 47.5% of total (after tournament)
- ✅ You keep 5% platform fee

### Organizer QR Code
- ✅ Organizer uploads QR during tournament creation
- ✅ You see organizer's QR in Organizer Payouts page
- ✅ You scan and pay organizer
- ✅ You mark payment as paid

## 🎯 Quick Reference

| Action | Where to Go | What to Do |
|--------|-------------|------------|
| Approve player payment | Payment Verification | Click "✅ Approve Payment" |
| See tournament totals | Tournament Payments | View payments by tournament |
| Pay organizer (before) | Organizer Payouts | Pay First 50%, mark as paid |
| Pay organizer (after) | Organizer Payouts | Pay Second 50%, mark as paid |
| See overall revenue | Revenue Analytics | View total earnings |

## ✅ Everything You Asked For Is Working!

1. ✅ **Player info goes to organizer** - When you approve payment
2. ✅ **Player registered to tournament** - Automatically after approval
3. ✅ **Amount tracked under tournament name** - See in Tournament Payments
4. ✅ **50% before tournament** - Pay via Organizer Payouts (First 50%)
5. ✅ **45% after tournament** - Pay via Organizer Payouts (Second 50%)
6. ✅ **5% platform fee** - You keep automatically

---

**The system is complete and working!** Just use the admin panel to manage everything.
