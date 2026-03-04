# Missing Endpoints Fix

## Issues
The ConductMatchPage was showing 404 errors for two missing endpoints:
1. `GET /api/users/:userId` - For fetching umpire details
2. `PUT /api/matches/:matchId/config` - For saving match scoring configuration

## Root Causes

### Issue 1: No User Routes
There was no `/api/users` route registered in the application, causing 404 errors when trying to fetch user/umpire details.

### Issue 2: No Match Config Route
The `PUT /api/matches/:matchId/config` endpoint was missing from `match.routes.js`, even though the controller function existed.

### Issue 3: Match Status Check Too Strict
The config endpoint was only allowing 'PENDING' and 'READY' statuses, but matches can also be in 'SCHEDULED' status.

## Solutions

### 1. Created User Routes
**File**: `backend/src/routes/user.routes.js`

Created a new route file with:
- `GET /api/users/:userId` - Fetch user details by ID
- Returns user information including name, email, phone, roles, etc.
- Requires authentication

### 2. Registered User Routes
**File**: `backend/src/server.js`

Added:
```javascript
import userRoutes from './routes/user.routes.js';
app.use('/api/users', userRoutes);
```

### 3. Added Match Config Route
**File**: `backend/src/routes/match.routes.js`

Added:
- `PUT /api/matches/:matchId/config` - Save match scoring configuration
- Accepts: pointsPerSet, maxSets, setsToWin, extension
- Authorization: Organizer, assigned umpire, or any umpire role
- Stores config in match.scoreJson for later use

### 4. Fixed Status Check
Updated the status check to allow:
- 'PENDING'
- 'READY'
- 'SCHEDULED'

## Files Modified

1. **Created**: `backend/src/routes/user.routes.js`
   - New route file for user-related endpoints

2. **Modified**: `backend/src/server.js`
   - Added user routes import and registration

3. **Modified**: `backend/src/routes/match.routes.js`
   - Added PUT /api/matches/:matchId/config endpoint
   - Updated status check to include 'SCHEDULED'

## Test Results

### GET /api/users/:userId
```
Status: 200 OK ✅
User: PS Pradyumna (pokkalipradyumna@gmail.com)
```

### PUT /api/matches/:matchId/config
```
Status: 200 OK ✅
Config saved: 21 points, 3 sets
```

## API Endpoints Added

### 1. GET /api/users/:userId
**Purpose**: Fetch user details by ID

**Request**:
```
GET /api/users/87bb6ccc-4c96-4990-89eb-e76687f902d8
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "user": {
    "id": "87bb6ccc-4c96-4990-89eb-e76687f902d8",
    "name": "PS Pradyumna",
    "email": "pokkalipradyumna@gmail.com",
    "phone": "1234567890",
    "roles": "ORGANIZER,PLAYER",
    "profilePhoto": null,
    "city": "Bangalore",
    "state": "Karnataka",
    ...
  }
}
```

### 2. PUT /api/matches/:matchId/config
**Purpose**: Save match scoring configuration before match starts

**Request**:
```
PUT /api/matches/d15ef7d8-9e35-4cc2-aa1c-87122ac6815f/config
Authorization: Bearer <token>
Content-Type: application/json

{
  "pointsPerSet": 21,
  "maxSets": 3,
  "setsToWin": 2,
  "extension": true
}
```

**Response**:
```json
{
  "success": true,
  "message": "Match config saved",
  "matchConfig": {
    "pointsPerSet": 21,
    "maxSets": 3,
    "setsToWin": 2,
    "extension": true
  }
}
```

## Impact

### ConductMatchPage
- ✅ Can now fetch umpire details without 404 errors
- ✅ Can save custom scoring configuration
- ✅ Can proceed to match scoring page

### Match Scoring
- ✅ Custom scoring formats (21x3, 30x1, etc.) can be configured
- ✅ Extension rules can be enabled/disabled
- ✅ Configuration is saved before match starts

## Status
✅ **FIXED** - Both endpoints are now working correctly
✅ **TESTED** - All endpoints return expected responses
✅ **DEPLOYED** - Backend server running with new routes
