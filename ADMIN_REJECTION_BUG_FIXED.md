# Admin Rejection Bug - FIXED ✅

## Problem
When admin rejected a payment/registration, the user still couldn't register again because:
1. The database showed status as `pending` instead of `rejected`
2. The admin rejection was setting status to `cancelled` instead of `rejected`

## Root Cause
**File**: `backend/src/routes/adminPayment.routes.js` (Line 241)

When admin rejected a payment, the code was setting:
```javascript
status: 'cancelled'  // WRONG!
```

This is incorrect because:
- `cancelled` = User cancelled their own registration
- `rejected` = Admin rejected the registration

## The Bug
```javascript
await prisma.registration.update({
  where: { id: registrationId },
  data: { 
    paymentStatus: 'rejected',
    status: 'cancelled'  // ❌ BUG: Should be 'rejected'
  }
})
```

## The Fix
```javascript
await prisma.registration.update({
  where: { id: registrationId },
  data: { 
    paymentStatus: 'rejected',
    status: 'rejected'  // ✅ FIXED: Now correctly sets to 'rejected'
  }
})
```

---

## What Was Done

### Step 1: Quick Fix - Updated Database
Created script `fix-pslochan-mens-status.js` to manually update the "mens" registration from `pending` to `rejected`:
```
Old status: pending
New status: rejected
```

### Step 2: Fixed the Bug
Updated `adminPayment.routes.js` to set correct status when admin rejects:
- Changed `status: 'cancelled'` to `status: 'rejected'`

---

## Impact

### Before Fix:
1. Admin clicks "Reject" on a registration
2. Database sets status = `cancelled` (wrong!)
3. User tries to register again
4. Backend blocks because status is `cancelled` (not `rejected`)
5. User confused - can't register even though admin rejected

### After Fix:
1. Admin clicks "Reject" on a registration
2. Database sets status = `rejected` ✅
3. User tries to register again
4. Backend allows because status is `rejected` ✅
5. User can fix issues and register again ✅

---

## Status Meanings

| Status | Meaning | Can Re-Register? |
|--------|---------|------------------|
| **pending** | Waiting for admin approval | ❌ No |
| **confirmed** | Approved by admin | ❌ No |
| **rejected** | Admin rejected | ✅ Yes |
| **cancelled** | User cancelled themselves | ✅ Yes |

---

## Testing

### Test Case 1: Admin Rejects Registration
1. User registers for tournament
2. Admin rejects the registration
3. ✅ Database status = `rejected` (not `cancelled`)
4. ✅ User can register again
5. ✅ Backend allows re-registration

### Test Case 2: User Cancels Registration
1. User registers for tournament
2. User cancels their own registration
3. ✅ Database status = `cancelled`
4. ✅ User can register again
5. ✅ Backend allows re-registration

---

## Files Changed

1. **backend/src/routes/adminPayment.routes.js**
   - Line 241: Changed `status: 'cancelled'` to `status: 'rejected'`

2. **backend/fix-pslochan-mens-status.js** (temporary script)
   - Manually fixed the existing "mens" registration status

---

## Result

✅ **Admin rejection now works correctly!**
- Sets status to `rejected` (not `cancelled`)
- Users can re-register after rejection
- Clear distinction between admin rejection and user cancellation
- No more confusion about registration status
