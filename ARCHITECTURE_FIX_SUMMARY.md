# Architecture Fix: Guest Player Names in Draws

## Problem Statement
When admin quick-added a guest player (e.g., "Pradyumna"), the draw showed "Unknown" instead of the actual name.

## Root Cause
The `getDraw` function was only fetching player names from the `User` table, but guest players don't have User records. Guest player data is stored in the `Registration` table with:
- `userId = null`
- `guestName = "Pradyumna"`
- `guestEmail = null` (optional)
- `guestPhone = null` (optional)

## Architecture Solution

### Current System (Already Good!)
The system already has proper architecture:
- **Match table** stores player IDs (`player1Id`, `player2Id`) - source of truth
- **Draw table** stores bracket structure in `bracketJson`
- **getDraw function** dynamically fetches player names from database and updates bracket JSON before sending to frontend

### What Was Fixed
Updated `getDraw` function in `draw.controller.js` to:

1. **Detect guest player IDs** (format: `guest-{registrationId}`)
2. **Fetch guest player data** from Registration table
3. **Build unified playerMap** containing both:
   - Regular users from User table
   - Guest players from Registration table
4. **Update group participants** with current names (for round robin)

### Code Changes

#### Before:
```javascript
// Only fetched from User table
const players = await prisma.user.findMany({
  where: { id: { in: Array.from(playerIds) } }
});
```

#### After:
```javascript
// Separate guest IDs from user IDs
const playerIds = new Set();
const guestPlayerIds = new Set();

matches.forEach(match => {
  if (match.player1Id) {
    if (match.player1Id.startsWith('guest-')) {
      guestPlayerIds.add(match.player1Id);
    } else {
      playerIds.add(match.player1Id);
    }
  }
  // ... same for player2Id and winnerId
});

// Fetch from User table
const players = await prisma.user.findMany(...);

// Fetch from Registration table
const guestRegistrations = await prisma.registration.findMany({
  where: { id: { in: guestRegistrationIds } }
});

// Build unified playerMap
const playerMap = {};
players.forEach(player => {
  playerMap[player.id] = player;
});
guestRegistrations.forEach(reg => {
  const guestId = `guest-${reg.id}`;
  playerMap[guestId] = {
    id: guestId,
    name: reg.guestName || 'Unknown'
  };
});
```

## Benefits

### ✅ No Schema Changes Required
- Match table already stores player IDs correctly
- Registration table already has guestName field
- No database migration needed

### ✅ Dynamic Name Resolution
- Player names are ALWAYS fetched fresh from database
- No stale cached names in bracket JSON
- Works for both existing and new draws

### ✅ Works for All Formats
- Knockout brackets
- Round robin groups
- Mixed (round robin + knockout)

### ✅ Future-Proof
- Admin adds guest player → Name stored in registration
- Draw generation → Links Match.player1Id to `guest-{registrationId}`
- Draw display → Fetches name from registration dynamically
- No manual regeneration ever needed

## Testing

After deploying to Render:

1. **Existing draws** will now show correct guest names (no regeneration needed)
2. **New guest players** will show correctly immediately
3. **Mixed registrations** (users + guests) will all display properly

## Files Modified

- `backend/src/controllers/draw.controller.js` - getDraw function
- `backend/src/controllers/organizer.controller.js` - getTournamentRegistrations function (previous fix)
- `backend/src/controllers/quickAdd.controller.js` - Quick add logic (previous fix)

## Deployment

1. Push to GitHub ✅ (Done)
2. Deploy backend to Render
3. Test by viewing existing draws - "Unknown" should change to actual names
4. Test by adding new guest players - should work immediately

## Summary

This fix implements proper separation of concerns:
- **Storage layer**: Match table stores IDs (source of truth)
- **Data layer**: Registration table stores guest names
- **Presentation layer**: getDraw dynamically resolves names via JOIN

Result: Clean architecture, no data duplication, always shows current names.
