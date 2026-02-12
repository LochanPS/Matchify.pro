# 🏆 Leaderboard System - Complete Explanation

## Overview

The leaderboard system ranks players based on **tournament points** earned from their performance across all tournaments. It's a global ranking system that rewards both participation and achievement.

## Points System

### How Points Are Awarded

Points are awarded based on tournament placement:

| Placement | Points | Icon |
|-----------|--------|------|
| **Winner** | 10 points | 👑 Crown |
| **Runner-up** | 8 points | 🥈 Silver Medal |
| **Semi-finalist** | 6 points | 🥉 Bronze Medal |
| **Quarter-finalist** | 4 points | 🎖️ Award |
| **Participation** | 2 points | 🎯 Target |

### Point Calculation Logic

**File:** `backend/src/services/tournamentPoints.service.js`

```javascript
// When tournament ends, points are awarded:
1. Winner gets 10 points
2. Runner-up gets 8 points
3. Semi-finalists (2 players) get 6 points each
4. Quarter-finalists (4 players) get 4 points each
5. Everyone else gets 2 points for participation
```

## How It Works

### 1. Tournament Completion

When a tournament ends (organizer clicks "End Tournament"):

**File:** `backend/src/controllers/tournament.controller.js`

```javascript
// Tournament ends
tournament.status = 'COMPLETED'

// Points are awarded to all players
await tournamentPointsService.awardTournamentPoints(tournamentId, categoryId)
```

### 2. Determining Placements

**File:** `backend/src/services/tournamentPoints.service.js` - `determinePlacements()`

The system analyzes completed matches to determine placements:

```javascript
// Winner & Runner-up
- Stored in category.winnerId and category.runnerUpId
- Set when final match is completed

// Semi-finalists
- Losers of semi-final matches (round 2)
- 2 players who lost in semi-finals

// Quarter-finalists  
- Losers of quarter-final matches (round 3)
- 4 players who lost in quarter-finals

// Participants
- Everyone else who registered and confirmed
```

### 3. Awarding Points

**File:** `backend/src/services/tournamentPoints.service.js` - `awardPoints()`

For each player:

```javascript
// 1. Update user's total points
user.totalPoints += points

// 2. Update player profile
playerProfile.matchifyPoints += points

// 3. Send notification
"🏆 You earned {points} points for {placement}!"
```

### 4. Calculating Leaderboard

**File:** `backend/src/services/tournamentPoints.service.js` - `getLeaderboard()`

```javascript
// Fetch all players
SELECT * FROM users 
WHERE roles CONTAINS 'PLAYER'
ORDER BY totalPoints DESC
LIMIT 100

// Add rank (1, 2, 3, ...)
// Calculate win rate
winRate = (matchesWon / (matchesWon + matchesLost)) * 100
```

## Data Structure

### User Model (Points Storage)

```javascript
User {
  id: string
  name: string
  totalPoints: int        // ⭐ Main leaderboard metric
  tournamentsPlayed: int  // Count of tournaments
  matchesWon: int         // Total wins
  matchesLost: int        // Total losses
  profilePhoto: string
  city: string
  state: string
}
```

### PlayerProfile Model (Additional Stats)

```javascript
PlayerProfile {
  userId: string
  matchifyPoints: int     // Same as user.totalPoints
  tournamentsPlayed: int
  matchesWon: int
  matchesLost: int
}
```

### Notification Model (Point Awards)

```javascript
Notification {
  userId: string
  type: 'POINTS_AWARDED'
  title: '🏆 Tournament Points Awarded!'
  message: 'You earned 10 points for winning the tournament!'
  data: {
    tournamentId: string
    categoryId: string
    points: int
    placement: string
  }
}
```

## Frontend Display

### Leaderboard Page

**File:** `frontend/src/pages/Leaderboard.jsx`

**Features:**
1. **Top 3 Podium** - Special display for top 3 players
2. **My Rank Card** - Shows logged-in user's rank
3. **Full Table** - All players with stats
4. **Points Info** - How points are earned

**Data Displayed:**
- Rank (with special badges for top 10)
- Player name and photo
- Total points (⭐ main metric)
- Tournaments played
- Matches (W-L record)
- Win rate percentage

### Rank Badges

```javascript
Rank 1: Gold gradient (👑 Crown icon)
Rank 2: Silver gradient (🥈 Medal icon)
Rank 3: Bronze gradient (🥉 Medal icon)
Rank 4-10: Purple gradient (#4-10)
Rank 11+: Gray badge
```

## API Endpoints

### 1. Get Leaderboard
```
GET /api/leaderboard?limit=100
```

**Response:**
```json
{
  "success": true,
  "leaderboard": [
    {
      "rank": 1,
      "id": "user-id",
      "name": "Player Name",
      "totalPoints": 150,
      "tournamentsPlayed": 15,
      "matchesWon": 45,
      "matchesLost": 12,
      "winRate": "78.9",
      "profilePhoto": "url",
      "city": "Mumbai",
      "state": "Maharashtra"
    }
  ],
  "total": 100
}
```

