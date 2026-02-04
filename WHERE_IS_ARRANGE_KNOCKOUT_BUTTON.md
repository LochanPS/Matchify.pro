# Where is the "Arrange Knockout Matchups" Button?

## 🔍 Location

The button is in the **TOP TOOLBAR**, not in the knockout bracket section!

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Tournament                                           │
│                                                                  │
│  ace badminton                                                   │
│  Tournament Draw & Brackets                                      │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Assign       │  │ Edit Group   │  │ Arrange      │  ← HERE! │
│  │ Players      │  │ Sizes        │  │ Knockout     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  [mens] [round robin] [singles]  ← Category tabs                │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Round Robin Groups                                       │   │
│  │                                                           │   │
│  │ Group A standings...                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Knockout Bracket                                         │   │
│  │                                                           │   │
│  │ Quarter Finals: TBD vs TBD  ← This is what you showed   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 📸 What You're Looking At

Your screenshot shows the **KNOCKOUT BRACKET SECTION** (bottom part of the page).

The button is in the **TOOLBAR** (top part of the page).

## 🎯 How to Find It

1. **Scroll to the TOP of the page**
2. Look for the toolbar with buttons
3. You should see:
   - "Assign Players" button (green)
   - "Edit Group Sizes" button (blue) 
   - **"Arrange Knockout" button (purple/pink)** ← This is what you need!
   - "Restart Draws" button (orange)
   - "Delete Draw" button (red)

## ⚠️ If You Still Don't See It

### Possible Reasons:

1. **You're on the wrong page**
   - Make sure you're on: `/tournaments/{id}/draws`
   - NOT on: `/tournaments/{id}/draw` (singular)

2. **You're not logged in as organizer**
   - The button only shows for the tournament organizer
   - Check if you see other organizer buttons (Assign Players, etc.)

3. **Browser cache issue**
   - Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
   - Or clear browser cache

4. **Wrong category selected**
   - Make sure you're viewing the correct category tab
   - The one with ROUND_ROBIN_KNOCKOUT format

## 🧪 Debug Steps

### Step 1: Check if you're on the right page
Open browser console (F12) and type:
```javascript
window.location.pathname
```
Should show: `/tournaments/{some-id}/draws` (plural!)

### Step 2: Check if bracket is loaded
```javascript
console.log('Format:', window.bracket?.format)
```
Should show: `ROUND_ROBIN_KNOCKOUT`

### Step 3: Check if you're the organizer
```javascript
console.log('Is Organizer:', window.isOrganizer)
```
Should show: `true`

### Step 4: Force show the button
If all above are correct but button still doesn't show, there might be a React rendering issue. Try:
1. Switch to a different category tab
2. Switch back to your Round Robin + Knockout category
3. The button should appear

## 📝 Button Details

**Button Text**: "Arrange Knockout"
**Button Color**: Purple/Pink gradient
**Button Icon**: Settings icon (gear)
**Button Position**: Top toolbar, after "Edit Group Sizes"

## 🎬 What Happens When You Click It

1. Modal opens with title "Arrange Knockout Matchups"
2. Shows list of qualified players (top 2 from each group)
3. Shows empty knockout bracket slots
4. You drag/click to assign players to slots
5. Click "Save Matchups"
6. Knockout bracket is populated with your selections

---

**If you still can't find it, please:**
1. Take a screenshot of the ENTIRE page (including top toolbar)
2. Share the URL you're on
3. Check browser console for any errors
