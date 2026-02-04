# Tournament Registration Cancellation & Refund System - Complete Guide

## 📋 Overview

This is a **3-step refund system** where players can request cancellation, organizers review and approve, and then process the refund manually.

---

## 🔄 Complete Flow (Step by Step)

### **STEP 1: Player Requests Cancellation**

#### What Player Does:
1. Goes to "My Registrations" page
2. Finds the tournament they want to cancel
3. Clicks "Request Cancellation"
4. Fills out the cancellation form:
   - **Reason for Cancellation** (required, min 10 characters)
     - Example: "Health issues", "Schedule conflict", "Emergency", etc.
   - **UPI ID for Refund** (required)
     - Example: `yourname@paytm`, `9876543210@upi`, etc.
   - **Payment QR Code** (optional)
     - Player can upload their QR code to make refund faster
     - Organizer can scan and pay directly

#### What Happens in Backend:
```javascript
// Registration status changes
status: 'confirmed' → 'cancellation_requested'
refundStatus: null → 'pending'
refundAmount: ₹500 (original payment amount)
refundUpiId: 'player@upi'
refundQrCode: 'cloudinary_url' (if uploaded)
cancellationReason: 'Health issues'
refundRequestedAt: '2026-01-25 10:30:00'
```

#### Notifications Sent:
- ✅ **To Player**: "Cancellation request submitted. The organizer will review and process your refund."
- ✅ **To Organizer**: "John Doe has requested to cancel their registration for Bangalore Open (Men's Singles). Please review and process the refund."

---

### **STEP 2: Organizer Reviews Request**

#### How Organizer Gets Notified:
1. **Notification Bell** 🔔
   - Red badge appears with count
   - Notification says: "Cancellation Request Received"
   - Click to view details

2. **Tournament Management Page**
   - New tab appears: "Refund Requests"
   - Shows count of pending refund requests
   - Example: "Refund Requests (3)"

3. **Email Notification** (if configured)
   - Email sent to organizer
   - Subject: "Cancellation Request - [Tournament Name]"

#### What Organizer Sees:
```
Registration Details:
- Player Name: John Doe
- Category: Men's Singles
- Amount Paid: ₹500
- Payment Status: Completed

Cancellation Request:
- Reason: "Health issues - unable to participate"
- Requested On: Jan 25, 2026 10:30 AM
- Refund Amount: ₹500

Player's Refund Details:
- UPI ID: john@paytm
- QR Code: [Image displayed if uploaded]
```

#### Organizer's Options:

**Option A: Approve Refund** ✅
- Click "Approve Refund" button
- System marks refund as approved
- Player gets notification
- Organizer must now send money manually

**Option B: Reject Refund** ❌
- Click "Reject Refund" button
- Must provide rejection reason
- Example reasons:
  - "Tournament already started"
  - "Cancellation deadline passed"
  - "No refund policy for this tournament"
- Player gets notification with reason
- Registration remains active

---

### **STEP 3: Organizer Processes Refund**

#### After Approving:

**What Organizer Must Do:**
1. **Open Payment App** (Google Pay, PhonePe, Paytm, etc.)
2. **Send Money to Player's UPI ID**
   - Amount: ₹500 (shown in system)
   - UPI ID: `john@paytm` (shown in system)
   - OR scan player's QR code if provided
3. **Return to Matchify.pro**
4. **Click "Mark as Completed"** button
   - This tells the system: "I have sent the money"

#### What Happens in Backend:
```javascript
// After approval
refundStatus: 'pending' → 'approved'
status: 'cancellation_requested' → 'cancelled'
paymentStatus: 'completed' → 'refunded'
refundProcessedAt: '2026-01-25 11:00:00'

// After marking as completed
refundStatus: 'approved' → 'completed'
```

#### Notifications Sent:

**After Approval:**
- ✅ **To Player**: "Refund Approved! 💰 Your refund request for Men's Singles in Bangalore Open has been approved. Amount: ₹500. The organizer will process the refund to your UPI ID: john@paytm"

**After Completion:**
- ✅ **To Player**: "Refund Sent! ✅ Your refund of ₹500 for Men's Singles in Bangalore Open has been sent to your UPI ID: john@paytm. Please check your account."

---

## 📊 Database Fields (Registration Model)

```javascript
{
  // Status fields
  status: 'cancellation_requested',  // confirmed → cancellation_requested → cancelled
  paymentStatus: 'refunded',         // completed → refunded
  
  // Cancellation details
  cancelledAt: Date,
  cancellationReason: String,        // Player's reason
  
  // Refund details
  refundUpiId: String,               // Player's UPI ID
  refundQrCode: String,              // Player's QR code URL (optional)
  refundAmount: Float,               // Amount to refund
  refundStatus: String,              // pending → approved/rejected → completed
  refundRequestedAt: Date,           // When player requested
  refundProcessedAt: Date,           // When organizer approved/rejected
  refundRejectionReason: String      // If rejected, why?
}
```

---

## 🎯 Refund Status Flow

```
Player Requests → Organizer Reviews → Organizer Sends Money → Complete

pending         → approved/rejected → completed
                  (manual payment)
```

### Status Meanings:

1. **`pending`** - Player requested, waiting for organizer review
2. **`approved`** - Organizer approved, must send money manually
3. **`rejected`** - Organizer rejected with reason
4. **`completed`** - Organizer sent money and marked as done

---

## 🔍 How Admin/Organizer Finds Refund Requests

