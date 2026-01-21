# KYC Payment Verification - Admin Guide

## Overview
The KYC Payment Verification system allows admins to review and verify ₹50 payments made by organizers before they can proceed with KYC verification.

## Access
- **URL**: http://localhost:5173/admin/kyc/payments
- **Navigation**: Admin Panel → Payment Verification (💰 icon)
- **Credentials**: ADMIN@gmail.com / ADMIN@123(123)

## Features

### 1. Real-Time Notifications
- **Browser Notifications**: When a new payment is submitted, you'll receive a browser notification (if permissions are granted)
- **Visual Alert**: A green animated banner appears when new payments arrive
- **Badge Counter**: The sidebar shows a red badge with the number of pending payments
- **Auto-Refresh**: The page automatically checks for new payments every 10 seconds

### 2. Payment Dashboard

#### Stats Cards
- **Pending**: Yellow card showing payments awaiting verification
- **Verified**: Green card showing approved payments
- **Rejected**: Red card showing rejected payments

#### Filter Tabs
- **Pending**: Shows only payments awaiting verification (default view)
- **Verified**: Shows all approved payments
- **Rejected**: Shows all rejected payments
- **All Payments**: Shows all payment submissions

### 3. Payment Details
Each payment submission shows:
- Organizer name, email, and phone
- Payment amount (₹50)
- Transaction ID
- Payment screenshot
- Submission timestamp
- Current status

### 4. Verification Actions

#### View Screenshot
1. Click "View Screenshot" button
2. Review the payment screenshot in full size
3. Verify transaction details match:
   - UPI ID: 9742628582@slc
   - Account Name: Matchify.pro
   - Amount: ₹50
   - Transaction ID matches the one provided

#### Approve Payment
1. Click "Verify" button (or "Verify Payment" in screenshot modal)
2. Confirm the action
3. Payment status changes to "VERIFIED"
4. Organizer can now proceed to KYC submission

#### Reject Payment
1. Click "Reject" button
2. Enter a clear rejection reason (e.g., "Invalid transaction ID", "Fake screenshot", "Amount mismatch")
3. Click "Reject Payment"
4. Organizer will see the rejection reason and can resubmit

## Workflow

### For Organizers
1. Organizer clicks KYC banner on dashboard
2. Redirected to payment page
3. Scans QR code or uses UPI ID: 9742628582@slc
4. Makes ₹50 payment
5. Uploads payment screenshot
6. Enters transaction ID
7. Submits for verification

### For Admin
1. Receive notification of new payment
2. Navigate to Payment Verification page
3. Review payment screenshot
4. Verify transaction details
5. Approve or reject with reason
6. If approved, organizer proceeds to KYC
7. If rejected, organizer must resubmit

## Common Rejection Reasons
- "Invalid transaction ID - does not match screenshot"
- "Fake or edited screenshot detected"
- "Amount mismatch - payment is not ₹50"
- "Wrong UPI ID - payment not sent to 9742628582@slc"
- "Screenshot is unclear or unreadable"
- "Duplicate payment submission"

## Tips
1. **Enable Browser Notifications**: Click "Allow" when prompted to receive real-time alerts
2. **Keep Page Open**: Leave the payment verification page open in a tab to receive notifications
3. **Check Regularly**: Even with notifications, check the page regularly during business hours
4. **Verify Carefully**: Always cross-check transaction ID with screenshot before approving
5. **Be Clear**: Provide specific rejection reasons so organizers know what to fix

## Integration with KYC Flow
- Payment verification is **Step 1** of the KYC process
- After payment is verified, organizer can:
  - Upload Aadhaar card (Step 2)
  - Complete video verification call (Step 3)
- Without verified payment, organizer cannot proceed to KYC submission

## Troubleshooting

### Not Receiving Notifications
- Check browser notification permissions
- Ensure page is open and active
- Try refreshing the page

### Payment Not Showing
- Check the filter tab (might be in wrong status)
- Wait 10 seconds for auto-refresh
- Manually refresh the page

### Cannot Approve/Reject
- Ensure you're logged in as admin
- Check network connection
- Try refreshing and attempting again

## Related Pages
- **KYC Management**: /admin/kyc (for Aadhaar and video call verification)
- **User Management**: /admin/users (to view organizer details)
- **Admin Dashboard**: /admin/dashboard (main admin panel)

## Support
For issues or questions, contact the development team.