### 2. Get My Rank
```
GET /api/leaderboard/my-rank
Headers: Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "rank": {
    "rank": 3,
    "id": "user-id",
    "name": "PS Pradyumna",
    "totalPoints": 0,
    "tournamentsPlayed": 0,
    "matchesWon": 0,
    "matchesLost": 0,
    "winRate": "0"
  }
}
```

### 3. Get Player Rank
```
GET /api/leaderboard/player/:userId
```

**Response:** Same as "Get My Rank"

## Point Award Flow

### Complete Flow Diagram

```
Tournament Ends
    ↓
Organizer clicks "End Tournament"
    ↓
Backend: tournament.status = 'COMPLETED'
    ↓
Backend: awardTournamentPoints(tournamentId, categoryId)
    ↓
Analyze all completed matches
    ↓
Determine placements:
  - Winner (from category.winnerId)
  - Runner-up (from category.runnerUpId)
  - Semi-finalists (losers of round 2)
  - Quarter-finalists (losers of round 3)
  - Participants (everyone else)
    ↓
Award points to each player:
  - Update user.totalPoints
  - Update playerProfile.matchifyPoints
  - Create notification
    ↓
Leaderboard automatically updates
    ↓
Players see new ranks
```

## Example Scenario

### Tournament: "Ace Badminton Championship"
**Category:** Men's Singles
**Participants:** 16 players

### Results:
1. **Winner:** Rahul Verma → 10 points
2. **Runner-up:** Arjun Mehta → 8 points
3. **Semi-finalists:**
   - Rohan Chopra → 6 points
   - Nikhil Agarwal → 6 points
4. **Quarter-finalists:**
   - Aditya Kapoor → 4 points
   - Akash Pandey → 4 points
   - Gaurav Bhatt → 4 points
   - Manish Saxena → 4 points
5. **Participants (8 players):**
   - Each gets 2 points

**Total Points Distributed:** 10 + 8 + 12 + 16 + 16 = **62 points**

### After Tournament:
- Rahul's total: 50 → 60 points (moved up 2 ranks)
- Arjun's total: 45 → 53 points (moved up 1 rank)
- All players receive notifications

## Leaderboard Features

### 1. Real-time Updates
- Updates immediately after tournament ends
- No manual refresh needed
- Points reflect instantly

### 2. Ranking System
- Rank based on total points
- Ties broken by tournaments played
- Then by win rate

### 3. Statistics Tracked
- Total points (main metric)
- Tournaments played
- Matches won/lost
- Win rate percentage
- Current rank

### 4. Visual Hierarchy
- Top 3 get special podium display
- Top 10 get purple badges
- Your rank highlighted in purple

### 5. Player Profiles
- Click any player to view profile
- See detailed tournament history
- View match records

## Database Queries

### Get Top 100 Players
```sql
SELECT * FROM users
WHERE roles LIKE '%PLAYER%'
ORDER BY totalPoints DESC
LIMIT 100
```

### Get Player Rank
```sql
-- Count players with more points
SELECT COUNT(*) FROM users
WHERE totalPoints > {userPoints}
AND roles LIKE '%PLAYER%'

-- Rank = count + 1
```

### Update Points
```sql
-- Update user
UPDATE users
SET totalPoints = totalPoints + {points}
WHERE id = {userId}

-- Update profile
UPDATE playerProfiles
SET matchifyPoints = matchifyPoints + {points}
WHERE userId = {userId}
```

## Key Files

### Backend:
1. **tournamentPoints.service.js** - Core points logic
2. **leaderboard.routes.js** - API endpoints
3. **tournament.controller.js** - Tournament end trigger

### Frontend:
1. **Leaderboard.jsx** - Main leaderboard page
2. **LeaderboardTable.jsx** - Table component
3. **points.js** - API calls

## Current Status (Your Screenshot)

From your screenshot:
- **Your Rank:** #3
- **Your Points:** 0 pts
- **Tournaments:** 0
- **Win Rate:** 0%

This means:
- You're ranked 3rd among all players
- You haven't earned points yet (no completed tournaments)
- Once you complete a tournament, points will be awarded
- Your rank will update based on your placement

## How to Earn Points

### As a Player:
1. Register for tournaments
2. Participate and play matches
3. Win matches to advance
4. Reach higher placements for more points
5. Points awarded when tournament ends

### Point Strategy:
- **Participation:** Always get 2 points minimum
- **Advance far:** Quarter-finals = 4 points
- **Reach semis:** Semi-finals = 6 points
- **Make finals:** Runner-up = 8 points
- **Win it all:** Winner = 10 points

## Summary

The leaderboard system:
- ✅ Tracks player performance across all tournaments
- ✅ Awards points based on placement
- ✅ Ranks players globally
- ✅ Updates automatically when tournaments end
- ✅ Shows detailed statistics
- ✅ Encourages participation and competition
- ✅ Fair and transparent point system

**Your current rank (#3 with 0 points) will change once you complete your first tournament!** 🏆
