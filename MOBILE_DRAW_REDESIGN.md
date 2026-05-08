# Mobile Draw Redesign Plan

## Issues Identified:
1. ❌ Draws not centered on mobile
2. ❌ Cannot see all matches properly
3. ❌ Layout not optimized for phone screens
4. ❌ Inconsistent emerald theme
5. ❌ Round Robin groups too wide
6. ❌ Knockout brackets overflow horizontally

## Solution:

### 1. **KNOCKOUT FORMAT** - Vertical Mobile Layout
- Stack rounds vertically (not horizontally)
- Each round in its own section
- Full-width match cards
- Emerald theme throughout
- Touch-friendly buttons

### 2. **ROUND ROBIN FORMAT** - Compact Mobile View
- Groups stack vertically
- Standings table responsive
- Match schedule in cards
- Emerald accents
- Collapsible groups

### 3. **ROUND ROBIN + KNOCKOUT** - Tabbed Interface
- Stage 1 / Stage 2 tabs (emerald)
- Each stage optimized separately
- Smooth transitions
- Clear navigation

## Implementation:
- Mobile-first design
- Emerald green (#00c853, #00ff88) primary color
- Red for destructive actions only
- Compact spacing
- Large touch targets (min 44px)
- Readable font sizes (14px+)
