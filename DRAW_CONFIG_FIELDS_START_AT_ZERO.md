# Draw Configuration Fields Start at Zero - FIXED ✅

## Issue
User reported that Draw Size and Number of Groups fields were showing default values (32 and 2) instead of starting at 0.

## Root Cause
The onChange handlers were forcing minimum values:
- **Bracket Size**: `|| 2` and `Math.max(2, ...)` forced minimum of 2
- **Number of Groups**: `|| 1` and `Math.max(1, ...)` forced minimum of 1

This meant even though initial state was 0, as soon as the field was focused or changed, it would jump to the minimum value.

## Changes Made

### 1. Fixed Bracket Size Input (Draw Size)
**File**: `frontend/src/pages/DrawPage.jsx`

**Before**:
```javascript
onChange={(e) => {
  const value = parseInt(e.target.value) || 2;
  setConfig({ ...config, bracketSize: Math.max(2, Math.min(128, value)) });
}}
```

**After**:
```javascript
onChange={(e) => {
  const value = e.target.value === '' ? 0 : parseInt(e.target.value);
  setConfig({ ...config, bracketSize: isNaN(value) ? 0 : Math.max(0, Math.min(128, value)) });
}}
```

**Changes**:
- Removed `|| 2` fallback
- Changed `Math.max(2, ...)` to `Math.max(0, ...)`
- Changed `min="2"` to `min="0"` in HTML attribute
- Allows field to be 0 or empty

### 2. Fixed Number of Groups Input
**File**: `frontend/src/pages/DrawPage.jsx`

**Before**:
```javascript
onChange={(e) => {
  const value = parseInt(e.target.value) || 1;
  const groups = Math.max(1, Math.min(16, value));
  setConfig({ ...config, numberOfGroups: groups, customGroupSizes: null });
  setUseCustomGroupSizes(false);
}}
```

**After**:
```javascript
onChange={(e) => {
  const value = e.target.value === '' ? 0 : parseInt(e.target.value);
  const groups = isNaN(value) ? 0 : Math.max(0, Math.min(16, value));
  setConfig({ ...config, numberOfGroups: groups, customGroupSizes: null });
  setUseCustomGroupSizes(false);
}}
```

**Changes**:
- Removed `|| 1` fallback
- Changed `Math.max(1, ...)` to `Math.max(0, ...)`
- Changed `min="1"` to `min="0"` in HTML attribute
- Allows field to be 0 or empty

### 3. Added Validation on Save
**File**: `frontend/src/pages/DrawPage.jsx`

Added validation in `handleSave()` function:
```javascript
// Validate minimum bracket size
if (config.bracketSize < 2) {
  alert('Draw size must be at least 2 players');
  return;
}

// Validate number of groups for round robin formats
if ((config.format === 'ROUND_ROBIN' || config.format === 'ROUND_ROBIN_KNOCKOUT') && config.numberOfGroups < 1) {
  alert('Number of groups must be at least 1');
  return;
}
```

## Current Behavior

### Initial State
- **Draw Size**: Shows `0` (empty field)
- **Number of Groups**: Shows `0` (empty field)
- **Pool Sizes**: Show `0` (empty fields)

### User Flow
1. Open Draw Configuration modal
2. All fields show 0
3. Type any number in Draw Size (e.g., 9)
4. Type any number in Number of Groups (e.g., 2)
5. Click "Customize Group Sizes" if needed
6. Type pool sizes (e.g., Pool A: 5, Pool B: 4)
7. Click "Create Draw"
8. Validation ensures minimum values are met

### Validation Rules
- **Draw Size**: Minimum 2 players (validated on save)
- **Number of Groups**: Minimum 1 group (validated on save)
- **Pool Sizes**: Can be 0 (for empty pools)
- **Total Pool Sizes**: Must equal Draw Size (validated on save)

## Testing Instructions

1. **Refresh the frontend page** to load the new code
2. Navigate to a tournament category
3. Click "Configure Draw"
4. Verify all fields show 0 initially
5. Type 9 in Draw Size
6. Type 2 in Number of Groups
7. Click "Customize Group Sizes"
8. Type pool sizes: Pool A: 5, Pool B: 4
9. Click "Create Draw"
10. Verify draw is created successfully

## Files Modified
- `frontend/src/pages/DrawPage.jsx` (DrawConfigModal component)

## Status
✅ **COMPLETE** - All fields now start at 0 and allow organizer to type any values
