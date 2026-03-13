# Umpire Workflow - Complete Implementation

## Status: ✅ COMPLETE

All umpire workflow features have been implemented and tested.

---

## Complete Umpire Workflow

### 1. Umpire Enrollment
- Organizer enrolls umpire in tournament using umpire code system
- Umpire receives unique code (e.g., "UMP-ABC123")
- Umpire can view their code in their dashboard

### 2. Match Assignment by Organizer
**Location**: Draw Page → Match Card → "Assign Umpire" button

**What happens**:
- Organizer selects umpire from dropdown (shows enrolled umpires)
- System assigns umpire to match
- **✅ NEW**: Umpire receives notification immediately with:
  - Match details (Round name, Match number)
  - Player names (or "TBD" if not yet determined)
  - Court number (if assigned)
  - Tournament and category information
  - Direct link to start scoring

**Backend**: `PUT /api/matches/:matchId/umpire`
- Assigns umpire to match
- Sends in-app notification
- Sends email notification
- Includes all match context

### 3. Umpire Receives Notification
**Notification includes**:
```
⚖️ Match Assignment

You have been assigned as umpire for Semi Finals - Match #5
Amit Kumar vs Priya Patel
Court 2
Tournament: Ace Badminton Championship
Category: Men's Singles
```

### 4. Umpire Views Dashboard
**Location**: `/umpire/dashboard`

**Features**:
- Stats cards showing:
  - Total matches assigned
  - Completed matches
  - Upcoming matches
  - Today's matches
- "Today's Matches" section with quick access
- "All Assigned Matches" list
- Each match shows:
  - Tournament name
  - Category name
  - Match status
  - Scheduled time
  - "Start Scoring" button

### 5. Umpire Starts Match
**Two ways to access**:
1. Click "Start Scoring" from Umpire Dashboard
2. Click notification link

**Route**: `/umpire/scoring/:matchId` → Redirects to `/match/:matchId/score`

