# 🌍 Geographical Leaderboard Feature - COMPLETE

## What Was Added

Added **3 geographical filters** to the leaderboard system:

1. **🏙️ City Leaderboard** - Rank among players in your city
2. **🗺️ State Leaderboard** - Rank among players in your state
3. **🇮🇳 Country Leaderboard** - Rank among all players nationwide

## How It Works

### Example: Player in Mumbai, Maharashtra

**Before (Single Rank):**
- Rank: #45 (among all players)

**After (Three Ranks):**
- **City Rank:** #3 in Mumbai
- **State Rank:** #15 in Maharashtra  
- **Country Rank:** #45 in India

### User Experience

1. **Filter Tabs** - Click to switch between City/State/Country view
2. **My Ranks Card** - Shows all three ranks simultaneously
3. **Leaderboard Table** - Updates to show only players in selected scope
4. **Dynamic Ranking** - Ranks recalculate based on filtered players

## Implementation

### Backend Changes

#### 1. Updated API Endpoint
**File:** `backend/src/routes/leaderboard.routes.js`

```javascript
GET /api/leaderboard?scope=city&city=Mumbai&limit=100
GET /api/leaderboard?scope=state&state=Maharashtra&limit=100
GET /api/leaderboard?scope=country&limit=100
```

**Parameters:**
- `scope` - 'city', 'state', or 'country'
- `city` - City name (required for city scope)
- `state` - State name (required for state scope)
- `limit` - Number of players to return (default: 100)

#### 2. Updated Service Method
**File:** `backend/src/services/tournamentPoints.service.js`

```javascript
async getLeaderboard(limit, scope, city, state) {
  const whereClause = { roles: { contains: 'PLAYER' } };
  
  if (scope === 'city' && city) {
    whereClause.city = city;
  } else if (scope === 'state' && state) {
    whereClause.state = state;
  }
  // country scope = no filter (all players)
  
  return players filtered by whereClause;
}
```

#### 3. New Method: Get Player Ranks with Geography
**File:** `backend/src/services/tournamentPoints.service.js`

```javascript
async getPlayerRankWithGeo(userId) {
  // Get user data
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  // Calculate country rank (all players)
  const countryRank = await prisma.user.count({
    where: {
      totalPoints: { gt: user.totalPoints },
      roles: { contains: 'PLAYER' }
    }
  }) + 1;
  
  // Calculate state rank (players in same state)
  const stateRank = await prisma.user.count({
    where: {
      state: user.state,
      totalPoints: { gt: user.totalPoints },
      roles: { contains: 'PLAYER' }
    }
  }) + 1;
  
  // Calculate city rank (players in same city)
  const cityRank = await prisma.user.count({
    where: {
      city: user.city,
      totalPoints: { gt: user.totalPoints },
      roles: { contains: 'PLAYER' }
    }
  }) + 1;
  
  return { ...user, ranks: { country, state, city } };
}
```

### Frontend Changes

#### 1. Added Filter Tabs
**File:** `frontend/src/pages/Leaderboard.jsx`

```jsx
<div className="flex gap-4">
  <button onClick={() => setScope('city')}>
    🏙️ City (Mumbai)
  </button>
  <button onClick={() => setScope('state')}>
    🗺️ State (Maharashtra)
  </button>
  <button onClick={() => setScope('country')}>
    🇮🇳 Country (India)
  </button>
</div>
```

#### 2. Updated My Ranks Card

Shows all three ranks simultaneously:

```jsx
<div className="all-ranks">
  <div>City: #{myRanks.ranks.city}</div>
  <div>State: #{myRanks.ranks.state}</div>
  <div>Country: #{myRanks.ranks.country}</div>
</div>
```

#### 3. Dynamic Leaderboard Fetching

```javascript
const fetchLeaderboard = async () => {
  const params = new URLSearchParams({
    limit: limit.toString(),
    scope
  });
  
  if (scope === 'city' && userCity) {
    params.append('city', userCity);
  } else if (scope === 'state' && userState) {
    params.append('state', userState);
  }
  
  const response = await api.get(`/leaderboard?${params.toString()}`);
  setLeaderboard(response.data.leaderboard);
};
```

## Features

### 1. Filter Tabs
- **City Tab** - Shows only players from your city
- **State Tab** - Shows only players from your state
- **Country Tab** - Shows all players nationwide
- **Disabled State** - City/State tabs disabled if user hasn't set location

### 2. My Ranks Card
- **Large Display** - Shows current scope rank prominently
- **All Ranks Summary** - Small badges showing all three ranks
- **Dynamic Update** - Updates when switching scopes

### 3. Leaderboard Table
- **Filtered Results** - Only shows players in selected scope
- **Recalculated Ranks** - Ranks are 1, 2, 3... within scope
- **Same Stats** - Points, tournaments, matches remain same

### 4. Scope Indicator
- **Current Scope Label** - "Showing rankings for: Mumbai"
- **Tab Highlighting** - Active tab highlighted in purple
- **Emoji Icons** - Visual indicators for each scope

## Example Scenarios

### Scenario 1: Player in Mumbai

**User Profile:**
- Name: Rahul Verma
- City: Mumbai
- State: Maharashtra
- Total Points: 150

**Rankings:**
- **City Rank:** #3 (out of 500 Mumbai players)
- **State Rank:** #15 (out of 2000 Maharashtra players)
- **Country Rank:** #45 (out of 10000 India players)

**What User Sees:**
- Click "City" → See top 100 Mumbai players, ranked #3
- Click "State" → See top 100 Maharashtra players, ranked #15
- Click "Country" → See top 100 India players, ranked #45

### Scenario 2: Player Without Location

