# Complete Guide: Round Robin + Knockout Tournament System

## Date: January 25, 2026

---

# TABLE OF CONTENTS

1. [Tournament Overview](#tournament-overview)
2. [Stage 1: Round Robin Phase](#stage-1-round-robin-phase)
3. [Stage 2: Knockout Phase](#stage-2-knockout-phase)
4. [Organizer's Complete Journey](#organizers-complete-journey)
5. [Player's Complete Journey](#players-complete-journey)
6. [Umpire's Complete Journey](#umpires-complete-journey)
7. [All Buttons Explained](#all-buttons-explained)

---

# TOURNAMENT OVERVIEW

## What is Round Robin + Knockout Format?

This is a **TWO-STAGE tournament**:

### Stage 1: Round Robin (Group Stage)
- Players are divided into **groups** (Pool A, Pool B, etc.)
- **Everyone plays everyone** in their group
- Players earn **points** for wins (2 points per win, 0 for loss)
- **Rankings** are created based on points

### Stage 2: Knockout (Elimination Stage)
- **Top players** from each group advance
- **Single elimination** - lose once and you're out
- Winners advance to next round
- Final match determines the champion

---

# STAGE 1: ROUND ROBIN PHASE

## 1. TOURNAMENT CREATION (Organizer)

### What Happens:
The organizer creates a tournament and chooses **"Round Robin + Knockout"** format.

### Configuration:
- **Total Players**: How many players will register (e.g., 28 players)
- **Number of Groups**: How many pools to divide players into (e.g., 2 groups = Pool A and Pool B)
- **Group Sizes**: How many players in each group (can be different sizes)
- **Players Advancing**: How many from each group go to knockout (e.g., 2 from each group = 4 total in knockout)

### Example Setup:
```
Total Players: 28
Groups: 2 (Pool A and Pool B)
Pool A: 14 players
Pool B: 14 players
Advancing: Top 2 from each pool (4 players total to knockout)
```

---

## 2. PLAYER REGISTRATION

### What Happens:
- Players register for the tournament
- They pay entry fee
- They select their category (Men's Singles, Women's Singles, etc.)

### Organizer's View:
- Sees list of registered players
- Can approve/reject registrations
- Can confirm payments

---

## 3. DRAW CREATION (Organizer)

### Button: "Create Draw" or "Publish Draw"

### What Happens:
1. System takes all confirmed players
2. Divides them into groups (Pool A, Pool B)
3. Creates **Round Robin matches** for each group
4. Every player plays every other player in their group

### Example:
**Pool A has 4 players:**
- Match 1: Player 1 vs Player 2
- Match 2: Player 1 vs Player 3
- Match 3: Player 1 vs Player 4
- Match 4: Player 2 vs Player 3
- Match 5: Player 2 vs Player 4
- Match 6: Player 3 vs Player 4

**Total: 6 matches** (everyone plays everyone once)

### After Draw Creation:
- Players can see their matches
- Matches show as "PENDING" (not started)
- No umpires assigned yet

---

## 4. VIEWING THE DRAW

### Tab: "Stage 1 - Round Robin"

### What You See:

#### Left Side: Match List
Shows all matches in the group:
```
Match 1: Player A vs Player B
Status: PENDING
[Assign Umpire] button (for organizer)
```

#### Right Side: Group Standings Table
Shows player rankings:
```
Rank | Player      | P | W | L | Pts
1    | Player A    | 3 | 3 | 0 | 6
2    | Player B    | 3 | 2 | 1 | 4
3    | Player C    | 3 | 1 | 2 | 2
4    | Player D    | 3 | 0 | 3 | 0
```

**Legend:**
- **P** = Played (matches completed)
- **W** = Wins
- **L** = Losses
- **Pts** = Points (2 per win, 0 per loss)

---

## 5. ASSIGNING UMPIRES (Organizer)

### Button: "Assign Umpire" (on each match)

### What Happens:
1. Organizer clicks "Assign Umpire" button
2. Modal opens showing list of available umpires
3. Organizer selects an umpire
4. Organizer can set scheduled time (optional)
5. Clicks "Assign"

### After Assignment:
- Match shows "Ready" status
- Umpire receives notification
- Umpire can see the match in their dashboard
- Button changes to show umpire is assigned

---

## 6. CONDUCTING MATCHES (Umpire)

### Umpire's Dashboard:
Shows all matches assigned to them:
```
Match 1: Player A vs Player B
Status: READY
[Start Match] button
```

### Button: "Start Match"

### What Happens:
1. Umpire clicks "Start Match"
2. Opens scoring page
3. Match status changes to "IN PROGRESS"
4. Live scoring begins

### Scoring Page:
- Shows both players' names
- Score buttons for each player
- Set-by-set scoring
- Game point indicators
- Match timer
- [Complete Match] button when done

### During Match:
- Umpire taps player's name to add points
- System tracks sets and games
- Shows who's serving
- Validates badminton rules (21 points, 2-point lead, etc.)

### Button: "Complete Match"

### What Happens:
1. Umpire clicks "Complete Match"
2. Confirms the winner
3. Match status changes to "COMPLETED"
4. Winner gets 2 points in standings
5. Loser gets 0 points
6. Standings table updates automatically

---

## 7. MATCH PROGRESSION

### As Matches Complete:
- Standings table updates in real-time
- Players move up/down in rankings
- Points accumulate
- Everyone can see current standings

### When All Round Robin Matches Complete:
- Final standings are locked
- Top players are identified (e.g., top 2 from each group)
- System is ready for knockout stage

---

# STAGE 2: KNOCKOUT PHASE

## 8. ARRANGING KNOCKOUT MATCHUPS (Organizer)

### Button: "Arrange Knockout Matchups"

### When It Appears:
- After ALL Round Robin matches are completed
- Only visible to organizer
- Located in the header area

### What Happens When Clicked:

#### Modal Opens: "Arrange Knockout Matchups"

**Top Section: Advancing Players (4)**
Shows the top players from Round Robin:
```
┌─────────────────────────────────────────────────────┐
│ Ananya Iyer                                         │
│ Pool A • Rank #1 • 6 pts                           │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Akash Pandey                                        │
│ Pool A • Rank #2 • 4 pts                           │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Arjun Mehta                                         │
│ Pool B • Rank #1 • 6 pts                           │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Divya Gupta                                         │
│ Pool B • Rank #2 • 4 pts                           │
└─────────────────────────────────────────────────────┘
```

**Bottom Section: Knockout Matches**

The organizer decides who plays who:

```
Match 1 (Semi-Final)
Player 1: [Select player...] ▼
Player 2: [Select player...] ▼

Match 2 (Semi-Final)
Player 1: [Select player...] ▼
Player 2: [Select player...] ▼
```

### Organizer's Choices:

**Option 1: Traditional Seeding**
- Match 1: Pool A #1 vs Pool B #2
- Match 2: Pool B #1 vs Pool A #2

**Option 2: Custom Matchups**
- Organizer can choose ANY combination
- Complete flexibility
- Can avoid same-pool matchups
- Can create interesting matchups

### Example Selection:
```
Match 1: Ananya Iyer vs Divya Gupta
Match 2: Arjun Mehta vs Akash Pandey
```

### Buttons:
- **Cancel**: Close modal without saving
- **Save Matchups**: Create knockout bracket with selected players

---

## 9. SAVING KNOCKOUT MATCHUPS

### Button: "Save Matchups"

### What Happens (Behind the Scenes):
1. System creates fresh knockout bracket
2. **Resets all old data** (if knockout was attempted before)
3. Assigns the 4 selected players to Semi-Final matches
4. Sets all matches to **PENDING** status
5. Creates Final match (winner TBD)
6. Saves everything to database

### What You See:
1. Success message: "Knockout matchups arranged successfully!"
2. Modal closes
3. **Automatically switches to "Stage 2 - Knockout" tab**
4. Knockout bracket appears

---

## 10. VIEWING KNOCKOUT BRACKET

### Tab: "Stage 2 - Knockout"

### What You See:

**Visual Bracket Layout (Left to Right):**

```
┌─────────────────────┐
│   SEMI FINALS       │
│                     │
│ Match 1             │
│ Ananya Iyer         │
│ vs                  │
│ Divya Gupta         │
│                     │
│ Status: PENDING     │
│ [Assign Umpire]     │
└─────────────────────┘
         │
         │ Winner advances
         ↓
┌─────────────────────┐         ┌─────────────────────┐
│   SEMI FINALS       │         │      FINAL          │
│                     │    ───→ │                     │
│ Match 2             │         │ Match 3             │
│ Arjun Mehta         │         │ TBD vs TBD          │
│ vs                  │         │                     │
│ Akash Pandey        │         │ Status: PENDING     │
│                     │         │ (Waiting for        │
│ Status: PENDING     │         │  semi-final         │
│ [Assign Umpire]     │         │  winners)           │
└─────────────────────┘         └─────────────────────┘
         │
         │ Winner advances
         ↓
```

### Match Cards Show:
- **Round name**: "Semi Finals" or "Final"
- **Match number**: Match 1, Match 2, Match 3
- **Player names**: Full names of both players
- **Status**: PENDING (not started)
- **No scores** (matches haven't been played)
- **No winners** (no crown icons)
- **No "DONE" badges**
- **[Assign Umpire] button** (for organizer)

---

## 11. ASSIGNING UMPIRES TO KNOCKOUT MATCHES (Organizer)

### Button: "Assign Umpire" (on each knockout match)

### Same Process as Round Robin:
1. Click "Assign Umpire"
2. Select umpire from list
3. Set scheduled time (optional)
4. Click "Assign"

### After Assignment:
- Match shows "Ready" status
- Umpire receives notification
- Umpire can start the match

---

## 12. CONDUCTING KNOCKOUT MATCHES (Umpire)

### Semi-Final Matches (Match 1 & 2)

#### Umpire's Process:
1. Goes to their dashboard
2. Sees assigned knockout match
3. Clicks "Start Match"
4. Scoring page opens
5. Conducts match exactly like Round Robin
6. Enters scores set by set
7. Clicks "Complete Match"
8. Confirms winner

#### What Happens After Semi-Final Completes:
1. Match shows "COMPLETED" status
2. Winner is determined
3. **Winner automatically advances to Final**
4. Final match updates with winner's name
5. Loser is eliminated from tournament

### Example:
```
Match 1 Result: Ananya Iyer defeats Divya Gupta (21-15, 21-18)
Match 2 Result: Arjun Mehta defeats Akash Pandey (21-19, 18-21, 21-16)

Final Match Updates:
Match 3: Ananya Iyer vs Arjun Mehta
```

---

## 13. THE FINAL MATCH

### After Both Semi-Finals Complete:

**Final Match Card Shows:**
```
┌─────────────────────┐
│      FINAL          │
│                     │
│ Match 3             │
│ Ananya Iyer         │
│ vs                  │
│ Arjun Mehta         │
│                     │
│ Status: PENDING     │
│ [Assign Umpire]     │
└─────────────────────┘
```

### Organizer:
1. Assigns umpire to Final match
2. Sets scheduled time

### Umpire:
1. Starts Final match
2. Conducts match
3. Enters scores
4. Completes match
5. Confirms winner

### After Final Completes:
1. **Tournament Champion is determined**
2. Winner gets 1st place
3. Loser gets 2nd place
4. Semi-final losers get 3rd place (tied)
5. Tournament is complete

---

# ORGANIZER'S COMPLETE JOURNEY

## Step-by-Step Process:

### 1. CREATE TOURNAMENT
- Set tournament name, date, location
- Choose "Round Robin + Knockout" format
- Configure groups and advancement rules

### 2. MANAGE REGISTRATIONS
- Review player registrations
- Approve/reject players
- Confirm payments

### 3. CREATE DRAW
- Click "Create Draw" button
- System generates Round Robin matches
- Draw is published to players

### 4. ASSIGN UMPIRES TO ROUND ROBIN
- Go to "Stage 1 - Round Robin" tab
- Click "Assign Umpire" on each match
- Select umpire and set time
- Repeat for all matches

### 5. MONITOR ROUND ROBIN PROGRESS
- Watch matches being completed
- See standings update in real-time
- Wait for all matches to finish

### 6. ARRANGE KNOCKOUT MATCHUPS
- Click "Arrange Knockout Matchups" button
- See top 4 players from Round Robin
- Select players for Match 1 (Semi-Final)
- Select players for Match 2 (Semi-Final)
- Click "Save Matchups"

### 7. VIEW KNOCKOUT BRACKET
- Automatically switches to "Stage 2 - Knockout" tab
- See fresh knockout bracket
- All matches show as PENDING

### 8. ASSIGN UMPIRES TO KNOCKOUT
- Click "Assign Umpire" on Match 1
- Click "Assign Umpire" on Match 2
- Wait for semi-finals to complete

### 9. ASSIGN UMPIRE TO FINAL
- After semi-finals complete
- Click "Assign Umpire" on Final match
- Set time for championship match

### 10. TOURNAMENT COMPLETE
- Final match completes
- Champion is crowned
- View final results and statistics

---

# PLAYER'S COMPLETE JOURNEY

## Step-by-Step Experience:

### 1. REGISTER FOR TOURNAMENT
- Browse available tournaments
- Click "Register"
- Pay entry fee
- Upload payment screenshot
- Wait for approval

### 2. REGISTRATION CONFIRMED
- Receive confirmation notification
- See tournament in "My Registrations"
- Wait for draw to be published

### 3. VIEW ROUND ROBIN DRAW
- Receive notification: "Draw published"
- Go to tournament page
- Click "Stage 1 - Round Robin" tab
- See all their matches
- See their group (Pool A or Pool B)

### 4. PLAY ROUND ROBIN MATCHES
- Wait for match to be scheduled
- Receive notification when umpire assigned
- Go to venue at scheduled time
- Play match with umpire scoring
- Match completes, see result

### 5. TRACK STANDINGS
- After each match, check standings table
- See their rank in group
- See points accumulated
- See wins and losses

### 6. ROUND ROBIN COMPLETES
- All matches in group finished
- Final standings determined
- See if they qualified for knockout
- Top 2 from each group advance

### 7. IF QUALIFIED: VIEW KNOCKOUT BRACKET
- Receive notification: "You've advanced to knockout!"
- Go to "Stage 2 - Knockout" tab
- See their semi-final match
- See opponent (from other group)

### 8. PLAY SEMI-FINAL
- Wait for match to be scheduled
- Receive notification
- Go to venue
- Play knockout match
- **Win = Advance to Final**
- **Lose = Eliminated (3rd place)**

### 9. IF WIN SEMI-FINAL: PLAY FINAL
- Receive notification: "You're in the Final!"
- See Final match on bracket
- Wait for scheduling
- Play championship match
- **Win = Champion (1st place)**
- **Lose = Runner-up (2nd place)**

### 10. TOURNAMENT COMPLETE
- See final placement
- View tournament results
- Receive points/ranking updates

---

# UMPIRE'S COMPLETE JOURNEY

## Step-by-Step Experience:

### 1. RECEIVE ASSIGNMENT
- Organizer assigns them to a match
- Receive notification: "You've been assigned to Match X"
- See match in their dashboard

### 2. VIEW MATCH DETAILS
- Go to "Umpire Dashboard"
- See list of assigned matches
- See player names, scheduled time
- See match status (READY)

### 3. START MATCH
- At scheduled time, go to court
- Click "Start Match" button
- Scoring page opens
- Match status changes to "IN PROGRESS"

### 4. CONDUCT MATCH
- Players warm up
- Match begins
- Tap player name to add points
- System tracks sets and games
- Shows game point indicators
- Shows who's serving
- Validates badminton rules

### 5. SCORE ENTRY
- Player A scores: Tap "Player A" name
- Player B scores: Tap "Player B" name
- System automatically:
  - Tracks games (first to 21)
  - Tracks sets (best of 3)
  - Handles deuce (20-20, need 2-point lead)
  - Switches sides at 11 points in set 3

### 6. COMPLETE MATCH
- Match finishes (player wins 2 sets)
- Click "Complete Match" button
- Confirm winner
- Match status changes to "COMPLETED"

### 7. AFTER MATCH
- Match shows in history
- Winner advances (in knockout)
- Standings update (in round robin)
- Umpire can view match details anytime

### 8. REPEAT FOR NEXT MATCHES
- See next assigned match
- Start and conduct
- Complete and confirm
- Continue until tournament ends

---

# ALL BUTTONS EXPLAINED

## ORGANIZER BUTTONS

### 1. "Create Draw"
- **Location**: Tournament management page
- **When**: After players register and are confirmed
- **What it does**: Creates Round Robin matches for all groups
- **Result**: Draw is published, players can see matches

### 2. "Arrange Knockout Matchups"
- **Location**: Draw page header (after Round Robin completes)
- **When**: All Round Robin matches are completed
- **What it does**: Opens modal to select which 4 players advance and their matchups
- **Result**: Knockout bracket is created

### 3. "Save Matchups"
- **Location**: Inside "Arrange Knockout Matchups" modal
- **When**: After selecting players for semi-final matches
- **What it does**: 
  - Resets all knockout match data
  - Assigns selected players to matches
  - Creates fresh PENDING matches
  - Auto-switches to Knockout tab
- **Result**: Knockout bracket appears with 4 players, ready for umpire assignment

### 4. "Assign Umpire"
- **Location**: On each match card (Round Robin and Knockout)
- **When**: Match is created and needs an umpire
- **What it does**: Opens modal to select umpire and set time
- **Result**: Umpire is assigned, receives notification, match is ready

### 5. "Edit Group Sizes"
- **Location**: Draw page header (before matches are played)
- **When**: Draw is created but no matches played yet
- **What it does**: Opens modal to change group sizes
- **Result**: Groups are reconfigured, matches regenerated

### 6. "Restart Draws"
- **Location**: Draw page header
- **When**: Organizer wants to start over
- **What it does**: Deletes all matches and resets draw
- **Result**: Clean slate, can create new draw

### 7. "Delete Draw"
- **Location**: Draw page header
- **When**: Organizer wants to completely remove draw
- **What it does**: Deletes entire draw and all matches
- **Result**: Draw is removed, back to pre-draw state

### 8. "Stage 1 - Round Robin" Tab
- **Location**: Top of draw page
- **When**: Always visible
- **What it does**: Shows Round Robin matches and standings
- **Result**: View group stage matches

### 9. "Stage 2 - Knockout" Tab
- **Location**: Top of draw page (next to Round Robin tab)
- **When**: Always visible
- **What it does**: Shows knockout bracket
- **Result**: View elimination stage matches

### 10. "Change Result"
- **Location**: On completed match cards
- **When**: Match is completed and organizer needs to fix result
- **What it does**: Opens modal to change winner
- **Result**: Match result is updated, standings recalculated

### 11. "View Details" (Info Icon)
- **Location**: On completed match cards
- **When**: Match is completed
- **What it does**: Opens modal showing full match details
- **Result**: See complete score breakdown, sets, games, time

---

## UMPIRE BUTTONS

### 1. "Start Match"
- **Location**: Umpire dashboard, on assigned match
- **When**: Match is ready (umpire assigned)
- **What it does**: Opens scoring page, starts match timer
- **Result**: Match status changes to "IN PROGRESS"

### 2. Player Name Buttons (Scoring)
- **Location**: Scoring page, both player names are buttons
- **When**: During match
- **What it does**: Adds 1 point to that player
- **Result**: Score updates, game/set tracking automatic

### 3. "Undo" Button
- **Location**: Scoring page
- **When**: During match, if mistake made
- **What it does**: Removes last point scored
- **Result**: Score goes back one point

### 4. "Complete Match"
- **Location**: Scoring page
- **When**: Match is finished (player wins 2 sets)
- **What it does**: Ends match, confirms winner
- **Result**: Match status changes to "COMPLETED", winner determined

### 5. "Request Score Correction"
- **Location**: After match is completed
- **When**: Umpire realizes mistake after completing
- **What it does**: Sends request to organizer to fix score
- **Result**: Organizer can review and approve correction

---

## PLAYER BUTTONS

### 1. "Register"
- **Location**: Tournament detail page
- **When**: Tournament is open for registration
- **What it does**: Opens registration form
- **Result**: Player registers, pays fee, waits for approval

### 2. "Upload Payment Screenshot"
- **Location**: Registration form
- **When**: During registration
- **What it does**: Opens file picker to upload payment proof
- **Result**: Payment screenshot attached to registration

### 3. "View Draw"
- **Location**: Tournament page, after draw is published
- **When**: Draw is created by organizer
- **What it does**: Shows player their matches
- **Result**: Player sees all their Round Robin matches

### 4. "View Match Details"
- **Location**: On completed matches
- **When**: After match is completed
- **What it does**: Opens modal with full match details
- **Result**: Player sees complete score breakdown

### 5. "Stage 1 - Round Robin" Tab
- **Location**: Draw page
- **When**: Always visible
- **What it does**: Shows Round Robin matches
- **Result**: Player sees their group matches

### 6. "Stage 2 - Knockout" Tab
- **Location**: Draw page
- **When**: Always visible (if qualified)
- **What it does**: Shows knockout bracket
- **Result**: Player sees their knockout matches

---

## MATCH STATUS INDICATORS

### 1. "PENDING"
- **Meaning**: Match not started yet
- **Color**: Purple/Gray
- **What player sees**: Waiting for umpire assignment

### 2. "READY"
- **Meaning**: Umpire assigned, ready to start
- **Color**: Blue
- **What player sees**: Match scheduled, umpire assigned

### 3. "IN PROGRESS" / "LIVE"
- **Meaning**: Match currently being played
- **Color**: Green
- **What player sees**: Match is happening now

### 4. "COMPLETED" / "DONE"
- **Meaning**: Match finished, winner determined
- **Color**: Orange/Yellow
- **What player sees**: Match result, winner shown with crown icon

---

## VISUAL INDICATORS

### 1. Crown Icon 👑
- **Meaning**: Winner of the match
- **Location**: Next to player name on completed matches
- **Color**: Gold/Yellow

### 2. Score Display
- **Format**: "21-15, 21-18" (set scores)
- **Location**: Center of match card
- **Meaning**: Final score of each set

### 3. Rank Badges
- **Format**: #1, #2, #3, #4
- **Location**: Standings table
- **Colors**: 
  - #1 = Gold
  - #2 = Silver
  - #3 = Bronze
  - #4+ = Gray

### 4. Points Display
- **Format**: "6 pts", "4 pts", "2 pts"
- **Location**: Standings table, player cards
- **Meaning**: Total points earned (2 per win)

---

## NAVIGATION FLOW

### Organizer Flow:
```
Create Tournament
    ↓
Manage Registrations
    ↓
Create Draw
    ↓
[Stage 1 - Round Robin] Tab
    ↓
Assign Umpires to all matches
    ↓
Wait for matches to complete
    ↓
All Round Robin matches done
    ↓
[Arrange Knockout Matchups] Button
    ↓
Select 4 players
    ↓
[Save Matchups] Button
    ↓
Auto-switch to [Stage 2 - Knockout] Tab
    ↓
Assign Umpires to Semi-Finals
    ↓
Wait for Semi-Finals to complete
    ↓
Assign Umpire to Final
    ↓
Final completes
    ↓
Tournament Complete!
```

### Player Flow:
```
Register for Tournament
    ↓
Wait for approval
    ↓
Registration confirmed
    ↓
Wait for draw
    ↓
Draw published
    ↓
[Stage 1 - Round Robin] Tab
    ↓
See all their matches
    ↓
Play matches (umpire scores)
    ↓
Check standings after each match
    ↓
All Round Robin matches done
    ↓
Check if qualified (Top 2)
    ↓
If YES: [Stage 2 - Knockout] Tab
    ↓
See Semi-Final match
    ↓
Play Semi-Final
    ↓
If WIN: See Final match
    ↓
Play Final
    ↓
If WIN: Champion! 🏆
```

### Umpire Flow:
```
Receive assignment notification
    ↓
Go to Umpire Dashboard
    ↓
See assigned match
    ↓
[Start Match] Button
    ↓
Scoring page opens
    ↓
Tap player names to score
    ↓
Match progresses (sets, games)
    ↓
Match finishes
    ↓
[Complete Match] Button
    ↓
Confirm winner
    ↓
Match completed
    ↓
Next match assignment
```

---

# KEY DIFFERENCES: ROUND ROBIN vs KNOCKOUT

## Round Robin (Stage 1)

### Purpose:
- Determine rankings
- Everyone plays multiple matches
- Accumulate points

### Characteristics:
- **No elimination** - lose and still play more matches
- **Points system** - 2 points per win
- **Multiple matches** - play everyone in group
- **Standings table** - see rankings
- **Top players advance** - best performers go to knockout

### Match Results:
- Winner gets 2 points
- Loser gets 0 points
- Both continue playing

---

## Knockout (Stage 2)

### Purpose:
- Determine champion
- Single elimination
- Crown the winner

### Characteristics:
- **Elimination** - lose once and you're out
- **No points** - just win or go home
- **Single matches** - one chance only
- **Bracket format** - visual tree
- **Winner advances** - loser is eliminated

### Match Results:
- Winner advances to next round
- Loser is eliminated from tournament
- Final winner is champion

---

# SUMMARY

## The Complete System:

1. **Tournament Created** - Organizer sets up Round Robin + Knockout format
2. **Players Register** - Players sign up and pay
3. **Draw Created** - Round Robin matches generated
4. **Stage 1 Begins** - Round Robin matches played
5. **Umpires Score** - Matches conducted and scored
6. **Standings Update** - Rankings determined by points
7. **Stage 1 Completes** - All Round Robin matches done
8. **Knockout Arranged** - Organizer selects top 4 players
9. **Stage 2 Begins** - Knockout bracket created
10. **Semi-Finals Played** - 4 players, 2 matches
11. **Winners Advance** - 2 players go to Final
12. **Final Played** - Championship match
13. **Champion Crowned** - Tournament complete!

---

## Key Features:

✅ **Two distinct stages** - Group play then elimination
✅ **Flexible advancement** - Organizer chooses who advances
✅ **Complete control** - Organizer arranges matchups
✅ **Fresh knockout** - All matches start as PENDING
✅ **No automatic advancement** - Manual selection only
✅ **Auto-navigation** - Switches to Knockout tab automatically
✅ **Real-time updates** - Standings and brackets update live
✅ **Multiple roles** - Organizer, Player, Umpire all have different views
✅ **Complete tracking** - Every match, score, and result recorded

---

# END OF GUIDE

This is the complete, detailed explanation of how Round Robin + Knockout tournaments work in Matchify.pro, including every button, every action, and every step of the process from all perspectives!
