# Umpire Assignment Flow - Verification

## ✅ CONFIRMED: Notification System is Working

When organizer assigns Meow (meow@gmail.com) as umpire, the following happens:

---

## Flow 1: "Assign Only" Button

### What Happens:
1. **Organizer clicks "Assign Only"**
   - Location: Draw Page → Match Card → Assign Umpire Modal
   - Selects "Meow" from dropdown
   - Clicks "Assign Only" button

2. **Frontend calls API**
   ```javascript
   PUT /api/matches/:matchId/umpire
   Body: { umpireId: "meow-user-id" }
   ```

3. **Backend processes assignment** (`match.controller.js` - `assignUmpire` function)
   - ✅ Assigns Meow to the match
   - ✅ Gets match details (tournament, category, players, court)
   - ✅ Creates notification with:
     - Title: "⚖️ Match Assignment"
     - Message: Full match details
     - Data: Match ID, tournament ID, round info
   - ✅ Sends in-app notification
   - ✅ Sends email to meow@gmail.com

4. **Meow receives notification**
   - ✅ In-app notification appears in bell icon
   - ✅ Email sent to meow@gmail.com
   - ✅ Notification includes:
     - Round name (e.g., "Quarter Finals - Match #3")
     - Player names (e.g., "Vikram Singh vs Anjali Verma")
     - Court number (if assigned)
     - Tournament name
     - Category name
     - Direct link to start match

5. **Meow can now conduct the match**
   - Logs into account (meow@gmail.com)
   - Goes to Umpire Dashboard
   - Sees assigned match in "Today's Matches" or "All Assigned Matches"
   - Clicks "Start Scoring" button
   - Redirected to match scoring page

---

## Flow 2: "Start Match" Button

### What Happens:
1. **Organizer clicks "Start Match"**
   - Location: Draw Page → Match Card → Assign Umpire Modal
   - Selects "Meow" from dropdown
   - Clicks "Start Match" button (green button)

2. **Frontend navigates to ConductMatchPage**
   ```javascript
   navigate(`/match/${matchId}/conduct?umpireId=${umpireId}`)
   ```

3. **ConductMatchPage loads**
   - Shows match configuration options
   - Pre-selects Meow as umpire
   - Organizer can configure:
     - Points per set (default: 21)
     - Number of sets (default: 3)
     - Extension rules (default: ON)
   - Organizer clicks "START MATCH"

4. **Match starts immediately**
   - ✅ Assigns Meow to match (sends notification)
   - ✅ Sets match status to IN_PROGRESS
   - ✅ Initializes scoring system
   - ✅ Redirects to scoring page

5. **Meow receives notification**
   - Same as Flow 1
   - But match is already started
   - Meow can immediately begin scoring

---

## Notification Details

### In-App Notification
```
Title: ⚖️ Match Assignment

Message:
You have been assigned as umpire for Quarter Finals - Match #3
Vikram Singh vs Anjali Verma
Court 2
Tournament: Ace Badminton Championship
Category: Men's Singles
```

### Email Notification
- Sent to: meow@gmail.com
- Subject: "Match Assignment - Ace Badminton Championship"
- Body: Same details as in-app notification
- Includes link to start match

### Notification Data (JSON)
```json
{
  "matchId": "match-uuid",
  "tournamentId": "tournament-uuid",
  "categoryId": "category-uuid",
  "matchNumber": 3,
  "round": 3,
  "roundName": "Quarter Finals",
  "courtNumber": 2
}
```

---

## Meow's Experience After Assignment

### 1. Receives Notification
- Bell icon shows red dot with count
- Email arrives at meow@gmail.com

### 2. Logs In
- Goes to matchify.pro
- Logs in with meow@gmail.com

### 3. Views Dashboard
- Sees "Umpire Dashboard"
- Stats show:
  - Total Matches: 1
  - Upcoming: 1
  - Today: 1 (if match is today)

