# Day 22: Registration Backend - Complete ✅

## Overview
Implemented complete tournament registration system with wallet payments, partner support, and cancellation with refunds.

## What Was Built

### 1. Enhanced Registration Model
Added fields to Prisma schema:
- Partner support (partnerId, partnerEmail, partnerConfirmed)
- Payment details (amountTotal, amountWallet, amountRazorpay)
- Razorpay integration (razorpayOrderId, razorpayPaymentId, razorpaySignature)
- Cancellation & refund (cancelledAt, refundAmount, refundStatus)

### 2. Registration Endpoints

#### POST /api/registrations
- Register for one or multiple categories
- Automatic wallet deduction
- Razorpay order creation for remaining amount
- Partner email support for doubles
- Duplicate registration prevention
- Registration window validation

#### GET /api/registrations/my
- Get user's registrations
- Filter by status (optional)
- Includes tournament, category, and partner details
- Sorted by creation date (newest first)

#### DELETE /api/registrations/:id
- Cancel registration
- 100% refund if >24h before tournament
- 0% refund if <24h before tournament
- Automatic wallet refund
- Prevents double cancellation
- Cannot cancel after tournament starts

## Features

### Payment Logic
1. **Calculate total amount** from selected categories
2. **Use wallet first** (up to available balance)
3. **Create Razorpay order** for remaining amount (if any)
4. **Deduct from wallet** immediately
5. **Log wallet transaction**
6. **Create registrations** (one per category)

### Refund Logic
1. **Check cancellation time** (hours until tournament start)
2. **Calculate refund** (100% if >24h, 0% if <24h)
3. **Update registration** status to cancelled
4. **Refund to wallet** (if applicable)
5. **Log wallet transaction**
6. **Update refund status** to completed

### Validation
- ✅ Tournament exists
- ✅ Registration window is open
- ✅ Categories belong to tournament
- ✅ No duplicate registrations
- ✅ User authorization
- ✅ Tournament hasn't started (for cancellation)

## API Documentation

### POST /api/registrations
**Auth:** Required (Player)

**Request:**
```json
{
  "tournamentId": "uuid",
  "categoryIds": ["uuid1", "uuid2"],
  "partnerEmail": "partner@example.com" // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "registrations": [
      {
        "id": "uuid",
        "tournamentId": "uuid",
        "categoryId": "uuid",
        "userId": "uuid",
        "partnerId": null,
        "partnerEmail": "partner@example.com",
        "amountTotal": 500,
        "amountWallet": 500,
        "amountRazorpay": 0,
        "status": "confirmed",
        "paymentStatus": "completed",
        "category": {...},
        "tournament": {...}
      }
    ],
    "razorpayOrder": null,
    "walletUsed": 500,
    "razorpayAmount": 0,
    "totalAmount": 500
  }
}
```

### GET /api/registrations/my
**Auth:** Required

**Query Params:**
- `status` (optional): Filter by status (pending/confirmed/cancelled)

**Response:**
```json
{
  "success": true,
  "count": 2,
  "registrations": [
    {
      "id": "uuid",
      "status": "confirmed",
      "paymentStatus": "completed",
      "amountTotal": 500,
      "tournament": {...},
      "category": {...},
      "partner": {...}
    }
  ]
}
```

### DELETE /api/registrations/:id
**Auth:** Required (Owner only)

**Response:**
```json
{
  "success": true,
  "message": "Registration cancelled successfully",
  "refundAmount": 500,
  "refundPercentage": 100
}
```

## Testing

### Test Suite: `test-registrations.js`

**Tests (10/10 passing):**
1. ✅ Login as player
2. ✅ Get tournament with open registration
3. ✅ Register for single category
4. ✅ Prevent duplicate registration
5. ✅ Get my registrations
6. ✅ Cancel registration
7. ✅ Prevent double cancellation
8. ✅ Register for multiple categories
9. ✅ Register with partner email
10. ✅ Verify final state

**Run Tests:**
```bash
cd matchify/backend
node test-registrations.js
```

**Results:**
```
🎉 All tests passed! Registration endpoints are working correctly.
10/10 tests passed
```

## Files Created/Modified

**Modified (2 files):**
1. `backend/prisma/schema.prisma` - Enhanced Registration model
2. `backend/src/server.js` - Added registration routes

**Created (4 files):**
1. `backend/src/controllers/registration.controller.js` - Registration logic
2. `backend/src/routes/registration.routes.js` - Registration routes
3. `backend/test-registrations.js` - Comprehensive test suite
4. `backend/add-wallet-balance.js` - Helper script for testing

## Database Migration

```bash
npx prisma migrate dev --name add_registration_payment_fields
```

**Added fields:**
- partnerId, partnerEmail, partnerConfirmed
- amountTotal, amountWallet, amountRazorpay
- razorpayOrderId, razorpayPaymentId, razorpaySignature
- cancelledAt, refundAmount, refundStatus

## Key Features

### 1. Wallet-First Payment
- Always uses wallet balance first
- Only creates Razorpay order if needed
- Immediate wallet deduction
- Transaction logging

### 2. Partner Support
- Store partner email for doubles
- Link to partner user if registered
- Partner confirmation tracking

### 3. Refund Policy
- **>24 hours before:** 100% refund
- **<24 hours before:** 0% refund
- **After start:** Cannot cancel
- Automatic wallet refund

### 4. Duplicate Prevention
- Unique constraint on (userId, categoryId)
- Clear error messages
- Prevents accidental double registration

### 5. Authorization
- Only authenticated users can register
- Only registration owner can cancel
- Role-based access control

## Error Handling

### Registration Errors:
- 400: Invalid input, duplicate registration, closed registration
- 403: Not authorized
- 404: Tournament/category not found
- 500: Server error, payment gateway error

### Cancellation Errors:
- 400: Already cancelled, tournament started, too late for refund
- 403: Not authorized
- 404: Registration not found

## Next Steps (Day 23)

### Payment Confirmation:
1. **Razorpay webhook** - Handle payment success/failure
2. **Update registration status** after payment
3. **Send confirmation email/SMS**
4. **Handle payment failures**

### Additional Features:
1. **Team registrations** - Register multiple players together
2. **Waitlist** - When category is full
3. **Early bird discounts** - Time-based pricing
4. **Referral codes** - Discount codes

## Success Metrics

✅ **10/10 tests passing**
✅ **Wallet payment** working
✅ **Multiple categories** supported
✅ **Partner support** implemented
✅ **Cancellation** with refunds working
✅ **Duplicate prevention** working
✅ **Authorization** checks in place
✅ **Transaction logging** complete
✅ **Error handling** robust

## Conclusion

Day 22 successfully implements a complete tournament registration system. Players can now register for tournaments using their wallet balance, with support for multiple categories and partners. The cancellation system with time-based refunds ensures fair policies for both players and organizers.

The system is now ready for Razorpay payment confirmation (Day 23) and frontend integration.