**What happens**:
- Umpire lands on ConductMatchPage
- Can configure match settings (points per set, number of sets, extension rules)
- Can assign court number (if organizer hasn't already)
- Clicks "START MATCH" button

### 6. Match Scoring
**Location**: `/match/:matchId/score` (MatchScoringPage)

**Features**:
- Full scoring interface with:
  - Live score display
  - +1 point buttons for each player
  - Undo last point
  - Pause/Resume timer
  - Set completion detection
  - Match completion detection
- Real-time score updates
- Timer tracking (with pause history)
- Automatic set progression
- Game point indicators
- Server rotation (for doubles)

### 7. Match Completion
**When umpire declares winner**:

**Backend actions** (`PUT /api/matches/:matchId/end`):
1. Updates match status to COMPLETED
2. Records winner and final score
3. Updates winner's `matchesWon` count
4. Updates loser's `matchesLost` count
5. Advances winner to next round (updates parent match)
6. Creates 3 notifications:
   - Winner: "🏆 Victory! You won [Round] - Match #X"
   - Loser: "Match Complete - [Round] - Match #X"
   - Organizer: "Match Completed: [Winner] defeated [Loser]" (includes umpire name and court)

**Frontend actions**:
- Shows Matchify-branded success modal
- Displays match summary (winner, duration, etc.)
- Redirects to Draw Page with refresh parameter
- Bracket automatically updates to show winner in next round

---

## Files Modified

### Backend
1. **`backend/src/controllers/match.controller.js`**
   - ✅ Enhanced `assignUmpire` function to send notifications
   - Includes match details, player names, court info
   - Sends both in-app and email notifications

### Frontend
2. **`frontend/src/pages/UmpireScoring.jsx`**
   - ✅ Converted to redirect component
   - Now redirects to proper MatchScoringPage
   - Maintains backward compatibility with old links

---

## API Endpoints Used

### Umpire Workflow Endpoints
- `GET /api/multi-matches/umpire` - Get matches assigned to umpire
- `PUT /api/matches/:matchId/umpire` - Assign umpire to match (sends notification)
- `GET /api/matches/:matchId` - Get match details
- `PUT /api/matches/:matchId/config` - Save match configuration
- `POST /api/matches/:matchId/start` - Start match
- `PUT /api/matches/:matchId/score` - Update live score (add point)
- `PUT /api/matches/:matchId/undo` - Undo last point
- `PUT /api/matches/:matchId/pause` - Pause timer
- `PUT /api/matches/:matchId/resume` - Resume timer
- `PUT /api/matches/:matchId/end` - End match and declare winner

---

## Testing Checklist

### ✅ Completed Tests
1. ✅ Organizer can enroll umpire using umpire code
2. ✅ Organizer can assign umpire to match from Draw Page
3. ✅ Umpire receives notification when assigned
4. ✅ Notification includes all match details
5. ✅ Umpire can view assigned matches in dashboard
6. ✅ Umpire can click "Start Scoring" from dashboard
7. ✅ Umpire can configure match settings
8. ✅ Umpire can start match
9. ✅ Umpire can add points during match
10. ✅ Umpire can undo points
11. ✅ Umpire can pause/resume timer
12. ✅ Umpire can declare winner
13. ✅ Winner advances to next round automatically
14. ✅ All parties receive notifications (winner, loser, organizer)
15. ✅ Bracket updates automatically after match completion

---

## User Story: Complete Flow

**Scenario**: Organizer "Admin" assigns umpire "Meow" to Match 3

1. **Admin** (Organizer):
   - Goes to Draw Page for tournament
   - Finds Match 3 (Quarter Finals)
   - Clicks "Assign Umpire" button
   - Selects "Meow" from dropdown
   - Clicks "Assign"
   - ✅ System confirms: "Umpire assigned and notified"

2. **Meow** (Umpire):
   - Receives notification: "⚖️ Match Assignment - Quarter Finals - Match #3"
   - Logs into Matchify
   - Goes to Umpire Dashboard
   - Sees Match 3 in "Today's Matches" section
   - Clicks "Start Scoring"
   - Configures match (21 points, 3 sets, extension ON)
   - Clicks "START MATCH"
   - Scores match point by point
   - Uses pause/resume as needed
   - Declares winner when match completes
   - ✅ System shows success modal with match summary

3. **System** (Automatic):
   - Updates match status to COMPLETED
   - Records winner and score
   - Advances winner to Semi Finals (Match 5)
   - Sends notifications to:
     - Winner: "🏆 Victory!"
     - Loser: "Match Complete"
     - Organizer: "Match Completed: [Winner] defeated [Loser] - Umpire: Meow - Court: 2"
   - Updates bracket display
   - ✅ Winner now appears in Semi Finals bracket

---

## Key Features

### Notifications
- ✅ In-app notifications with bell icon
- ✅ Email notifications
- ✅ Rich notification content (match details, players, court)
- ✅ Direct links to relevant pages

### Real-time Updates
- ✅ Live score updates during match
- ✅ Bracket updates after match completion
- ✅ Automatic winner advancement

### User Experience
- ✅ Clear workflow from assignment to completion
- ✅ Intuitive scoring interface
- ✅ Matchify-branded modals (no browser alerts)
- ✅ Responsive design for mobile umpiring

### Data Integrity
- ✅ Complete match history tracking
- ✅ Timer with pause tracking
- ✅ Score history for undo functionality
- ✅ Winner/loser statistics updated

---

## Notes

- Umpire must be enrolled in tournament before being assigned to matches
- Court numbers can be assigned by organizer OR umpire (removed from scoring page per user request)
- Match configuration can be set before match starts (points per set, number of sets, extension rules)
- Timer automatically tracks pauses and calculates net match duration
- All scoring logic follows official badminton rules (21 points, 2-point lead, extension to 30)

---

## Related Documentation

- `TASK_5_COMPLETE.md` - Match completion and bracket advancement
- `DRAW_PAGE_FIX_SUMMARY.md` - Bracket display and winner advancement
- `SCORING_SYSTEM_GUIDE.md` - Complete scoring system documentation
- `TEST_SCORING_NOW.md` - Scoring system testing guide

---

**Last Updated**: January 24, 2026
**Status**: Production Ready ✅
