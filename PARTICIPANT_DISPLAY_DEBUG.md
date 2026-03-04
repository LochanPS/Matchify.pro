# 🔍 PARTICIPANT DISPLAY ISSUE - DEBUGGING GUIDE

## 🐛 Issue Description

The tournament shows "1 participant" in the count, but when clicking "View Registrations", no participants are displayed in the list.

## ✅ What I've Verified

### 1. Database Check
```
✅ Registration exists in database
   - Player: Lochan Pokkali
   - Tournament: aceace acecc
   - Category: mens
   - Status: pending
   - Payment Status: submitted
```

### 2. Backend API Check
```
✅ Backend query works correctly
   - getTournamentRegistrations returns 1 registration
   - All data is properly included (user, category, partner)
```

### 3. Frontend Route Check
```
✅ Route is correct: /organizer/tournaments/:id
✅ Component: TournamentManagementPage
✅ API call: getTournamentRegistrations(id)
```

## 🔧 Debugging Steps Added

I've added console logging to help identify the issue:

### In `TournamentManagementPage.jsx`:

**1. Fetch Logging:**
```javascript
console.log('🔍 Fetching registrations for tournament:', id);
console.log('✅ Registrations data received:', data);
console.log('📊 Number of registrations:', data.registrations?.length || 0);
```

**2. Filter Logging:**
```javascript
console.log('🔍 Filter:', filter);
console.log('📊 Total registrations:', registrations.length);
console.log('📊 Filtered registrations:', filteredRegistrations.length);
```

## 🎯 How to Debug

### Step 1: Open Browser Console
1. Navigate to the tournament page
2. Click "View Registrations"
3. Open browser console (F12)
4. Look for the console logs

### Step 2: Check the Logs

You should see:
```
🔍 Fetching registrations for tournament: dbac18eb-409d-418b-b1ce-f84306444b46
✅ Registrations data received: {success: true, count: 1, registrations: Array(1)}
📊 Number of registrations: 1
🔍 Filter: all
📊 Total registrations: 1
📊 Filtered registrations: 1
📋 First registration: {id: '...', user: {...}, ...}
```

### Step 3: Identify the Issue

**If you see "Total registrations: 0":**
- API call failed or returned empty data
- Check Network tab for API errors

**If you see "Filtered registrations: 0" but "Total registrations: 1":**
- Filter is not matching the registration status
- Registration status is "pending" but filter might be set to something else

**If you see "Filtered registrations: 1" but nothing displays:**
- Rendering issue in the component
- Check if registration object has all required fields

## 🔍 Common Issues & Solutions

### Issue 1: Filter Mismatch
**Problem:** Registration status is "pending" but default filter is "confirmed"

**Solution:** Change default filter to "all" or "pending"
```javascript
const [filter, setFilter] = useState('all'); // or 'pending'
```

### Issue 2: Missing Data Fields
**Problem:** Registration object missing required fields (user, category, etc.)

**Check:** Look at the console log for "First registration" and verify all fields exist

### Issue 3: API Response Format
**Problem:** API returns data in unexpected format

**Check:** Console log should show:
```javascript
{
  success: true,
  count: 1,
  registrations: [...]
}
```

### Issue 4: Authentication
**Problem:** User not authenticated as organizer

**Check:** Network tab should show 200 OK, not 401 or 403

## 🛠️ Quick Fixes

### Fix 1: Reset Filter to "All"
The registration status is "pending", so make sure the filter shows all registrations:

```javascript
// In TournamentManagementPage.jsx
const [filter, setFilter] = useState('all'); // Make sure this is 'all'
```

### Fix 2: Check URL Parameter
If URL has `?tab=refunds`, it sets filter to 'cancellation_requested':

```javascript
const tabParam = searchParams.get('tab');
const [filter, setFilter] = useState(tabParam === 'refunds' ? 'cancellation_requested' : 'all');
```

Make sure you're not accessing with `?tab=refunds` parameter.

### Fix 3: Verify Registration Status
The registration in database has status "pending". Make sure the filter includes pending registrations:

```javascript
// Filter buttons should include 'pending'
['all', 'confirmed', 'pending', 'cancellation_requested', 'cancelled']
```

## 📊 Expected Behavior

When you click "View Registrations", you should see:

```
┌─────────────────────────────────────────────┐
│ Tournament Registrations                    │
│ 1 registration                              │
├─────────────────────────────────────────────┤
│ Filter: [All] [Confirmed] [Pending] ...    │
├─────────────────────────────────────────────┤
│ Player          │ Category │ Status        │
│ Lochan Pokkali  │ mens     │ Pending       │
└─────────────────────────────────────────────┘
```

## 🎯 Next Steps

1. **Open the page** and check browser console
2. **Look for the logs** I added
3. **Share the console output** if issue persists
4. **Check the filter** - make sure it's set to "all" or "pending"

## 💡 Most Likely Issue

Based on the data:
- Registration status: **"pending"**
- Payment status: **"submitted"**

If the default filter is set to "confirmed", the registration won't show up!

**Solution:** Click the "Pending" filter button or "All" filter button to see the registration.

---

**The registration IS in the database and the API IS working. The issue is most likely a filter mismatch!**
