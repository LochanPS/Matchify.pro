# 🧪 TEST PARTNER INVITATION & DUPLICATE PREVENTION

## ✅ WHAT'S NEW

1. **Simplified Partner Invitation**: Cleaner notification detail page
2. **Duplicate Prevention**: Can't register if already a partner in that category

---

## 🧪 TEST 1: SIMPLIFIED PARTNER INVITATION

### Setup
1. Have two user accounts ready (User 1 and User 2)
2. User 2 should have a player code

### Steps
1. **Login as User 1**
2. **Register for a doubles category** (e.g., "Mens Doubles")
3. **Enter User 2's player code** as partner
4. **Submit registration**

5. **Login as User 2**
6. **Check notifications** (bell icon)
7. **Click the partner invitation notification**

### Expected Results
✅ **Simple message only**: "Your partner [User 1] has registered you and themselves in the [category] category of [tournament] on [date]."

✅ **No tournament details card** (should be hidden)

✅ **Button says**: "View Tournament" (not "View Tournament & Register")

✅ **Click button**: Should go to tournament details page (not registration page)

---

## 🧪 TEST 2: PREVENT DUPLICATE REGISTRATION

### Scenario A: User Already Registered as Partner

**Setup:**
1. User 1 registers for "Mens Doubles" with User 2's player code
2. Admin approves the registration

**Test:**
1. **Login as User 2**
2. **Go to tournament registration page**
3. **Try to register for "Mens Doubles"**

**Expected Result:**
❌ **Error message**: "You are already registered as a partner with [User 1 Name] in Mens Doubles"

❌ **Registration blocked**

---

### Scenario B: Different Category (Should Work)

**Setup:**
1. User 1 registers for "Mens Doubles" with User 2's player code
2. Admin approves the registration

**Test:**
1. **Login as User 2**
2. **Go to tournament registration page**
3. **Try to register for "Mixed Doubles"** (different category)

**Expected Result:**
✅ **Registration allowed** (different category)

---

### Scenario C: After Rejection (Should Work)

**Setup:**
1. User 1 registers for "Mens Doubles" with User 2's player code
2. Admin **rejects** the registration

**Test:**
1. **Login as User 2**
2. **Go to tournament registration page**
3. **Try to register for "Mens Doubles"**

**Expected Result:**
✅ **Registration allowed** (previous registration was rejected)

---

## 🔍 WHAT TO CHECK

### Visual Checks
- [ ] Partner invitation shows simple message only
- [ ] No tournament details card visible
- [ ] Button says "View Tournament"
- [ ] Button navigates to tournament page (not registration)

### Functional Checks
- [ ] Can't register if already a partner (pending/approved)
- [ ] Error message shows partner's name
- [ ] Can register for different category
- [ ] Can re-register after rejection
- [ ] Can re-register after cancellation

### Backend Logs
Check backend console for these logs:
```
🤝 Checking if user is partner in [Category]:
   isPartner: true/false
   partnerOf: [Partner Name]

❌ Blocking registration - User is already a partner with [Name]
```

---

## 📊 TEST MATRIX

| Scenario | User 1 Action | User 2 Action | Expected Result |
|----------|---------------|---------------|-----------------|
| Partner Notification | Registers with User 2 code | Views notification | Simple message + "View Tournament" button |
| Same Category | Registers with User 2 code | Tries to register same category | ❌ Blocked with error |
| Different Category | Registers for Mens Doubles | Tries to register Mixed Doubles | ✅ Allowed |
| After Rejection | Registration rejected | Tries to register same category | ✅ Allowed |
| After Cancellation | Registration cancelled | Tries to register same category | ✅ Allowed |

---

## 🐛 IF SOMETHING GOES WRONG

### Partner Invitation Still Shows Details Card
**Check**: `NotificationDetailPage.jsx` line ~280
**Fix**: Ensure condition includes `&& notification.type !== 'PARTNER_INVITATION'`

### Duplicate Registration Not Blocked
**Check**: Backend console for partner check logs
**Fix**: Verify `existingAsPartner` query is running

### Error Message Not Clear
**Check**: Error message includes partner's name
**Fix**: Verify `include: { user: { select: { name: true } } }` in query

---

## ✅ SUCCESS CRITERIA

### Change 1: Simplified Partner Invitation
- [x] Message displays correctly
- [x] Tournament details card hidden
- [x] Button text changed to "View Tournament"
- [x] Navigation goes to tournament page

### Change 2: Duplicate Prevention
- [x] Blocks registration when user is partner
- [x] Shows clear error with partner name
- [x] Allows different categories
- [x] Allows re-registration after rejection
- [x] Backend logs show partner checks

---

## 🚀 QUICK TEST FLOW

**5-Minute Test:**

1. **Create two users** (if not already)
2. **User 1**: Register for doubles with User 2's code
3. **User 2**: Check notification → Should be simple
4. **User 2**: Try to register same category → Should be blocked
5. **User 2**: Try different category → Should work

**Done!** ✅

---

## 💡 TIPS

1. **Use backend logs** to debug partner checks
2. **Test with different statuses** (pending, approved, rejected)
3. **Test multiple categories** to ensure independence
4. **Check error messages** for clarity

---

**FEATURES**: Partner Invitation Simplification + Duplicate Prevention
**STATUS**: ✅ Complete and ready to test
**DATE**: February 3, 2026
