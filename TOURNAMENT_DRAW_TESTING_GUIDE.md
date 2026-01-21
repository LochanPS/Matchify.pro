# Tournament Draw Assignment - Testing Guide

## Quick Testing Steps

### Prerequisites
1. Have a tournament with registered players
2. Be logged in as the tournament organizer
3. Navigate to the tournament draw page

### Test 1: Bulk Add All Players
1. **Setup**: Create a tournament with 8+ registered players
2. **Action**: Click "Assign Players" button
3. **Verify**: Modal opens with player list and empty slots
4. **Action**: Click "Add All Players" button
5. **Expected**: All players automatically assigned to available slots
6. **Verify**: Success message appears and modal closes

### Test 2: Shuffle All Players
1. **Setup**: Have players already assigned (from Test 1 or manual assignment)
2. **Action**: Click "Assign Players" button
3. **Verify**: Modal shows assigned players
4. **Action**: Click "Shuffle All Players" button
5. **Expected**: Players randomly redistributed to different slots
6. **Verify**: Success message appears and modal closes

### Test 3: Drag-and-Drop Functionality
1. **Setup**: Have some players assigned to slots
2. **Action**: Click "Assign Players" button
3. **Action**: Drag an assigned player to another empty slot
4. **Expected**: Player moves to new slot
5. **Action**: Drag an assigned player to another occupied slot
6. **Expected**: Players swap positions
7. **Verify**: Changes are reflected in the interface

### Test 4: Match Locking Protection
1. **Setup**: Start a match (set status to IN_PROGRESS)
2. **Action**: Try to assign/move players in that match
3. **Expected**: 
   - Match shows 🔒 LOCKED indicator
   - Cannot drag players from locked match
   - Cannot drop players into locked match
   - Bulk operations skip locked matches

### Test 5: Button States and Validation
1. **No Players**: Verify "Add All Players" is disabled when no unassigned players
2. **No Assignments**: Verify "Shuffle All Players" is disabled when no assigned players
3. **All Locked**: Verify both buttons disabled when all matches are locked
4. **Tooltips**: Hover over disabled buttons to see explanatory tooltips

## API Testing

### Test Bulk Assign Endpoint
```bash
curl -X POST http://localhost:5000/api/draws/bulk-assign-all \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"tournamentId": "TOURNAMENT_ID", "categoryId": "CATEGORY_ID"}'
```

### Test Shuffle Endpoint
```bash
curl -X POST http://localhost:5000/api/draws/shuffle-players \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"tournamentId": "TOURNAMENT_ID", "categoryId": "CATEGORY_ID"}'
```

## Expected Behaviors

### Success Cases
- ✅ Bulk operations complete successfully
- ✅ Drag-and-drop works smoothly
- ✅ Locked matches are protected
- ✅ UI updates reflect changes immediately
- ✅ Success messages appear

### Error Cases
- ❌ Unauthorized users cannot access bulk operations
- ❌ Invalid tournament/category IDs return 404
- ❌ Locked matches cannot be modified
- ❌ Network errors show appropriate messages

## Performance Verification
- Operations complete within 2-3 seconds for 128 players
- No UI freezing during bulk operations
- Smooth drag-and-drop animations
- Responsive button states

## Browser Compatibility
Test in:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Mobile Testing
- Touch-based drag-and-drop works on tablets
- Buttons are touch-friendly
- Modal is responsive on mobile devices

## Troubleshooting

### Common Issues
1. **Buttons Disabled**: Check if players are registered and confirmed
2. **Drag Not Working**: Ensure player is assigned and match not locked
3. **API Errors**: Verify user is tournament organizer
4. **No Changes**: Check browser console for JavaScript errors

### Debug Steps
1. Open browser developer tools
2. Check Network tab for API calls
3. Check Console tab for JavaScript errors
4. Verify user authentication status
5. Confirm tournament and category IDs are correct

This testing guide ensures all new features work correctly and maintain the integrity of the tournament system.