**User Profile:**
- Name: Arjun Mehta
- City: null
- State: null
- Total Points: 120

**Rankings:**
- **City Rank:** null (no city set)
- **State Rank:** null (no state set)
- **Country Rank:** #60

**What User Sees:**
- City tab: Disabled (grayed out)
- State tab: Disabled (grayed out)
- Country tab: Active, shows rank #60

## API Response Examples

### Get Leaderboard (City Scope)

**Request:**
```
GET /api/leaderboard?scope=city&city=Mumbai&limit=100
```

**Response:**
```json
{
  "success": true,
  "leaderboard": [
    {
      "rank": 1,
      "id": "user-1",
      "name": "Rahul Verma",
      "city": "Mumbai",
      "state": "Maharashtra",
      "totalPoints": 200,
      "tournamentsPlayed": 20,
      "matchesWon": 60,
      "matchesLost": 15,
      "winRate": "80.0"
    },
    {
      "rank": 2,
      "id": "user-2",
      "name": "Priya Sharma",
      "city": "Mumbai",
      "state": "Maharashtra",
      "totalPoints": 180,
      "tournamentsPlayed": 18,
      "matchesWon": 54,
      "matchesLost": 18,
      "winRate": "75.0"
    }
  ],
  "total": 100,
  "scope": "city",
  "filters": {
    "city": "Mumbai",
    "state": null
  }
}
```

### Get My Ranks

**Request:**
```
GET /api/leaderboard/my-rank
Headers: Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "ranks": {
    "id": "user-id",
    "name": "PS Pradyumna",
    "city": "Mumbai",
    "state": "Maharashtra",
    "totalPoints": 150,
    "tournamentsPlayed": 15,
    "matchesWon": 45,
    "matchesLost": 12,
    "winRate": "78.9",
    "ranks": {
      "city": 3,
      "state": 15,
      "country": 45
    }
  }
}
```

## Database Queries

### City Leaderboard Query
```sql
SELECT * FROM users
WHERE roles LIKE '%PLAYER%'
AND city = 'Mumbai'
ORDER BY totalPoints DESC
LIMIT 100
```

### State Leaderboard Query
```sql
SELECT * FROM users
WHERE roles LIKE '%PLAYER%'
AND state = 'Maharashtra'
ORDER BY totalPoints DESC
LIMIT 100
```

### Country Leaderboard Query
```sql
SELECT * FROM users
WHERE roles LIKE '%PLAYER%'
ORDER BY totalPoints DESC
LIMIT 100
```

### Calculate City Rank
```sql
SELECT COUNT(*) FROM users
WHERE city = 'Mumbai'
AND totalPoints > {userPoints}
AND roles LIKE '%PLAYER%'
-- Rank = count + 1
```

## UI/UX Features

### Filter Tabs Design
- **Active Tab:** Purple gradient background, white text
- **Inactive Tab:** Gray background, gray text
- **Disabled Tab:** Grayed out, cursor not-allowed
- **Hover Effect:** Slight background change on hover

### My Ranks Card
- **Large Rank Badge:** Shows current scope rank prominently
- **Rank Badges:** Gold (1st), Silver (2nd), Bronze (3rd), Purple (4-10)
- **All Ranks Summary:** Small badges at bottom showing all three ranks
- **Scope Label:** "City Rank", "State Rank", or "Country Rank"

### Leaderboard Table
- **Filtered Data:** Only shows players in selected scope
- **Rank Column:** Recalculated ranks (1, 2, 3...)
- **Location Display:** Shows city and state for each player
- **Highlight:** Your row highlighted in purple

## Benefits

### For Players
- ✅ See how you rank locally (city)
- ✅ See how you rank regionally (state)
- ✅ See how you rank nationally (country)
- ✅ Compete with nearby players
- ✅ Track progress in multiple contexts

### For Competition
- ✅ Local rivalries (city level)
- ✅ Regional competition (state level)
- ✅ National recognition (country level)
- ✅ Multiple leaderboards to climb
- ✅ More engagement opportunities

### For Motivation
- ✅ Easier to rank high locally
- ✅ Achievable goals (city champion)
- ✅ Progressive challenges (city → state → country)
- ✅ Multiple milestones to celebrate

## Testing

### Test Scenario 1: Switch Filters
1. Open leaderboard page
2. Click "City" tab
3. **Expected:** See only players from your city, ranks recalculated
4. Click "State" tab
5. **Expected:** See only players from your state, ranks recalculated
6. Click "Country" tab
7. **Expected:** See all players, ranks recalculated

### Test Scenario 2: My Ranks Card
1. Open leaderboard page
2. **Expected:** See all three ranks displayed
3. Switch to "City" tab
4. **Expected:** Large badge shows city rank
5. Switch to "State" tab
6. **Expected:** Large badge shows state rank

### Test Scenario 3: No Location Set
1. User without city/state set
2. **Expected:** City and State tabs disabled
3. **Expected:** Only Country tab active
4. **Expected:** Only country rank shown

## Files Modified

### Backend:
1. `src/routes/leaderboard.routes.js` - Added scope parameter
2. `src/services/tournamentPoints.service.js` - Added geographical filtering

### Frontend:
1. `src/pages/Leaderboard.jsx` - Added filter tabs and multi-rank display

## Summary

**Question:** "Make ranking into three different filters: city, state, country"

**Answer:** ✅ DONE!

The leaderboard now has:
- ✅ Three filter tabs (City, State, Country)
- ✅ Shows all three ranks simultaneously
- ✅ Dynamically filters leaderboard based on selection
- ✅ Recalculates ranks within each scope
- ✅ Beautiful UI with emoji icons
- ✅ Disabled state for missing location data

**Players can now see how they rank locally, regionally, and nationally!** 🏆
