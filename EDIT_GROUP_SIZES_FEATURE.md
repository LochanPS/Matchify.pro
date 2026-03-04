# Edit Group Sizes Feature - Complete Guide

## ✅ Feature Added

I've added an **"Edit Group Sizes"** button that allows you to dynamically adjust group sizes for Round Robin tournaments at any time (before matches are played).

---

## 🎯 How It Works

### For Round Robin Tournaments:

When you have a Round Robin draw created, you'll now see a new button:

```
[👥 Assign Players]  [📊 Edit Group Sizes]  [⚡ Restart Draws]  [🗑️ Delete Draw]
```

### Step-by-Step Usage:

1. **Create initial draw** with any configuration (e.g., 2 groups of 4 players = 8 slots)

2. **More players register** (e.g., 9th player registers)

3. **Click "Edit Group Sizes"** button (blue button with layers icon)

4. **Configuration modal opens** with current settings

5. **Enable "⚙️ Customize Group Sizes"**

6. **Adjust group sizes:**
   - Pool A: 5 players
   - Pool B: 4 players
   - Total: 9 players ✅

7. **Click "Update Draw"** or "Create Draw"

8. **Draw is updated** with new group sizes

9. **Click "Assign Players"** to assign all 9 players

---

## 📋 Features

### ✅ What You Can Do:

1. **Change number of groups**
   - 2 groups → 3 groups
   - 4 groups → 2 groups
   - Any combination

2. **Customize group sizes**
   - Equal distribution: 4+4+4+4
   - Unequal distribution: 5+4+3+3
   - Any custom sizes that add up to total players

3. **Edit at any time**
   - Before assigning players
   - After assigning players (will need to reassign)
   - Before matches are played

### ❌ Limitations:

1. **Cannot edit after matches are played**
   - Button is hidden once matches start
   - This prevents data corruption

2. **Must reassign players**
   - If you change group sizes after assigning players
   - Previous assignments may be lost
   - You'll need to reassign players to new slots

---

## 🎨 Button Visibility

The **"Edit Group Sizes"** button appears when:
- ✅ Draw exists
- ✅ Format is Round Robin or Round Robin + Knockout
- ✅ No matches have been played yet
- ✅ User is the organizer

The button is **hidden** when:
- ❌ No draw exists (use "Create Draw" instead)
- ❌ Format is pure Knockout (no groups)
- ❌ Matches have been played (draw is locked)
- ❌ User is not the organizer

---

## 💡 Example Scenarios

### Scenario 1: 9 Players in 2 Groups
```
Initial: 2 groups × 4 players = 8 slots (9th player can't join)

Solution:
1. Click "Edit Group Sizes"
2. Enable "Customize Group Sizes"
3. Set Pool A: 5, Pool B: 4
4. Save
5. Assign all 9 players ✅
```

### Scenario 2: 11 Players in 3 Groups
```
Initial: 3 groups × 4 players = 12 slots (1 empty slot)

Solution:
1. Click "Edit Group Sizes"
2. Enable "Customize Group Sizes"
3. Set Pool A: 4, Pool B: 4, Pool C: 3
4. Save
5. Assign all 11 players ✅
```

### Scenario 3: Change from 4 Groups to 2 Groups
```
Initial: 4 groups × 2 players = 8 slots

Want: 2 groups × 4 players = 8 slots

Solution:
1. Click "Edit Group Sizes"
2. Change "Number of Groups" to 2
3. System auto-distributes: 4+4
4. Or customize: 5+3
5. Save
6. Reassign players ✅
```

---

## 🔧 Technical Details

### Frontend Changes:
- Added "Edit Group Sizes" button in `DrawPage.jsx`
- Button uses `Layers` icon from lucide-react
- Blue gradient styling to distinguish from other buttons
- Conditional rendering based on format and match status

### Backend Support:
- Already supports `customGroupSizes` parameter
- Backend endpoint: `POST /draws/create`
- Accepts `customGroupSizes` array: `[5, 4]`
- Regenerates bracket with new group sizes

### Data Flow:
```
User clicks "Edit Group Sizes"
    ↓
Config modal opens with current settings
    ↓
User adjusts group sizes
    ↓
User clicks "Update Draw"
    ↓
Frontend sends: { customGroupSizes: [5, 4], ... }
    ↓
Backend regenerates bracket
    ↓
New bracket with updated group sizes
    ↓
User can now assign players to new slots
```

---

## 🎉 Benefits

1. **Flexibility** - Adjust group sizes anytime before matches start
2. **No data loss** - Can edit without deleting the draw
3. **User-friendly** - Clear button with descriptive label
4. **Smart validation** - System validates total players match bracket size
5. **Visual feedback** - Shows current configuration and preview

---

## 🚀 Summary

The **"Edit Group Sizes"** button provides a quick and easy way to adjust Round Robin group configurations without restarting or deleting the draw. This solves the problem of odd numbers of players and gives organizers full control over group distribution.

**Your 9-player scenario is now solved!** 🎯
