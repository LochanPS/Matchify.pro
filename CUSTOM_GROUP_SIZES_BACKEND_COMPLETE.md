# Custom Group Sizes Backend Implementation - COMPLETE ✅

## Changes Made

### 1. Updated `generateRoundRobinBracket` Function
**File**: `backend/src/controllers/draw.controller.js`

**Before**:
```javascript
function generateRoundRobinBracket(size, numberOfGroups) {
  const playersPerGroup = Math.ceil(size / numberOfGroups);
  // Always equal distribution
}
```

**After**:
```javascript
function generateRoundRobinBracket(size, numberOfGroups, customGroupSizes = null) {
  // Supports both equal and custom distribution
  let groupSizes;
  if (customGroupSizes && Array.isArray(customGroupSizes)) {
    groupSizes = customGroupSizes; // Use custom sizes
  } else {
    // Default: equal distribution with smart adjustment
  }
}
```

**Key Features**:
- Accepts optional `customGroupSizes` parameter (array like `[5, 4]`)
- Falls back to equal distribution if not provided
- Smart adjustment for remainder players
- Maintains minimum 2 players per group
- Logs when custom sizes are used

### 2. Updated `createConfiguredDraw` Function
**File**: `backend/src/controllers/draw.controller.js`

**Changes**:
- Added `customGroupSizes` to request body destructuring
- Passes `customGroupSizes` to `generateRoundRobinBracket`
- Passes `customGroupSizes` to `generateGroupsKnockoutBracket`

```javascript
const { customGroupSizes } = req.body;

if (format === 'ROUND_ROBIN') {
  bracketJson = generateRoundRobinBracket(size, numberOfGroups || 1, customGroupSizes);
} else if (format === 'ROUND_ROBIN_KNOCKOUT') {
  bracketJson = generateGroupsKnockoutBracket(size, numberOfGroups || 4, advanceFromGroup || 2, customGroupSizes);
}
```

### 3. Updated `generateGroupsKnockoutBracket` Function
**File**: `backend/src/controllers/draw.controller.js`

**Changes**:
- Added `customGroupSizes` parameter
- Passes it to `generateRoundRobinBracket`
- Stores it in returned bracket JSON

```javascript
function generateGroupsKnockoutBracket(size, numberOfGroups, advanceFromGroup, customGroupSizes = null) {
  const groupData = generateRoundRobinBracket(size, numberOfGroups, customGroupSizes);
  // ...
  return {
    format: 'ROUND_ROBIN_KNOCKOUT',
    customGroupSizes: customGroupSizes || null,
    // ...
  };
}
```

## How It Works

### Request Flow

1. **Frontend sends**:
```javascript
POST /api/draws/create
{
  tournamentId: "xxx",
  categoryId: "yyy",
  format: "ROUND_ROBIN",
  bracketSize: 9,
  numberOfGroups: 2,
  customGroupSizes: [5, 4]  // Optional
}
```

2. **Backend processes**:
- Validates tournament and category
- Calls `generateRoundRobinBracket(9, 2, [5, 4])`
- Creates groups with custom sizes
- Saves bracket JSON with custom sizes

3. **Bracket JSON structure**:
```json
{
  "format": "ROUND_ROBIN",
  "bracketSize": 9,
  "numberOfGroups": 2,
  "customGroupSizes": [5, 4],
  "groups": [
    {
      "groupName": "A",
      "participants": [/* 5 players */],
      "matches": [/* 10 matches */]
    },
    {
      "groupName": "B",
      "participants": [/* 4 players */],
      "matches": [/* 6 matches */]
    }
  ]
}
```

## Examples

### Example 1: 9 Players, Custom Sizes
```javascript
generateRoundRobinBracket(9, 2, [5, 4])
```
**Result**:
- Pool A: 5 players (Slots 1-5) → 10 matches
- Pool B: 4 players (Slots 6-9) → 6 matches
- Total: 16 matches

### Example 2: 10 Players, Equal Distribution
```javascript
generateRoundRobinBracket(10, 2, null)
```
**Result**:
- Pool A: 5 players (Slots 1-5) → 10 matches
- Pool B: 5 players (Slots 6-10) → 10 matches
- Total: 20 matches

### Example 3: 11 Players, Custom Sizes
```javascript
generateRoundRobinBracket(11, 3, [4, 4, 3])
```
**Result**:
- Pool A: 4 players (Slots 1-4) → 6 matches
- Pool B: 4 players (Slots 5-8) → 6 matches
- Pool C: 3 players (Slots 9-11) → 3 matches
- Total: 15 matches

### Example 4: Round Robin + Knockout with Custom Sizes
```javascript
generateGroupsKnockoutBracket(9, 2, 2, [5, 4])
```
**Result**:
- **Stage 1 (Groups)**:
  - Pool A: 5 players
  - Pool B: 4 players
- **Stage 2 (Knockout)**:
  - Top 2 from each group → 4-player knockout bracket

## Match Generation

The `generateGroupMatches` function creates all possible matches within a group:
- For 5 players: 10 matches (5 × 4 / 2)
- For 4 players: 6 matches (4 × 3 / 2)
- For 3 players: 3 matches (3 × 2 / 2)

Formula: `n × (n - 1) / 2` where n = number of players

## Backward Compatibility

✅ **Fully backward compatible**:
- If `customGroupSizes` is not provided, uses equal distribution
- Existing draws without custom sizes continue to work
- No breaking changes to API

## Validation

### Frontend Validation
- Total must equal bracket size
- Minimum 2 players per group
- Shows real-time feedback

### Backend Validation
- Accepts custom sizes if provided
- Falls back to equal distribution
- Ensures all slots are filled

## Testing

### Test Case 1: Custom Sizes
```bash
curl -X POST /api/draws/create \
  -H "Content-Type: application/json" \
  -d '{
    "tournamentId": "xxx",
    "categoryId": "yyy",
    "format": "ROUND_ROBIN",
    "bracketSize": 9,
    "numberOfGroups": 2,
    "customGroupSizes": [5, 4]
  }'
```

### Test Case 2: Equal Distribution (Default)
```bash
curl -X POST /api/draws/create \
  -H "Content-Type: application/json" \
  -d '{
    "tournamentId": "xxx",
    "categoryId": "yyy",
    "format": "ROUND_ROBIN",
    "bracketSize": 8,
    "numberOfGroups": 2
  }'
```

## Files Modified
- `MATCHIFY.PRO/matchify/backend/src/controllers/draw.controller.js`
  - `generateRoundRobinBracket()` - Added customGroupSizes parameter
  - `createConfiguredDraw()` - Added customGroupSizes to request body
  - `generateGroupsKnockoutBracket()` - Added customGroupSizes parameter

## Benefits

1. **Flexibility**: Handle any number of players
2. **Fairness**: Organizers can balance group sizes
3. **Backward Compatible**: Existing code continues to work
4. **Smart Defaults**: Auto-distributes if custom sizes not provided
5. **Logged**: Console logs when custom sizes are used

## Result
The backend now fully supports custom group sizes for Round Robin tournaments! Combined with the frontend UI, organizers can create tournaments with any player distribution. 🎉
