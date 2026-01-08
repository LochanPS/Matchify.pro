# Testing Registration Flow - Day 24/25

**Date:** December 26, 2025  
**Purpose:** Verify complete tournament registration functionality

---

## 🎯 Pre-Testing Checklist

### Verify Servers are Running:
- [ ] Backend: http://localhost:5000/health (should return 200 OK)
- [ ] Frontend: http://localhost:5173 (should load)

### Test Accounts:
- **Player:** testplayer@matchify.com / password123
- **Organizer:** testorganizer@matchify.com / password123

---

## 📋 Test Scenarios

### **TEST 1: Browse Tournaments**

**Steps:**
1. Open http://localhost:5173
2. Click "Tournaments" in navbar
3. Verify tournaments list loads

**Expected Results:**
- [ ] Tournaments display in grid/list
- [ ] Each tournament shows: name, location, date, status
- [ ] Can click on any tournament

**Issues Found:**
```
(Write any issues here)
```

---

### **TEST 2: View Tournament Details**

**Steps:**
1. Click on any tournament from the list
2. Verify tournament detail page loads

**Expected Results:**
- [ ] Tournament name displays
- [ ] Location shows (city, state)
- [ ] Dates display (start, end, registration close)
- [ ] Categories list shows
- [ ] "Register Now" button visible (for players)
- [ ] Organizer info shows in sidebar

**Issues Found:**
```
(Write any issues here)
```

---

### **TEST 3: Registration Page - Single Category**

**Steps:**
1. Login as player (testplayer@matchify.com)
2. Go to any tournament
3. Click "Register Now" button
4. Select ONE singles category (checkbox)
5. Review payment summary

**Expected Results:**
- [ ] Registration page loads
- [ ] Tournament info displays at top
- [ ] Categories show as checkboxes
- [ ] Selected category highlights (blue border)
- [ ] Payment summary updates on right sidebar
- [ ] Shows: category name, price
- [ ] Shows: wallet balance
- [ ] Shows: wallet usage
- [ ] Shows: Razorpay amount (if needed)
- [ ] "Complete Registration" button enabled

**Issues Found:**
```
(Write any issues here)
```

---

### **TEST 4: Registration Page - Multiple Categories**

**Steps:**
1. Select 2-3 categories (checkboxes)
2. Review payment summary

**Expected Results:**
- [ ] All selected categories highlight
- [ ] Payment summary shows all categories
- [ ] Total amount calculates correctly
- [ ] Wallet usage calculates correctly
- [ ] Razorpay amount calculates correctly

**Formula Check:**
```
Total = Sum of all category fees
Wallet Usage = Min(Wallet Balance, Total)
Razorpay Amount = Max(0, Total - Wallet Balance)
```

**Issues Found:**
```
(Write any issues here)
```

---

### **TEST 5: Doubles Category - Partner Email**

**Steps:**
1. Deselect all categories
2. Select a DOUBLES category
3. Check if partner email field appears
4. Enter partner email: partner@example.com

**Expected Results:**
- [ ] Partner email field appears when doubles selected
- [ ] Field is required (shows warning)
- [ ] Can enter email
- [ ] Warning message shows: "Partner email required for doubles"

**Issues Found:**
```
(Write any issues here)
```

---

### **TEST 6: Registration - Wallet Only (Full Coverage)**

**Scenario:** Player has enough wallet balance to cover full amount

**Steps:**
1. Check player wallet balance (should be ₹4,500)
2. Select categories totaling LESS than ₹4,500
3. Click "Complete Registration"

**Expected Results:**
- [ ] Registration submits immediately
- [ ] Success message shows
- [ ] Redirects to /registrations page
- [ ] Registration appears in list
- [ ] Status shows "confirmed"
- [ ] Payment status shows "completed"
- [ ] Wallet balance decreased

**Issues Found:**
```
(Write any issues here)
```

---

### **TEST 7: Registration - Wallet + Razorpay**

**Scenario:** Player needs to pay via Razorpay for remaining amount

**Steps:**
1. Select categories totaling MORE than wallet balance
2. Click "Complete Registration"
3. Razorpay modal should open

**Expected Results:**
- [ ] Razorpay checkout modal opens
- [ ] Shows correct amount (Total - Wallet)
- [ ] Shows tournament name
- [ ] Prefills user email
- [ ] Can close modal (payment cancelled)

**Test Payment (if Razorpay keys are configured):**
- [ ] Use test card: 4111 1111 1111 1111
- [ ] Any future expiry date
- [ ] Any CVV
- [ ] Payment succeeds
- [ ] Redirects to /registrations
- [ ] Registration shows as confirmed

**Issues Found:**
```
(Write any issues here)
```

---

### **TEST 8: My Registrations Page**

**Steps:**
1. After registering, go to "My Registrations" (navbar)
2. Or visit: http://localhost:5173/registrations

**Expected Results:**
- [ ] Page loads
- [ ] Shows all user registrations
- [ ] Each registration shows:
  - [ ] Tournament name
  - [ ] Location
  - [ ] Date
  - [ ] Category name
  - [ ] Format (singles/doubles)
  - [ ] Gender
  - [ ] Amount paid
  - [ ] Payment status badge
  - [ ] Registration status badge
  - [ ] Partner info (if doubles)
