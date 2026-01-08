# Matchify Testing Guide

## Quick Start

### 1. Start Backend
```bash
cd matchify/backend
npm start
```
Backend runs on: **http://localhost:5000**

### 2. Start Frontend
```bash
cd matchify/frontend
npm run dev
```
Frontend runs on: **http://localhost:5173**

## Test Accounts

### Organizer Account
- **Email:** `testorganizer@matchify.com`
- **Password:** `password123`
- **Role:** ORGANIZER
- **Can:** Create tournaments, manage categories

### Player Account
- **Email:** `testplayer@matchify.com`
- **Password:** `password123`
- **Role:** PLAYER
- **Can:** Register for tournaments, manage wallet

## Testing Tournament Creation (Day 19-20)

### Step-by-Step Test:

1. **Login as Organizer**
   - Go to http://localhost:5173/login
   - Use organizer credentials
   - Verify redirect to home page

2. **Navigate to Create Tournament**
   - Click "Create Tournament" in navbar
   - Or go to http://localhost:5173/tournaments/create
   - Should see Step 1: Basic Info

3. **Step 1: Basic Information**
   - Fill in tournament name (min 5 chars)
   - Add description (min 20 chars)
   - Select format (singles/doubles/both)
   - Enter venue details
   - Select zone (North/South/East/West/Central/Northeast)
   - Click "Next: Dates →"

4. **Step 2: Dates**
   - Set registration open date (future)
   - Set registration close date (after open)
   - Set tournament start date (after registration close)
   - Set tournament end date (after start, max 30 days)
   - Verify timeline summary shows
   - Click "Next: Posters →"

5. **Step 3: Posters (Optional)**
   - Drag and drop images OR click browse
   - Upload 1-5 images
   - Set primary poster (click "Set Primary")
   - Remove posters if needed (click X)
   - Click "Next: Categories →" (can skip)

6. **Step 4: Categories**
   - Click "Add Category"
   - Fill in category details:
     - Name: "Men's Singles Open"
     - Format: Singles
     - Gender: Male
     - Age Group: Open
     - Entry Fee: 500
     - Max Participants: 32
     - Scoring: Best of 3
   - Click "Add Category"
   - Add 2-3 more categories
   - Verify categories list shows
   - Click "Next: Courts & Timing →"

7. **Step 5: Courts & Timing**
   - Set total courts (e.g., 4)
   - Set match start time (e.g., 08:00)
   - Set match end time (e.g., 18:00)
   - Set match duration (e.g., 60 minutes)
   - Verify estimated matches calculation
   - Click "Next: Review →"

8. **Step 6: Review & Submit**
   - Review all entered data
   - Check each section:
     - Basic Information
     - Important Dates
     - Posters (if uploaded)
     - Categories
     - Courts & Timing
   - Click edit buttons to go back if needed
   - Click "Create Tournament" button
   - Wait for loading state
   - Verify redirect to tournament detail page

9. **Verify in Database**
   - Open backend terminal
   - Run: `node test-categories.js`
   - Should see tournament with categories

## Backend API Testing

### Test Category Endpoints
```bash
cd matchify/backend
node test-categories.js
```

**Expected Output:**
```
🎉 All tests passed! Category endpoints are working correctly.
7/7 tests passed
```

### Test Authentication
```bash
cd matchify/backend
node test-auth.js
```

**Expected Output:**
```
🎉 ALL AUTHENTICATION TESTS PASSED!
```

### Test Wallet
```bash
cd matchify/backend
node test-wallet.js
```

## Common Issues & Solutions

### Issue 1: "Cannot connect to backend"
**Solution:**
- Check backend is running on port 5000
- Run: `netstat -ano | findstr :5000`
- If not running: `cd matchify/backend && npm start`

### Issue 2: "Login failed"
**Solution:**
- Use correct test credentials
- Organizer: `testorganizer@matchify.com`
- Player: `testplayer@matchify.com`
- Password: `password123`

### Issue 3: "Categories not saving"
**Solution:**
- Check backend console for errors
- Verify you're logged in as organizer
- Check network tab for API calls
- Run `node test-categories.js` to verify endpoints

