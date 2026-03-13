# Arrange Knockout Matchups Display Fix

## Problem
After arranging knockout matchups and clicking "Save Matchups", the knockout bracket still showed "TBD vs TBD" instead of the assigned players.

## Root Cause
**Match Number Mismatch Between Bracket JSON and Database**

### Bracket JSON (Frontend)
- Uses per-round numbering: Match 1, 2, 3, 4 for first round
- Each round starts from matchNumber = 1

### Database (Backend)
- Uses global numbering across all stages
- Round Robin matches: 1-7
- Knockout matches: 8-14
- Each match has a unique matchNumber across the entire tournament

### The Bug
The `findMatch` function was trying to match:
```javascript
// Looking for matchNumber 1, 2, 3, 4 in Round 3
m.matchNumber === bracketMatch.matchNumber && 
m.round === dbRound &&
m.stage === 'KNOCKOUT'
```

But the database had:
- Match 8 (Round 3) - Aditya vs Akash
- Match 9 (Round 3) - Arjun vs Gaurav  
- Match 10 (Round 3) - Divya vs Deepak
- Match 11 (Round 3) - TBD vs TBD

So it couldn't find matches with matchNumber 1, 2, 3, 4 in Round 3!

## Solution
Changed the `findMatch` function to match by **round and position** instead of matchNumber:

```javascript
// Get all knockout matches for this round, sorted by matchNumber
const roundMatches = matches
  .filter(m => m.round === dbRound && m.stage === 'KNOCKOUT')
  .sort((a, b) => a.matchNumber - b.matchNumber);

// Get the match at the specified index within this round
const found = roundMatches[matchIdx];
```

Now it:
1. Filters matches by round and stage
2. Sorts them by matchNumber
3. Returns the match at the specified index (0, 1, 2, 3)

This way, it doesn't matter what the actual matchNumber is - it just matches by position within the round.

## Verification
After this fix:
- ✅ Arrange knockout matchups modal works
- ✅ Save matchups updates database correctly
- ✅ Knockout bracket immediately shows assigned players
- ✅ No more "TBD vs TBD" after arrangement

## Files Changed
- `MATCHIFY.PRO/matchify/frontend/src/pages/DrawPage.jsx` (lines 1987-2030)
  - Modified `findMatch` function to use round + position matching

## Testing
1. Complete all round robin matches
2. Click "Arrange Knockout Matchups" button in toolbar
3. Assign qualified players to matchups
4. Click "Save Matchups"
5. Verify knockout bracket shows assigned players immediately
