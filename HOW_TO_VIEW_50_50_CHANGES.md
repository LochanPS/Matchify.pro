# How to View 50/50 Payment Split Changes

## ✅ Servers Are Running!

### Backend Server
- **URL**: http://localhost:5000
- **Status**: ✅ Running
- **API Health**: http://localhost:5000/health

### Frontend Server  
- **URL**: http://localhost:5173
- **Status**: ✅ Running

## 🎯 How to See the Changes

### 1. Open Your Browser
Go to: **http://localhost:5173**

### 2. Login as Admin
- **Email**: `ADMIN@gmail.com`
- **Password**: `admin123`

### 3. Navigate to Admin Pages

Once logged in, you can access these admin pages to see the 50/50 split:

#### **A. Organizer Payouts Page**
**URL**: http://localhost:5173/admin/organizer-payouts

**What You'll See**:
- ✅ "Pending First 50% Payouts" card (instead of "Pending 40%")
- ✅ "Pending Second 50% Payouts" card (instead of "Pending 60%")
- ✅ Filter tabs: "All Pending", "Pending First 50%", "Pending Second 50%"
- ✅ Payout cards showing "First 50%" and "Second 50%"
- ✅ Buttons: "✅ Mark as Paid" for each 50% installment
- ✅ Modal: "Confirm First 50% Payout" or "Confirm Second 50% Payout"

#### **B. Tournament Payments Page**
**URL**: http://localhost:5173/admin/tournament-payments

**What You'll See**:
- ✅ Stats cards showing "Pending First 50% Payouts" and "Pending Second 50% Payouts"
- ✅ Each tournament shows payout status for "First 50%" and "Second 50%"
- ✅ Status badges: "✅ Paid" or "⏳ Pending" for each 50%
- ✅ "Process Payout →" button if any 50% is pending

#### **C. Revenue Dashboard**
**URL**: http://localhost:5173/admin/revenue

**What You'll See**:
- ✅ Your Platform Fees (5%) - highlighted in teal
- ✅ Total Collected
- ✅ Balance in Hand
- ✅ Pending Payouts (50/50 calculations)
- ✅ Money Flow Breakdown
- ✅ Platform Statistics
- ✅ Revenue Timeline

#### **D. Payment Verification**
**URL**: http://localhost:5173/admin/payment-verifications

**What You'll See**:
- Approve/reject payment screenshots
- (No changes here - this page handles individual payments)

#### **E. QR Settings**
**URL**: http://localhost:5173/admin/qr-settings

**What You'll See**:
- Current UPI: 9742628582@sbi
- Holder Name: P S Lochan
- QR Code image
- Update settings form

## 🎨 Visual Changes Summary

### OLD (40/60 Split):
- "Pending 40% Payouts"
- "Pending 60% Payouts"
- "40% Payout" / "60% Payout"
- "Confirm 40% Payout" / "Confirm 60% Payout"

### NEW (50/50 Split):
- "Pending First 50% Payouts" ✅
- "Pending Second 50% Payouts" ✅
- "First 50%" / "Second 50%" ✅
- "Confirm First 50% Payout" / "Confirm Second 50% Payout" ✅

## 📱 Color Coding

- **Yellow** = First 50% (pending)
- **Orange** = Second 50% (pending)
- **Green** = Paid (both installments)
- **Teal** = Platform fees (your earnings)

## 🔄 Payment Flow You'll See

1. **Player registers** → Payment screenshot uploaded
2. **Admin verifies** → Approve/reject in Payment Verification page
3. **Before tournament** → Admin pays "First 50%" in Organizer Payouts page
4. **After tournament** → Admin pays "Second 50%" in Organizer Payouts page
5. **Admin keeps** → 5% platform fee (shown in Revenue Dashboard)

## 🧪 How to Test

### Step 1: Create a Tournament
1. Login as admin (who also has ORGANIZER role)
2. Go to "Create Tournament"
3. Fill in details and create

### Step 2: Register as Player
1. Logout and register a new player account
2. Register for the tournament
3. Upload a payment screenshot (any image)

### Step 3: Verify Payment (As Admin)
1. Login as admin
2. Go to Payment Verification page
3. Approve the payment screenshot
4. Player registration will be confirmed

### Step 4: View in Admin Pages
1. Go to **Tournament Payments** page
   - See the tournament with "First 50%" and "Second 50%" status
2. Go to **Organizer Payouts** page
   - See pending "First 50%" payout
   - Click "Mark as Paid" to mark it paid
3. Go to **Revenue Dashboard**
   - See complete financial breakdown with 50/50 split

## 🎯 Key Pages to Check

1. ✅ **Organizer Payouts** - Main page showing 50/50 split
2. ✅ **Tournament Payments** - Revenue breakdown with 50/50
3. ✅ **Revenue Dashboard** - Complete financial overview

## 💡 Tips

- All amounts are calculated automatically
- Platform fee (5%) is always deducted first
- Remaining 95% is split 50/50 for organizer
- First 50% paid BEFORE tournament starts
- Second 50% paid AFTER tournament completes

## 🚀 Everything is Ready!

Open **http://localhost:5173** in your browser and login to see all the changes visually!

All the 50/50 split changes are live and working! 🎉