- [ ] Filter buttons work (all/confirmed/pending/cancelled)
- [ ] "Cancel" button shows for confirmed registrations
- [ ] "View Tournament" link works

**Issues Found:**
```
(Write any issues here)
```

---

### **TEST 9: Cancel Registration**

**Steps:**
1. On "My Registrations" page
2. Find a confirmed registration
3. Click "Cancel" button
4. Confirm cancellation

**Expected Results:**
- [ ] Confirmation dialog appears
- [ ] After confirming, registration cancels
- [ ] Refund amount shows (100% if >24h before tournament)
- [ ] Status changes to "cancelled"
- [ ] Refund added to wallet
- [ ] Refund transaction shows in wallet

**Issues Found:**
```
(Write any issues here)
```

---

### **TEST 10: Validation Tests**

**Test 10a: No Category Selected**
- [ ] Try to register without selecting any category
- [ ] Should show error: "Please select at least one category"

**Test 10b: Doubles Without Partner**
- [ ] Select doubles category
- [ ] Leave partner email empty
- [ ] Try to register
- [ ] Should show error: "Partner email is required for doubles categories"

**Test 10c: Invalid Partner Email**
- [ ] Enter invalid email: "notanemail"
- [ ] Try to register
- [ ] Should show error: "Please enter a valid partner email"

**Test 10d: Duplicate Registration**
- [ ] Try to register for same tournament twice
- [ ] Should show error: "Already registered for [category name]"

**Issues Found:**
```
(Write any issues here)
```

---

### **TEST 11: UI/UX Tests**

**Responsive Design:**
- [ ] Resize browser to mobile size (375px)
- [ ] Check if layout adapts
- [ ] Check if buttons are clickable
- [ ] Check if text is readable

**Loading States:**
- [ ] Check if loading spinner shows when fetching data
- [ ] Check if "Processing..." shows when submitting

**Error Handling:**
- [ ] Disconnect internet
- [ ] Try to register
- [ ] Should show error message

**Navigation:**
- [ ] "Back to Tournament" button works
- [ ] "View Tournament" link works
- [ ] Navbar links work

**Issues Found:**
```
(Write any issues here)
```

---

### **TEST 12: Edge Cases**

**Test 12a: Registration Closed**
- [ ] Try to register for tournament with closed registration
- [ ] Should show error or disable registration

**Test 12b: Zero Wallet Balance**
- [ ] Set wallet balance to 0 (or use new account)
- [ ] Try to register
- [ ] Should create Razorpay order for full amount

**Test 12c: Exact Wallet Balance**
- [ ] Select categories totaling exactly wallet balance
- [ ] Should use wallet only, no Razorpay

**Issues Found:**
```
(Write any issues here)
```

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot read property 'id' of undefined"
**Solution:** Check if tournament/categories data is loading correctly

### Issue: Razorpay modal not opening
**Solution:** 
1. Check if Razorpay script is loaded (check browser console)
2. Verify VITE_RAZORPAY_KEY_ID in .env file
3. Check browser console for errors

### Issue: Payment summary not updating
**Solution:** Check if selectedCategories state is updating correctly

### Issue: Registration not appearing in "My Registrations"
**Solution:** 
1. Check if API call succeeded (Network tab)
2. Verify user is logged in
3. Check if registration was created in database

---

## 📊 Test Results Summary

**Date Tested:** _______________  
**Tester:** _______________

| Test | Status | Notes |
|------|--------|-------|
| Browse Tournaments | ⬜ Pass / ⬜ Fail | |
| View Details | ⬜ Pass / ⬜ Fail | |
| Single Category | ⬜ Pass / ⬜ Fail | |
| Multiple Categories | ⬜ Pass / ⬜ Fail | |
| Doubles Partner | ⬜ Pass / ⬜ Fail | |
| Wallet Only | ⬜ Pass / ⬜ Fail | |
| Wallet + Razorpay | ⬜ Pass / ⬜ Fail | |
| My Registrations | ⬜ Pass / ⬜ Fail | |
| Cancel Registration | ⬜ Pass / ⬜ Fail | |
| Validations | ⬜ Pass / ⬜ Fail | |
| UI/UX | ⬜ Pass / ⬜ Fail | |
| Edge Cases | ⬜ Pass / ⬜ Fail | |

**Overall Status:** ⬜ All Pass / ⬜ Some Issues / ⬜ Major Issues

---

## 📝 Issues to Fix

**Priority 1 (Critical):**
```
1. 
2. 
3. 
```

**Priority 2 (Important):**
```
1. 
2. 
3. 
```

**Priority 3 (Nice to Have):**
```
1. 
2. 
3. 
```

---

## ✅ Sign-Off

**Tested By:** _______________  
**Date:** _______________  
**Status:** ⬜ Approved / ⬜ Needs Fixes

---

**After testing, share your findings and I'll help fix any issues!**
