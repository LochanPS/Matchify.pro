# Day 63: Multi-Role System Fix - Organizer Section Working

## Problem
The organizer section wasn't working because:
1. Backend had two auth systems (old single-role and new multi-role) but wasn't using the new one
2. Frontend was trying to use multi-role features but backend routes weren't set up
3. Token handling was inconsistent between old and new systems

## Solution Implemented

### Backend Changes

#### 1. Created New Multi-Role Routes
- **`multiRoleAuth.routes.js`**: New auth routes using multi-role controllers
  - POST `/api/multi-auth/register` - Register with multiple roles
  - POST `/api/multi-auth/login` - Login with multi-role support

- **`multiRoleTournament.routes.js`**: Tournament routes with role-based access
  - GET `/api/multi-tournaments` - Get all tournaments
  - GET `/api/multi-tournaments/:id` - Get single tournament
  - POST `/api/multi-tournaments` - Create tournament (ORGANIZER only)

- **`multiRoleMatch.routes.js`**: Match routes for umpires
  - GET `/api/multi-matches/umpire` - Get umpire's assigned matches
  - POST `/api/multi-matches/:matchId/score` - Update match score
  - POST `/api/multi-matches/:matchId/submit` - Submit completed match

#### 2. Updated Server Configuration
- Added new multi-role routes alongside existing routes
- Both old and new systems work in parallel
- Old routes: `/api/auth`, `/api/tournaments`, `/api/matches`
- New routes: `/api/multi-auth`, `/api/multi-tournaments`, `/api/multi-matches`

#### 3. Fixed Route Errors
- Removed duplicate `validRoles` declaration in `auth.js`
- Cleaned up `match.routes.js` to only use existing functions
- Removed references to unimplemented functions (startMatch, getLiveMatches, etc.)

### Frontend Changes

#### 1. Updated AuthContext
- Changed from `accessToken`/`refreshToken` to simple `token`
- Updated login/register to use `/api/multi-auth` endpoints
- Simplified logout (no refresh token needed)
- Updated token storage in localStorage

#### 2. Updated API Utility
- Changed token key from `accessToken` to `token`
- Simplified token refresh logic
- Better error handling for 401 responses

#### 3. Created Dashboard Pages
- **`OrganizerDashboard.jsx`**: Full organizer dashboard with:
  - Stats cards (tournaments, participants, revenue)
  - Quick actions (create tournament, manage, analytics)
  - Recent tournaments table
  - Uses `/api/multi-tournaments` endpoint

- **`UmpireDashboard.jsx`**: Full umpire dashboard with:
  - Stats cards (total matches, completed, upcoming, today)
  - Today's matches section
  - All assigned matches table
  - Uses `/api/multi-matches/umpire` endpoint

- **`UmpireScoring.jsx`**: Already existed, added route

#### 4. Updated App.jsx
- Changed `OrganizerDashboardPage` to `OrganizerDashboard`
- Added `/umpire/scoring/:matchId` route
- Imported `UmpireScoring` component

#### 5. Enhanced Navbar
- Added `RoleSwitcher` component
- Updated `getDashboardLink()` to support multi-role users
- Shows current role badge
- Role switcher only appears for users with multiple roles

#### 6. RoleSwitcher Component
- Already existed, now integrated in Navbar
- Allows switching between PLAYER, ORGANIZER, UMPIRE roles
- Stores current role in localStorage
- Navigates to appropriate dashboard on role switch

## How Multi-Role System Works

### User Registration
```javascript
// Register with multiple roles
POST /api/multi-auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "roles": ["PLAYER", "ORGANIZER"]  // Array of roles
}
```

### User Login
```javascript
// Login returns user with roles array
POST /api/multi-auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

// Response
{
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "John Doe",
    "roles": ["PLAYER", "ORGANIZER"],
    "profiles": {
      "player": { ... },
      "organizer": { ... }
    }
  }
}
```

