# Organizer & Player Dashboard Redesign Plan

## Goal
Make both Organizer Dashboard and Player Dashboard look EXACTLY like the Umpire Dashboard with:
- Dark gradient background (slate-900 → slate-800)
- Purple gradient hero header
- Comprehensive 3-column profile section
- Experience level with stars and info modal
- Performance stats
- Activity & achievements
- Beautiful card designs
- Consistent styling

## Organizer Dashboard Changes

### Current Issues
- Light background (gray-50)
- Different layout structure
- Missing comprehensive profile sections
- Different color scheme

### What to Add
1. **Hero Header** (Purple gradient like Umpire)
   - Profile photo with badge
   - Name and email
   - Contact info grid
   - Umpire code equivalent (maybe organizer ID or verification badge)

2. **Historical Stats Banner**
   - Total tournaments organized
   - Verification status (if applicable)
   - Progress bar

3. **Stats Cards** (4 cards - same as current but styled differently)
   - Total Tournaments
   - Active Tournaments
   - Total Participants
   - Revenue

4. **Profile Grid** (3 columns like Umpire)
   - Column 1: Profile Information
   - Column 2: Performance Stats
   - Column 3: Activity & Achievements

5. **Experience Level Modal**
   - Already exists, keep it

6. **Recent Activity Sections**
   - Upcoming Tournaments
   - Recent Registrations

## Player Dashboard Changes

### Current State
Need to find and check the Player Dashboard file

### What to Add
1. **Hero Header** (Purple gradient)
   - Profile photo
   - Name and email
   - Contact info
   - Player stats in header

2. **Historical Stats Banner**
   - Total tournaments played
   - Win/loss record
   - Points earned

3. **Stats Cards** (4 cards)
   - Tournaments Played
   - Matches Won
   - Matches Lost
   - Total Points

4. **Profile Grid** (3 columns)
   - Column 1: Profile Information
   - Column 2: Performance Stats (win rate, etc.)
   - Column 3: Activity & Achievements

5. **Experience Level System**
   - Based on tournaments played
   - Star rating
   - Info modal

6. **Recent Activity**
   - Upcoming matches
   - Recent tournaments
   - Registration history

## Implementation Steps

1. ✅ Find Player Dashboard file
2. ✅ Redesign Organizer Dashboard completely
3. ✅ Redesign Player Dashboard completely
4. ✅ Ensure backend provides all necessary data
5. ✅ Test both dashboards
6. ✅ Create documentation

## Color Scheme (Match Umpire Dashboard)
- Background: `bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900`
- Hero: `bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900`
- Cards: `bg-slate-800/50 backdrop-blur-sm border border-white/10`
- Text: White/gray scale
- Accents: Purple, blue, amber, green

## Icons to Use
- Organizer: Trophy, Calendar, Users, DollarSign
- Player: Trophy, Target, Award, TrendingUp

Let's start implementation!
