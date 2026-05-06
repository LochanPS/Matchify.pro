# Profile & Leaderboard Redesign Plan 📋

## Overview
Redesigning Profile Page and Leaderboard Page to match the professional, high-level mobile app design implemented across the dashboard, notifications, and menu.

## Current Status
- ✅ Dashboard - Professional design complete
- ✅ Notifications - Professional design complete  
- ✅ Side Menu - Professional design complete
- 🔄 Profile Page - Needs redesign
- 🔄 Leaderboard Page - Needs enhancement

## Design Requirements

### Common Elements (Both Pages)
1. **Animated Background**
   - Floating gradient orbs (Green, Purple, Cyan, Orange)
   - 15 floating particles with random positions
   - Continuous float animation (8-12s infinite)

2. **Sticky Header**
   - Gradient background with blur effect
   - Back button with glowing logo
   - Page title with gradient text
   - Smooth slideDown animation

3. **Color Themes**
   - Green: #00c853, #00ff88 (Primary, Success)
   - Purple: #a855f7, #8b5cf6 (Secondary)
   - Blue: #3b82f6, #2563eb (Info)
   - Orange: #f59e0b, #fb923c (Warning)
   - Cyan: #06b6d4, #0ea5e9 (Accent)
   - Red: #ef4444, #dc2626 (Danger)

4. **Animations**
   - fadeIn, scaleIn, slideUp, slideDown
   - shimmer, glow, pulse, float
   - Staggered timing for sequential elements
   - 200ms transitions for hover effects

5. **Card Design**
   - Gradient backgrounds
   - 2px colored borders
   - Box shadows with color matching
   - Shimmer effects
   - Hover scale effects

## Profile Page Redesign

### Current Issues
- Basic slate/gray design
- No animations
- Static layout
- Minimal visual hierarchy
- Generic colors

### Redesign Plan

#### 1. Header Section
- **Sticky Header**
  - Back button with Matchify logo
  - "Profile" title with gradient text
  - Animated slideDown entrance

#### 2. Profile Photo Section
- **Design**
  - Large circular photo (120x120px)
  - Gradient border with glow effect
  - "Change Photo" button with purple gradient
  - Floating animation
  - Delete button (red theme)

#### 3. Profile Info Card
- **Design**
  - Green/Purple gradient background
  - Shimmer animation
  - User name (large, bold, gradient text)
  - Player/Umpire codes (color-coded cards)
  - Email, phone, location with icons
  - Role badges with colors
  - Verified badge (if applicable)

#### 4. Edit Profile Section
- **Form Fields**
  - Name field (locked if set) - Blue theme
  - DOB field (locked if set) - Blue theme
  - Phone field - Purple theme
  - Gender dropdown - Purple theme
  - City autocomplete - Purple theme
  - State field (auto-filled) - Purple theme
  - Country field - Purple theme

- **Field Design**
  - Gradient backgrounds for editable fields
  - Locked fields with gray theme
  - Warning badges for one-time fields
  - Autocomplete dropdown with hover effects

#### 5. Action Buttons
- **Edit Profile** - Blue gradient
- **Save** - Green gradient
- **Cancel** - Gray with border
- **Change Password** - Purple gradient

#### 6. Stats Section
- **Design**
  - Grid layout (2x2 or 3 columns)
  - Color-coded stat cards
  - Icons with gradients
  - Animated numbers
  - Shimmer effects

#### 7. Confirmation Modal
- **Design**
  - Centered modal with scale-in animation
  - Orange/Amber gradient header
  - Warning icon with glow
  - Clear information display
  - Two-button layout (Cancel, Confirm)

## Leaderboard Page Enhancement

### Current State
- Already has decent design
- Needs consistency with new style

### Enhancement Plan

#### 1. Header
- **Current**: Basic header with trophy icons
- **Enhanced**:
  - Sticky header with gradient text
  - Animated trophy icons
  - Subtitle with gradient
  - SlideDown animation

#### 2. Filter Tabs
- **Current**: Basic buttons
- **Enhanced**:
  - Gradient active state
  - Hover effects
  - Smooth transitions
  - Color-coded borders

#### 3. My Rank Card
- **Current**: Basic card
- **Enhanced**:
  - Gradient background
  - Shimmer animation
  - Glowing rank badge
  - Animated profile photo
  - Color-coded stats

#### 4. Top 3 Podium
- **Current**: Good design
- **Enhanced**:
  - Add shimmer effects
  - Enhance glow animations
  - Improve shadows
  - Add pulse animations

#### 5. Leaderboard Table
- **Current**: Basic table
- **Enhanced**:
  - Gradient header row
  - Hover row effects
  - Color-coded rank badges
  - Animated profile photos
  - Smooth transitions

#### 6. Points Info Section
- **Current**: Basic grid
- **Enhanced**:
  - Gradient card backgrounds
  - Animated icons
  - Shimmer effects
  - Color-coded points

## Animation Keyframes

```css
@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(20px, -20px) scale(1.05); }
  50% { transform: translate(-15px, 15px) scale(0.95); }
  75% { transform: translate(15px, 10px) scale(1.02); }
}

@keyframes glow {
  0%, 100% { opacity: 0.5; filter: brightness(1); }
  50% { opacity: 1; filter: brightness(1.3); }
}

@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

@keyframes fadeIn {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes scaleIn {
  0% { opacity: 0; transform: scale(0.9); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes slideUp {
  0% { opacity: 0; transform: translateY(30px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes slideDown {
  0% { transform: translateY(-100%); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
```

## Implementation Steps

### Phase 1: Profile Page
1. Add animated background (orbs + particles)
2. Add sticky header with gradient
3. Redesign profile photo section
4. Redesign profile info card
5. Redesign edit form fields
6. Redesign action buttons
7. Add animations to all sections
8. Test and refine

### Phase 2: Leaderboard Page
1. Add animated background
2. Enhance sticky header
3. Enhance filter tabs
4. Enhance my rank card
5. Enhance top 3 podium
6. Enhance leaderboard table
7. Enhance points info section
8. Add animations
9. Test and refine

### Phase 3: Testing & Polish
1. Test all animations
2. Test responsiveness
3. Test interactions
4. Verify color consistency
5. Check performance
6. Final polish

## Files to Modify
- `Matchify.pro/frontend/src/pages/ProfilePage.jsx`
- `Matchify.pro/frontend/src/pages/Leaderboard.jsx`

## Expected Outcome
Both pages will have:
- ✅ Professional, high-level mobile app design
- ✅ Vibrant gradient colors
- ✅ Smooth animations throughout
- ✅ Consistent with dashboard/notifications/menu
- ✅ Interactive hover effects
- ✅ Color-coded sections
- ✅ Modern, tournament-grade UI

## Status
📋 **PLANNING COMPLETE** - Ready for implementation

---

**Date**: May 6, 2026
**Task**: Profile & Leaderboard Redesign
**Next**: Begin implementation
