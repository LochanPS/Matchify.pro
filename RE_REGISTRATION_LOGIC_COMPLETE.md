# Re-Registration Logic for Rejected/Cancelled Registrations - COMPLETE ✅

## Problem
Users who had their registration **rejected** by admin (e.g., unclear payment screenshot) were blocked from registering again for the same category. The system was showing "Already registered for d 18" even though their registration was rejected.

## Solution
Updated the registration logic to allow re-registration based on registration status.

---

## New Registration Logic

### ✅ CAN Register Again:
- **REJECTED** - Admin rejected the registration (unclear screenshot, wrong amount, etc.)
  - User can fix the issue and try again
  - User can upload a better payment screenshot
  - User can register multiple times until approved
  
- **CANCELLED** - User cancelled their own registration
  - User can change their mind and register again
  - User can come back to the tournament

### ❌ CANNOT Register Again:
- **PENDING** - Registration is waiting for admin approval
  - User must wait for admin decision
  - Cannot submit duplicate registration while pending
  
- **APPROVED/CONFIRMED** - Registration is approved
  - User is already in the tournament
  - No need to register again

---

## Implementation

### File Changed
**File**: `frontend/src/pages/TournamentRegistrationPage.jsx`

**Before**:
```javascript
// Only filtered out 'cancelled' registrations
const registeredCategoryIds = (myRegistrations.registrations || [])
  .filter(reg => reg.tournament.id === id && reg.status !== 'cancelled')
  .map(reg => reg.category.id);
```

**After**:
```javascript
// Filter out both 'cancelled' AND 'rejected' registrations
// Only block re-registration if status is PENDING or APPROVED/CONFIRMED
const registeredCategoryIds = (myRegistrations.registrations || [])
  .filter(reg => 
    reg.tournament.id === id && 
    reg.status !== 'cancelled' && 
    reg.status !== 'rejected'
  )
  .map(reg => reg.category.id);
```

---

## User Flow Examples

### Example 1: Rejected Registration
1. User registers for "d 18" category
2. Uploads payment screenshot
3. Admin reviews and **rejects** (reason: "Screenshot is blurry, cannot verify payment")
4. User receives rejection notification
5. ✅ User can now register again for "d 18"
6. User uploads a clearer screenshot
7. Admin approves
8. ✅ User is now in the tournament

### Example 2: Pending Registration
1. User registers for "d 18" category
2. Status: **PENDING** (waiting for admin)
3. ❌ User tries to register again
4. System shows: "Already registered for d 18"
5. User must wait for admin decision

### Example 3: Approved Registration
1. User registers for "d 18" category
2. Admin **approves** the registration
3. Status: **CONFIRMED**
4. ❌ User tries to register again
5. System shows: "Already registered for d 18"
6. User is already in the tournament

### Example 4: Cancelled Registration
1. User registers for "d 18" category
2. User cancels their own registration
3. Status: **CANCELLED**
4. ✅ User can register again for "d 18"
5. User changes their mind and wants to participate

---

## Status Summary Table

| Registration Status | Can Re-Register? | Reason |
|-------------------|------------------|---------|
| **PENDING** | ❌ No | Wait for admin decision |
| **APPROVED/CONFIRMED** | ❌ No | Already in tournament |
| **REJECTED** | ✅ Yes | Can fix issues and try again |
| **CANCELLED** | ✅ Yes | Can change mind and come back |

---

## UI Behavior

### When Status is PENDING or APPROVED:
- Category shows green checkmark ✓
- Badge says "Already Registered"
- Category is disabled (cannot click)
- User cannot select this category

### When Status is REJECTED or CANCELLED:
- Category is available for selection
- No "Already Registered" badge
- User can click and select
- User can register again with new payment screenshot

---

## Benefits

1. **Better User Experience**: Users can fix mistakes and try again
2. **Reduces Support Burden**: Users don't need to contact support to re-register
3. **Fair System**: Rejected users get another chance to provide correct information
4. **Prevents Duplicates**: Approved users cannot create duplicate registrations
5. **Clear Status**: Users know exactly what they can and cannot do

---

## Testing Checklist

- [x] Rejected registrations allow re-registration
- [x] Cancelled registrations allow re-registration
- [x] Pending registrations block re-registration
- [x] Approved registrations block re-registration
- [x] UI shows correct status for each case
- [x] User can upload new payment screenshot after rejection

---

## Result

✅ **Users with rejected registrations can now try again!**
- Fix payment screenshot issues
- Correct payment amount
- Multiple attempts until approved
- Better user experience