### 4. Sees Assigned Match
- Match appears in "Today's Matches" section
- Shows:
  - Tournament name
  - Category name
  - Match status (PENDING or IN_PROGRESS)
  - Scheduled time
  - "Start Scoring" button

### 5. Starts Match
- Clicks "Start Scoring"
- If match not started:
  - Goes to ConductMatchPage
  - Configures match settings
  - Clicks "START MATCH"
- If match already started:
  - Goes directly to MatchScoringPage
  - Begins scoring immediately

### 6. Conducts Match
- Uses full scoring interface:
  - +1 point buttons
  - Undo last point
  - Pause/Resume timer
  - Set completion detection
  - Match completion detection

### 7. Declares Winner
- Clicks "End Match" button
- Confirms winner
- System automatically:
  - Updates match status
  - Advances winner to next round
  - Sends notifications to all parties
  - Updates bracket display

---

## Code References

### Backend
**File**: `backend/src/controllers/match.controller.js`
**Function**: `assignUmpire` (lines 1006-1095)

```javascript
const assignUmpire = async (req, res) => {
  // ... validation code ...
  
  // Send notification to umpire
  const notificationService = await import('../services/notificationService.js');
  await notificationService.default.createNotification({
    userId: umpireId,
    type: 'MATCH_ASSIGNED',
    title: '⚖️ Match Assignment',
    message: `You have been assigned as umpire for ${matchDetails}...`,
    data: { matchId, tournamentId, categoryId, ... },
    sendEmail: true
  });
  
  // ... response ...
};
```

### Frontend
**File**: `frontend/src/pages/DrawPage.jsx`

**"Assign Only" Button** (line 2577):
```javascript
<button onClick={handleAssign}>
  Assign Only
</button>
```

**"Start Match" Button** (line 2553):
```javascript
<button onClick={handleConductMatch}>
  Start Match
</button>
```

**Assign Function** (line 356):
```javascript
const assignUmpireToMatch = async (umpireId) => {
  await api.put(`/matches/${matchId}/umpire`, { umpireId });
  // Notification sent automatically by backend
};
```

---

## Testing Steps

### Test "Assign Only" Flow:
1. Login as organizer (ADMIN@gmail.com)
2. Go to tournament draw page
3. Find Match 3
4. Click "Assign Umpire" button
5. Select "Meow" from dropdown
6. Click "Assign Only" button
7. ✅ Check: Success message appears
8. ✅ Check: Meow receives notification
9. Login as Meow (meow@gmail.com)
10. ✅ Check: Notification appears in bell icon
11. ✅ Check: Email received
12. Go to Umpire Dashboard
13. ✅ Check: Match appears in assigned matches
14. Click "Start Scoring"
15. ✅ Check: Can configure and start match

### Test "Start Match" Flow:
1. Login as organizer (ADMIN@gmail.com)
2. Go to tournament draw page
3. Find Match 4
4. Click "Assign Umpire" button
5. Select "Meow" from dropdown
6. Click "Start Match" button (green)
7. ✅ Check: Redirected to ConductMatchPage
8. ✅ Check: Meow pre-selected as umpire
9. Configure match settings
10. Click "START MATCH"
11. ✅ Check: Match starts immediately
12. ✅ Check: Meow receives notification
13. Login as Meow (meow@gmail.com)
14. ✅ Check: Match shows as IN_PROGRESS
15. Click "Start Scoring"
16. ✅ Check: Goes directly to scoring page

---

## Summary

✅ **"Assign Only"** - Assigns Meow and sends notification, match stays PENDING
✅ **"Start Match"** - Assigns Meow, sends notification, AND starts match immediately
✅ **Notification sent** - Both in-app and email to meow@gmail.com
✅ **Match details included** - Round, players, court, tournament, category
✅ **Meow can conduct match** - Full access to scoring interface
✅ **Complete workflow** - From assignment to match completion

---

**Status**: ✅ FULLY IMPLEMENTED AND WORKING
**Last Updated**: January 24, 2026
