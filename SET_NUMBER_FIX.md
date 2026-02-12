# Set Number Display Fix

## The Mistake

The scoring page was displaying **"Set 2"** when the match hadn't started yet and no points had been scored. It should have shown **"Set 1"**.

### Visual Evidence
- Score: 0 - 0
- Display: "Set 2" (WRONG - should be "Set 1")
- Status: "Start match to score" (match not started)
- Sets Won: 0 for both players

## Root Cause

There was an inconsistency in how `currentSet` was initialized across different parts of the codebase:

### Backend Initialization
1. **startMatch function** (match.controller.js line 630): `currentSet: 0` ✅ CORRECT
2. **setMatchConfig function** (match.controller.js line 1165): `currentSet: 1` ❌ WRONG
3. **setMatchConfig route** (match.routes.js line 674): `currentSet: 1` ❌ WRONG

### Frontend Display
- **MatchScoringPage.jsx** (line 481): Displays as `Set {score.currentSet + 1}`
- When backend sends `currentSet: 1`, frontend displays it as "Set 2" (1+1=2)

## The Problem Flow

1. User opens ConductMatchPage
2. Page calls `PUT /api/matches/:matchId/config` to save scoring configuration
3. Backend initializes score with `currentSet: 1` (WRONG)
4. User navigates to scoring page
5. Frontend receives `currentSet: 1` from backend
6. Frontend displays "Set 2" (1+1=2) even though match hasn't started

## The Solution

Fixed the backend initialization to use **0-indexed sets** consistently:

### Files Modified

1. **backend/src/controllers/match.controller.js** (line 1165)
   ```javascript
   // Before
   currentSet: 1,
   
   // After
   currentSet: 0,
   ```

2. **backend/src/routes/match.routes.js** (line 674)
   ```javascript
   // Before
   currentSet: 1,
   
   // After
   currentSet: 0,
   ```

## Why 0-Indexed?

The scoring system uses **0-indexed arrays** for sets:
- `sets[0]` = Set 1
- `sets[1]` = Set 2
- `sets[2]` = Set 3

Therefore, `currentSet` should be:
- `0` for Set 1
- `1` for Set 2
- `2` for Set 3

The frontend then displays it as `currentSet + 1` to show human-readable set numbers (1, 2, 3).

## Test Results

### Before Fix
```
currentSet: 1 (from backend)
Display: "Set 2" (1+1=2)
Status: Match not started ❌
```

### After Fix
```
currentSet: 0 (from backend)
Display: "Set 1" (0+1=1)
Status: Match not started ✅
```

## Impact

This fix ensures:
- ✅ Match always starts at "Set 1"
- ✅ Set numbers display correctly throughout the match
- ✅ Set progression works properly (Set 1 → Set 2 → Set 3)
- ✅ Consistent indexing across frontend and backend

## Status
✅ **FIXED** - Set numbers now display correctly from the start
