# DrawPage Match Endpoints Fix Summary

## Issue
DrawPage was showing 404 errors when trying to fetch and create matches:
- `GET /api/tournaments/:tournamentId/categories/:categoryId/matches` → 404
- `POST /api/tournaments/:tournamentId/categories/:categoryId/matches` → 404
- Error: "Error creating match" in DrawPage console

## Root Causes

### 1. Authentication Middleware Blocking
**Problem**: Match routes were placed AFTER the `preventAdminAccess` middleware in `tournament.routes.js`, which blocked admin users from accessing these endpoints.

**Solution**: Moved match routes BEFORE the `preventAdminAccess` middleware and added explicit `authenticate` middleware to them.

### 2. User ID Inconsistency
**Problem**: The `match.controller.js` was using `req.user.id` but the auth middleware sets `req.user.userId`.

**Solution**: Updated all functions in `match.controller.js` to use `req.user.userId || req.user.id` for compatibility.

### 3. Admin Authorization
**Problem**: The `createMatch` function only allowed the tournament organizer to create matches, blocking admins.

**Solution**: Updated authorization logic to allow both organizers AND admins to create matches.

## Files Modified

### 1. `backend/src/routes/tournament.routes.js`
**Changes**:
- Moved match routes before `preventAdminAccess` middleware
- Added explicit `authenticate` middleware to match routes
- Routes now accessible to both organizers and admins

```javascript
// Match routes (require authentication but allow admins)
router.get('/:tournamentId/categories/:categoryId/matches', authenticate, getMatches);
router.post('/:tournamentId/categories/:categoryId/matches', authenticate, createMatch);

// Protected routes (require authentication + block admins)
router.use(authenticate);
router.use(preventAdminAccess);
```

### 2. `backend/src/controllers/match.controller.js`
**Changes**:
- Fixed user ID access in ALL functions (12 functions updated)
- Updated `createMatch` to allow admins

**Functions Updated**:
1. `getMatches` - No user ID needed (read-only)
2. `createMatch` - ✅ Fixed: `req.user.userId || req.user.id` + admin check
3. `updateMatchResult` - ✅ Fixed: `req.user.userId || req.user.id`
4. `assignCourt` - ✅ Fixed: `req.user.userId || req.user.id`
5. `startMatch` - ✅ Fixed: `req.user.userId || req.user.id`
6. `updateLiveScore` - ✅ Fixed: `req.user.userId || req.user.id`
7. `endMatch` - ✅ Fixed: `req.user.userId || req.user.id`
8. `getUmpireMatches` - ✅ Fixed: `req.user.userId || req.user.id`
9. `assignUmpire` - ✅ Fixed: `req.user.userId || req.user.id`
10. `undoPoint` - ✅ Fixed: `req.user.userId || req.user.id`
11. `setMatchConfig` - ✅ Fixed: `req.user.userId || req.user.id`
12. `pauseMatchTimer` - ✅ Fixed: `req.user.userId || req.user.id`
13. `resumeMatchTimer` - ✅ Fixed: `req.user.userId || req.user.id`

**Authorization Logic**:
```javascript
// Check if user is organizer or has ADMIN role
const userRoles = req.user.roles || [];
const isOrganizer = tournament.organizerId === userId;
const isAdmin = userRoles.includes('ADMIN') || req.user.role === 'ADMIN';

if (!isOrganizer && !isAdmin) {
  return res.status(403).json({ success: false, error: 'Only the organizer or admin can create matches' });
}
```

## Testing Results

### Test 1: GET Matches Endpoint
```bash
GET http://localhost:5000/api/tournaments/4a54977d-bfbc-42e0-96c3-b020000d81f6/categories/68a7a3eb-1ba0-446e-9a0f-cf8597b8b748/matches
Status: 200 OK ✅
Total matches: 7
First match: Rahul Sharma vs Priya Patel
```

### Test 2: POST Create Match Endpoint
```bash
POST http://localhost:5000/api/tournaments/4a54977d-bfbc-42e0-96c3-b020000d81f6/categories/68a7a3eb-1ba0-446e-9a0f-cf8597b8b748/matches
Status: 201 Created ✅
Match created: ef3494f7-2812-4efc-90ab-4cae500833f8
```

## Current Status

✅ **FIXED**: GET matches endpoint working
✅ **FIXED**: POST create match endpoint working
✅ **FIXED**: Admin can access match endpoints
✅ **FIXED**: Organizer can access match endpoints
✅ **FIXED**: All user ID references updated
✅ **FIXED**: Authorization logic allows admins

## Database Status

- Tournament: "ace badminton" (4a54977d-bfbc-42e0-96c3-b020000d81f6)
- Category: "mens" (68a7a3eb-1ba0-446e-9a0f-cf8597b8b748)
- Registrations: 8 confirmed players
- Matches: 7 existing matches (all PENDING)
- Organizer: pokkalipradyumna@gmail.com
- Admin: ADMIN@gmail.com

## Next Steps

1. ✅ Backend endpoints are working
2. ⏳ Test DrawPage in frontend to verify it can now fetch and create matches
3. ⏳ Verify umpire assignment works
4. ⏳ Test match scoring functionality

## Notes

- The `preventAdminAccess` middleware is used to block admins from creating tournaments (organizer-only feature)
- Match management should be accessible to both organizers AND admins for tournament administration
- All match-related endpoints now properly support both `req.user.userId` and `req.user.id` for backward compatibility
