# How to Test Umpire Statistics Tracking

## Quick Test Guide

### Step 1: Restart Backend
The backend needs to be restarted to load the updated code:

```bash
# Stop the backend if running
# Then start it again
cd backend
npm start
```

### Step 2: Login as Umpire
1. Go to the app
2. Login with a user that has UMPIRE role
3. Navigate to Umpire Dashboard

### Step 3: Check Initial State
You should see:
- **Assigned Matches**: Number of matches assigned to you
- **Completed**: Matches you've completed
- **Upcoming**: Scheduled matches
- **Today**: Today's matches
- **Historical Stats Banner**: Shows total career matches (if > 0)

### Step 4: Complete a Match
1. Go to a match assigned to you
2. Start the match
3. Score points
4. Complete the match

### Step 5: Verify Stats Updated
1. Go back to Umpire Dashboard
2. Check that "Historical Stats Banner" shows incremented count
3. If you reach 10 matches, you should see "Verified Umpire" badge

## Expected Behavior

### For New Umpires (0 matches)
- No historical stats banner shown
- Only current assignment stats visible
- Clean, minimal dashboard

### For Umpires with 1-4 Matches
- Historical stats banner shows match count
- Trophy icon with count
- No progress bar yet

### For Umpires with 5-9 Matches
- Historical stats banner shows match count
- Progress bar toward verification (e.g., "7/10")
- Visual feedback on progress

### For Verified Umpires (10+ matches)
- Historical stats banner shows match count
- Blue "Verified Umpire" badge with checkmark
- No progress bar (already verified)

## Database Check

You can verify the data directly in the database:

```sql
-- Check a specific user's umpire stats
SELECT id, name, matchesUmpired, isVerifiedUmpire 
FROM User 
WHERE id = 'your-user-id';

-- Check all matches umpired by a user
SELECT id, status, completedAt 
FROM Match 
WHERE umpireId = 'your-user-id' 
AND status = 'COMPLETED';
```

## Troubleshooting

### Stats not updating?
1. Check backend console for errors
2. Verify match has `umpireId` set
3. Ensure match status is 'COMPLETED'
4. Check that backend was restarted

### Historical banner not showing?
1. Verify `matchesUmpired` > 0 in database
2. Check browser console for API errors
3. Refresh the page
4. Clear browser cache

### Verification not triggering?
1. Verify `matchesUmpired` >= 10 in database
2. Check backend logs for verification message
3. Complete one more match to trigger check
4. Restart backend if needed

## Manual Testing Script

If you want to manually test with existing data:

```javascript
// Run in backend console or create a test script
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testUmpireStats() {
  // Set a user's match count to 9 (one away from verification)
  await prisma.user.update({
    where: { email: 'umpire@test.com' },
    data: { matchesUmpired: 9 }
  });
  
  console.log('User set to 9 matches - complete one more to test verification!');
}

testUmpireStats();
```

## Success Criteria

✅ Historical stats banner appears when matchesUmpired > 0
✅ Match count increments after completing a match
✅ Progress bar shows for 5-9 matches
✅ Verified badge appears at 10+ matches
✅ Stats persist across page refreshes
✅ Works for all tournaments globally

---

**Ready to test!** Complete a match as an umpire and watch the stats update automatically.