### Method 1: Notification Bell
```
1. Click notification bell (top right)
2. See "Cancellation Request Received"
3. Click notification
4. View full details
5. Approve or Reject
```

### Method 2: Tournament Management Page
```
1. Go to "My Tournaments" (organizer)
2. Click on tournament
3. See "Refund Requests" tab
4. Click to view all pending refunds
5. Process each request
```

### Method 3: Cancellation Requests Page
```
1. Go to Organizer Dashboard
2. Click "Cancellation Requests"
3. See all pending refunds across all tournaments
4. Filter by tournament
5. Process requests
```

---

## 💰 Refund Amount Calculation

```javascript
refundAmount = registration.amountTotal

// Example:
// Player paid: ₹500
// Refund amount: ₹500 (full refund)
```

**Note**: Currently, the system gives **100% refund**. You can modify this to:
- Deduct processing fee (e.g., 10%)
- Partial refund based on cancellation timing
- No refund after certain deadline

---

## 📱 What Player Sees

### Before Requesting:
```
My Registrations
├── Bangalore Open
│   ├── Status: Confirmed ✅
│   ├── Amount: ₹500
│   └── [Request Cancellation] button
```

### After Requesting:
```
My Registrations
├── Bangalore Open
│   ├── Status: Refund Requested ⏳
│   ├── Refund Amount: ₹500
│   ├── UPI ID: john@paytm
│   └── Waiting for organizer approval...
```

### After Approval:
```
My Registrations
├── Bangalore Open
│   ├── Status: Refund Approved ✅
│   ├── Refund Amount: ₹500
│   └── Organizer will send money to: john@paytm
```

### After Completion:
```
My Registrations
├── Bangalore Open
│   ├── Status: Cancelled ❌
│   ├── Refund: Completed ✅
│   └── ₹500 sent to john@paytm
```

---

## 🎨 What Organizer Sees

### Notification:
```
🔔 Cancellation Request Received
John Doe has requested to cancel their registration for 
Bangalore Open (Men's Singles). Please review and process 
the refund.

[View Details]
```

### Refund Request Details:
```
┌─────────────────────────────────────────┐
│ Cancellation Request                    │
├─────────────────────────────────────────┤
│ Player: John Doe                        │
│ Category: Men's Singles                 │
│ Amount: ₹500                            │
│                                         │
│ Reason:                                 │
│ "Health issues - unable to participate" │
│                                         │
│ Refund Details:                         │
│ UPI ID: john@paytm                      │
│ QR Code: [Image if uploaded]           │
│                                         │
│ [Approve Refund] [Reject Refund]       │
└─────────────────────────────────────────┘
```

### After Approval:
```
┌─────────────────────────────────────────┐
│ Refund Approved - Action Required       │
├─────────────────────────────────────────┤
│ Player: John Doe                        │
│ Amount: ₹500                            │
│ UPI ID: john@paytm                      │
│                                         │
│ ⚠️ Please send ₹500 to john@paytm      │
│    using your payment app               │
│                                         │
│ After sending money:                    │
│ [Mark as Completed]                     │
└─────────────────────────────────────────┘
```

---

## ⚠️ Important Rules

### 1. **Cancellation Deadline**
- ✅ Can cancel: Before tournament starts
- ❌ Cannot cancel: After tournament starts
- System checks: `currentDate < tournament.startDate`

### 2. **Eligible Statuses**
- ✅ Can request cancellation: `confirmed`, `pending`
- ❌ Cannot request: `cancelled`, `cancellation_requested`

### 3. **Refund Processing**
- Organizer must **manually send money** via UPI
- System only tracks the status
- No automatic payment processing

### 4. **Rejection**
- If rejected, registration stays **active**
- Player can still participate
- Rejection reason is sent to player

---

## 🔐 Security & Validation

### Player Side:
- ✅ Must provide reason (min 10 characters)
- ✅ Must provide valid UPI ID
- ✅ Can only cancel own registrations
- ✅ Cannot cancel after tournament starts

### Organizer Side:
- ✅ Can only manage own tournament registrations
- ✅ Must provide rejection reason if rejecting
- ✅ Cannot approve already processed refunds

---

## 📈 Tracking & Reports

### For Organizer:
```
Cancellation Logs
├── Total Requests: 5
├── Approved: 3
├── Rejected: 1
├── Pending: 1
└── Total Refunded: ₹1,500
```

### For Admin:
```
System-wide Refund Stats
├── Total Refund Requests: 50
├── Approved: 40
├── Rejected: 5
├── Pending: 5
└── Total Amount Refunded: ₹25,000
```

---

## 🎯 Summary

### **3-Step Process:**
1. **Player Requests** → Provides UPI ID + Reason
2. **Organizer Reviews** → Approves or Rejects
3. **Organizer Sends Money** → Marks as Completed

### **Key Points:**
- ✅ Full refund (100% of payment)
- ✅ Manual payment by organizer
- ✅ System tracks everything
- ✅ Notifications at every step
- ✅ Player provides UPI ID + optional QR code
- ✅ Organizer sees all details clearly
- ✅ Cannot cancel after tournament starts

### **This is NOT automatic payment!**
- Organizer must manually send money via UPI
- System only tracks and notifies
- Organizer confirms when money is sent

---

## 🚀 Status: FULLY IMPLEMENTED ✅

All features are working:
- ✅ Player can request cancellation
- ✅ Organizer gets notified
- ✅ Organizer can approve/reject
- ✅ Organizer can mark as completed
- ✅ Notifications sent at each step
- ✅ Full tracking and logging