### Issue 4: "Posters not uploading"
**Solution:**
- Check Cloudinary credentials in `.env`
- Verify file size < 10MB
- Check file type (PNG, JPG, GIF only)
- Check backend console for Cloudinary errors

### Issue 5: "Date validation errors"
**Solution:**
- Registration open must be in future
- Registration close must be after open
- Tournament start must be after registration close
- Tournament end must be after start
- Duration cannot exceed 30 days

## Browser DevTools Checklist

### Console Tab:
- ✅ No red errors
- ✅ API calls successful (200/201 status)
- ✅ No CORS errors

### Network Tab:
- ✅ POST /api/tournaments (creates tournament)
- ✅ POST /api/tournaments/:id/posters (uploads images)
- ✅ POST /api/tournaments/:id/categories (creates each category)
- ✅ PUT /api/tournaments/:id (updates courts data)
- ✅ All requests return 2xx status codes

### Application Tab:
- ✅ localStorage has `accessToken`
- ✅ localStorage has `refreshToken`
- ✅ localStorage has `user` object

## Manual Testing Checklist

### Tournament Creation:
- [ ] Can access create page as organizer
- [ ] Cannot access create page as player
- [ ] Step 1 validation works
- [ ] Step 2 date validation works
- [ ] Step 3 file upload works
- [ ] Step 4 category add/edit/delete works
- [ ] Step 5 courts validation works
- [ ] Step 6 review shows all data
- [ ] Can navigate back to edit
- [ ] Submit creates tournament
- [ ] Posters uploaded to Cloudinary
- [ ] Categories saved to database
- [ ] Courts data saved
- [ ] Redirects to tournament page

### Navigation:
- [ ] Can go back to previous steps
- [ ] Data persists when navigating
- [ ] Completed steps are clickable
- [ ] Current step is highlighted
- [ ] Progress indicator updates

### Validation:
- [ ] Required fields show errors
- [ ] Minimum length enforced
- [ ] Date logic validated
- [ ] File type validated
- [ ] Numeric ranges enforced
- [ ] Error messages are clear

### Error Handling:
- [ ] Network errors show message
- [ ] Validation errors show inline
- [ ] Submit errors don't lose data
- [ ] Can retry after error
- [ ] Loading states show correctly

## Performance Testing

### Load Times:
- [ ] Page loads < 2 seconds
- [ ] Step transitions instant
- [ ] Image upload < 5 seconds per image
- [ ] Form submission < 3 seconds
- [ ] No UI freezing

### Responsiveness:
- [ ] Works on desktop (1920x1080)
- [ ] Works on laptop (1366x768)
- [ ] Works on tablet (768x1024)
- [ ] Works on mobile (375x667)
- [ ] All buttons clickable
- [ ] Forms are usable

## Database Verification

### Check Tournament Created:
```bash
cd matchify/backend
npx prisma studio
```

Then:
1. Open Tournament table
2. Find your tournament
3. Verify all fields populated
4. Check organizerId matches your user

### Check Categories Created:
1. Open Category table
2. Filter by tournamentId
3. Verify all categories present
4. Check entryFee, format, gender correct

### Check Posters Uploaded:
1. Open TournamentPoster table
2. Filter by tournamentId
3. Verify imageUrl and publicId present
4. Check displayOrder is correct

## Success Criteria

✅ All 6 steps complete without errors
✅ Tournament created in database
✅ Posters uploaded to Cloudinary
✅ Categories saved with correct data
✅ Courts data updated
✅ No console errors
✅ Proper validation on all fields
✅ Can navigate back and forth
✅ Data persists during navigation
✅ Success message shows after creation
✅ Redirects to tournament detail page

## Need Help?

If tests fail:
1. Check backend console for errors
2. Check frontend console for errors
3. Check network tab for failed requests
4. Run automated tests: `node test-categories.js`
5. Verify database with Prisma Studio
6. Check `.env` files for correct configuration

## Next Features to Test (Coming Soon)

- [ ] Tournament detail page
- [ ] Edit tournament
- [ ] Delete tournament
- [ ] Publish/unpublish tournament
- [ ] Player registration
- [ ] Payment integration
- [ ] Match scheduling
- [ ] Score entry
