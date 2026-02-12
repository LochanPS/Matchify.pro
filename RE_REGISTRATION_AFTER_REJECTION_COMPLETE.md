# Re-Registration After Rejection - COMPLETE ✅

## Problem
Users whose registrations were **REJECTED** by admin were still seeing "Already registered for d 18" warning and couldn't register again for the same category.

## Root Cause
The code was filtering out only `cancelled` registrations, but not `rejected` registrations. This meant rejected registrations were still being counted as "already registered" and blocking re-registration.

## Solution
Updated the registration logic to allow re-registration for both REJECTED and CANCELLED statuses.

---

## Changes Made

### 1. Updated Registration Filter Logic
**File**: `frontend/src/pages/TournamentRegistrationPage.jsx`

**Before**:
```javascript
const registeredCategoryIds = (myRegistrations.registrations || [])
  .filter(reg => reg.tournament.id === id && reg.status !== 'cancelled')
  .map(reg => reg.category.id);
```

**After**:
```javascript
// Only block re-registration if status is PENDING or APPROVED/CONFIRMED
// Allow re-registration if status is REJECTED or CANCELLED
const registeredCategoryIds = (myRegistrations.registrations || [])
  .filter(reg => 
    reg.tournament.id === id && 
    reg.status !== 'cancelled' && 
    reg.status !== 'rejected'
  )
  .map(reg => reg.category.id);
```

### 2. Added Display of Already Registered Categories
Added a helper function to display which categories the user is already registered for (with PENDING or APPROVED status):

```javascript
// Display already registered categories as info (not error)
const getAlreadyRegisteredCategoryNames = () => {
  if (alreadyRegisteredCategories.length === 0) return null;
  
  return alreadyRegisteredCategories
    .map(catId => {
      const cat = categories.find(c => c.id === catId);
      return cat?.name;
    })
    .filter(Boolean)
    .join(', ');
};
```

### 3. Added Warning Message Display
Added a red warning box that shows which categories are already registered (only for PENDING/APPROVED):

```javascript
{/* Already Registered Categories Info */}
{alreadyRegisteredCategories.length > 0 && getAlreadyRegisteredCategoryNames() && (
  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
    <p className="text-sm text-red-400">
      Already registered for {getAlreadyRegisteredCategoryNames()}
    </p>
  </div>
)}
```

---

## Registration Status Logic

| Status | Can Re-Register? | Shows in Warning? | Reason |
|--------|------------------|-------------------|---------|
| **PENDING** | ❌ No | ✅ Yes | Wait for admin decision |
| **APPROVED/CONFIRMED** | ❌ No | ✅ Yes | Already in tournament |
| **REJECTED** | ✅ Yes | ❌ No | Can fix issues and try again |
| **CANCELLED** | ✅ Yes | ❌ No | Can change mind and come back |

---

## User Experience Flow

### Scenario 1: Registration Rejected
1. User registers for "d 18" category
2. Admin rejects (reason: "Screenshot unclear")
3. User goes back to registration page
4. ✅ **NO warning message** "Already registered for d 18"
5. ✅ User can select "d 18" category again
6. User uploads clearer screenshot
7. User submits registration again
8. Admin approves
9. ✅ User is now in the tournament

### Scenario 2: Registration Pending
1. User registers for "d 18" category
2. Status: PENDING (waiting for admin)
3. User goes back to registration page
4. ❌ **Warning shows**: "Already registered for d 18"
5. ❌ Category "d 18" is disabled with green checkmark
6. User must wait for admin decision

### Scenario 3: Registration Approved
1. User registers for "d 18" category
2. Admin approves
3. User goes back to registration page
4. ❌ **Warning shows**: "Already registered for d 18"
5. ❌ Category "d 18" is disabled with green checkmark
6. User is already in the tournament

---

## Visual Indicators

### For REJECTED/CANCELLED Registrations:
- ✅ No warning message
- ✅ Category is selectable (normal appearance)
- ✅ User can click and register again

### For PENDING/APPROVED Registrations:
- ❌ Red warning box: "Already registered for d 18"
- ❌ Category shows green checkmark
- ❌ Category badge says "Already Registered"
- ❌ Category is disabled (cannot click)

---

## Benefits

1. **Fair Second Chance**: Users with rejected registrations can fix their mistakes
2. **Clear Communication**: Warning message only shows for active registrations
3. **Prevents Confusion**: Users know exactly which categories they can register for
4. **Reduces Support**: Users don't need to contact support to re-register
5. **Better UX**: Clear visual feedback about registration status

---

## Testing Checklist

- [x] Rejected registrations don't show in warning
- [x] Rejected registrations allow re-registration
- [x] Cancelled registrations don't show in warning
- [x] Cancelled registrations allow re-registration
- [x] Pending registrations show in warning
- [x] Pending registrations block re-registration
- [x] Approved registrations show in warning
- [x] Approved registrations block re-registration
- [x] Warning message displays correct category names
- [x] Multiple categories display correctly (comma-separated)

---

## Result

✅ **Users with rejected registrations can now register again!**
- No more "Already registered" warning for rejected registrations
- Clear visual feedback about which categories are blocked
- Better user experience with fair second chances
- Reduced support burden