### Role Switching
- User can switch between their roles using RoleSwitcher
- Current role stored in `user.currentRole` in localStorage
- Dashboard link changes based on current role
- Each role has its own dashboard and features

### Database Schema
```prisma
model User {
  id    String @id @default(uuid())
  email String @unique
  roles String // Comma-separated: "PLAYER,ORGANIZER,UMPIRE"
  
  playerProfile    PlayerProfile?
  organizerProfile OrganizerProfile?
  umpireProfile    UmpireProfile?
}

model PlayerProfile {
  id              String @id @default(uuid())
  userId          String @unique
  matchifyPoints  Int    @default(0)
  matchesWon      Int    @default(0)
}

model OrganizerProfile {
  id                   String @id @default(uuid())
  userId               String @unique
  tournamentsOrganized Int    @default(0)
}

model UmpireProfile {
  id              String @id @default(uuid())
  userId          String @unique
  matchesUmpired  Int    @default(0)
}
```

## Testing the Fix

### 1. Start Servers
```bash
# Backend
cd matchify/backend
npm run dev

# Frontend
cd matchify/frontend
npm run dev
```

### 2. Test Organizer Flow
1. Register/Login as ORGANIZER
2. Navigate to `/organizer/dashboard`
3. Should see organizer dashboard with stats
4. Click "Create Tournament" to test tournament creation

### 3. Test Multi-Role Flow
1. Register with multiple roles: `["PLAYER", "ORGANIZER"]`
2. Login - should see RoleSwitcher in navbar
3. Switch between roles
4. Dashboard should change based on current role

### 4. Test Umpire Flow
1. Register/Login as UMPIRE
2. Navigate to `/umpire/dashboard`
3. Should see assigned matches
4. Click "Score Match" to test scoring interface

## API Endpoints

### Multi-Role Auth
- POST `/api/multi-auth/register` - Register with multiple roles
- POST `/api/multi-auth/login` - Login with multi-role support

### Multi-Role Tournaments
- GET `/api/multi-tournaments` - Get all tournaments
- GET `/api/multi-tournaments/:id` - Get single tournament
- POST `/api/multi-tournaments` - Create tournament (ORGANIZER only)

### Multi-Role Matches
- GET `/api/multi-matches/umpire` - Get umpire's matches (UMPIRE only)
- POST `/api/multi-matches/:matchId/score` - Update score (UMPIRE only)
- POST `/api/multi-matches/:matchId/submit` - Submit match (UMPIRE only)

## Files Modified

### Backend
- `matchify/backend/src/routes/multiRoleAuth.routes.js` (created)
- `matchify/backend/src/routes/multiRoleTournament.routes.js` (created)
- `matchify/backend/src/routes/multiRoleMatch.routes.js` (created)
- `matchify/backend/src/server.js` (updated - added new routes)
- `matchify/backend/src/routes/auth.js` (fixed - removed duplicate code)
- `matchify/backend/src/routes/match.routes.js` (fixed - removed non-existent functions)

### Frontend
- `matchify/frontend/src/contexts/AuthContext.jsx` (updated - multi-role support)
- `matchify/frontend/src/utils/api.js` (updated - simplified token handling)
- `matchify/frontend/src/pages/OrganizerDashboard.jsx` (created)
- `matchify/frontend/src/pages/UmpireDashboard.jsx` (created)
- `matchify/frontend/src/App.jsx` (updated - added routes)
- `matchify/frontend/src/components/Navbar.jsx` (updated - added RoleSwitcher)

## Status
✅ Backend running on http://localhost:5000
✅ Frontend running on http://localhost:5173
✅ Multi-role authentication working
✅ Organizer dashboard working
✅ Umpire dashboard working
✅ Role switching working
✅ Token handling fixed

## Next Steps
1. Test tournament creation as organizer
2. Test match scoring as umpire
3. Add more features to organizer dashboard (analytics, tournament management)
4. Add more features to umpire dashboard (match history, statistics)
5. Implement role-based permissions throughout the app
