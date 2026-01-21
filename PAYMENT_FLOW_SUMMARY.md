# Matchify.pro Payment Flow - Complete Summary

## 🎯 Overview
All payments go through **ADMIN (P S Lochan)** - NOT organizers. This prevents scams and ensures fair distribution.

---

## 💰 Payment Details

### Admin Payment Information
- **UPI ID**: `9742628582@sbi`
- **Account Holder**: `P S Lochan`
- **QR Code**: Managed in Admin Dashboard → QR Settings

### Payment Split (Per Tournament)
- **Players pay**: 100% to Admin
- **Admin keeps**: 5% platform fee
- **Organizer gets**: 95% total
  - **First 50%** (47.5% of total): Paid BEFORE tournament starts
  - **Second 50%** (47.5% of total): Paid AFTER tournament completes

---

## 📋 Complete Flow

### 1️⃣ Player Registration
1. Player selects tournament and categories
2. System shows **ADMIN's QR code** (9742628582@sbi, P S Lochan)
3. Player scans QR and pays to admin
4. Player uploads payment screenshot
5. Registration created with status: `pending`

### 2️⃣ Admin Payment Verification
1. Admin gets notification: "New Registration - Payment Verification Required"
2. Admin goes to **Payment Verification** page
3. Admin sees:
   - Player name, email, phone
   - Tournament name and category
   - Payment amount
   - Payment screenshot
4. Admin clicks **Approve** or **Reject**
5. If approved:
   - Registration status → `confirmed`
   - Player gets notification: "Payment Approved"
   - Tournament payment tracking updated

### 3️⃣ Tournament Payment Tracking
When payments are approved, system tracks:
- **Total Collected**: Sum of all approved payments
- **Platform Fee (5%)**: Admin's earnings
- **Organizer Share (95%)**: Total for organizer
- **First Payout (50%)**: 47.5% of total - Paid before tournament
- **Second Payout (50%)**: 47.5% of total - Paid after tournament

### 4️⃣ Organizer Payouts
**Before Tournament Starts:**
- Admin goes to **Organizer Payouts** page
- Sees pending first payouts (50%)
- Pays organizer via their UPI
- Marks as "Paid" in system

**After Tournament Completes:**
- Admin goes to **Organizer Payouts** page
- Sees pending second payouts (50%)
- Pays organizer remaining amount
- Marks as "Paid" in system

---

## 🔒 Security Features

### Why Admin Handles All Payments?
1. **Prevents Scams**: Organizers can't run away with money
2. **Fair Distribution**: Admin ensures organizers get paid
3. **Platform Fee**: Admin earns 5% for managing platform
4. **Dispute Resolution**: Admin can refund players if needed

### Organizer Cannot:
- ❌ See player payment screenshots
- ❌ Approve/reject payments
- ❌ Access payment verification
- ❌ Collect money directly from players

### Only Admin Can:
- ✅ Verify all payments
- ✅ Approve/reject registrations
- ✅ Pay organizers
- ✅ Keep 5% platform fee
- ✅ Issue refunds if needed

---

## 📊 Admin Pages

### 1. Payment Verification (`/admin/payment-verifications`)
- View all pending payment screenshots
- See player and tournament details
- Approve or reject payments
- Stats: Pending, Approved, Rejected, Total Collected

### 2. Organizer Payouts (`/admin/organizer-payouts`)
- View all tournaments needing payouts
- See first 50% (before tournament)
- See second 50% (after tournament)
- Mark payouts as paid

### 3. Revenue Dashboard (`/admin/revenue`)
- Total revenue collected
- Platform fees earned (5%)
- Organizer shares paid
- Revenue by tournament
- Revenue by location

### 4. QR Settings (`/admin/qr-settings`)
- Upload admin's QR code
- Set UPI ID: 9742628582@sbi
- Set account holder: P S Lochan
- This QR is shown to ALL players

---

## 🎮 Example Scenario

### Tournament: "Bangalore Open 2026"
- Entry fee: ₹500 per player
- 100 players register
- **Total collected**: ₹50,000

### Payment Breakdown:
- **Platform Fee (5%)**: ₹2,500 (Admin keeps)
- **Organizer Share (95%)**: ₹47,500
  - **First Payout (50%)**: ₹23,750 (Before tournament)
  - **Second Payout (50%)**: ₹23,750 (After tournament)

### Timeline:
1. **Day 1-7**: Players register and pay to admin
2. **Day 8**: Admin verifies all payments
3. **Day 9**: Admin pays organizer ₹23,750 (first 50%)
4. **Day 10**: Tournament starts
5. **Day 12**: Tournament ends
6. **Day 13**: Admin pays organizer ₹23,750 (second 50%)
7. **Admin keeps**: ₹2,500 platform fee

---

## ✅ Current Implementation Status

### ✅ Completed Features:
1. Admin QR code system
2. Player payment with screenshot upload
3. Admin payment verification page
4. Notification system for new payments
5. Tournament payment tracking (50/50 split)
6. Platform fee calculation (5%)
7. Organizer payout tracking
8. Revenue analytics

### 📝 Notes:
- All payments go to admin (9742628582@sbi, P S Lochan)
- Organizers never see player payment details
- Admin has full control over payment flow
- System automatically calculates splits
- Audit logs track all payment actions

---

## 🔧 Configuration

### Admin QR Code Setup:
1. Login as admin
2. Go to Admin Dashboard
3. Click "QR Settings"
4. Upload QR code for 9742628582@sbi
5. Enter UPI ID: `9742628582@sbi`
6. Enter Name: `P S Lochan`
7. Save settings

### This QR code will be shown to:
- ✅ All players during registration
- ✅ All tournaments (regardless of organizer)
- ✅ Payment summary page
- ✅ Registration confirmation

---

## 📱 Player Experience

When registering for a tournament, players see:

```
Payment Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Category: Men's Singles
Amount: ₹500
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Amount: ₹500

[QR CODE IMAGE]

P S Lochan
UPI: 9742628582@sbi

💡 Pay ₹500 using any UPI app

🔒 Secure Payment: All payments go to 
Matchify.pro. Admin will pay organizer 
after verification.

How to Pay:
1. Scan the QR code with any UPI app
2. Pay ₹500 to Matchify.pro
3. Take a screenshot of the payment
4. Click "Complete Registration" below
5. Admin will verify your payment
```

---

## 🎯 Summary

**The system is designed so that:**
1. Players ALWAYS pay to admin (never to organizer)
2. Admin verifies ALL payments
3. Admin pays organizers in 2 installments (50% + 50%)
4. Admin keeps 5% platform fee
5. Organizers cannot access payment verification
6. Complete transparency and audit trail

This prevents scams and ensures fair payment distribution! 🎉
