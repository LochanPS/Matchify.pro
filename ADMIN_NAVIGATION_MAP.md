# ADMIN DASHBOARD - COMPLETE NAVIGATION MAP

## Starting Point: Admin Dashboard
**URL:** `http://localhost:5173/admin-dashboard`

---

## 📊 STATS CARDS (Top Section - Display Only, Not Clickable)

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Total Users │  │    Live     │  │  Completed  │  │   Total     │
│      3      │  │ Tournaments │  │ Tournaments │  │  Revenue    │
│             │  │      0      │  │      0      │  │     ₹0      │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

---

## 🔝 TOP NAVIGATION TABS

```
┌──────────┬───────┬─────────────┬───────────┬─────────┐
│Dashboard │ Users │ Tournaments │ Academies │ Revenue │
└──────────┴───────┴─────────────┴───────────┴─────────┘
```

### Tab 1: Dashboard
- **Action:** Stays on current page
- **URL:** `/admin-dashboard`

### Tab 2: Users
- **Action:** Navigates to User Management
- **URL:** `/admin/users`
- **What you'll see:**
  - List of all registered users
  - Search bar
  - Block/Unblock buttons
  - "Login as User" button (impersonation)
  - User details (name, email, phone, roles)

### Tab 3: Tournaments
- **Action:** Stays on current page (future feature)
- **URL:** `/admin-dashboard`

### Tab 4: Academies
- **Action:** Navigates to Academy Approvals
- **URL:** `/admin/academies`
- **What you'll see:**
  - Pending academy submissions
  - Academy details (name, owner, location)
  - Approve/Reject buttons

### Tab 5: Revenue
- **Action:** Navigates to Revenue Dashboard
- **URL:** `/admin/revenue`
- **What you'll see:**
  - Total revenue stats
  - Platform earnings (5%)
  - Organizer payouts (95%)
  - Revenue breakdown by tournament

---

## 🎯 ACTION BUTTONS (Main Section - 6 Glowing Buttons)

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   QR Settings   │  │     Revenue     │  │  Manage Users   │
│   (Teal Glow)   │  │  (Green Glow)   │  │   (Blue Glow)   │
└─────────────────┘  └─────────────────┘  └─────────────────┘

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│     View        │  │    Payments     │  │   Academies     │
│  Tournaments    │  │  (Orange Glow)  │  │  (Green Glow)   │
│ (Purple Glow)   │  │                 │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## BUTTON 1: QR SETTINGS (Teal/Cyan Glow)

**Click Action:** Navigate to QR Settings Page

**From:** `/admin-dashboard`
**To:** `/admin/qr-settings`

**What You'll See:**
```
┌─────────────────────────────────────────┐
│         QR CODE SETTINGS PAGE           │
├─────────────────────────────────────────┤
│                                         │
│  Current QR Code:                       │
│  ┌─────────────┐                        │
│  │             │                        │
│  │  [QR Image] │                        │
│  │             │                        │
│  └─────────────┘                        │
│                                         │
│  UPI ID: 9742628582@sbi                 │
│  Account Holder: P S Lochan             │
│                                         │
│  ┌─────────────────────────────┐        │
│  │  Upload New QR Code         │        │
│  │  [Choose File]              │        │
│  └─────────────────────────────┘        │
│                                         │
│  Change UPI ID: [____________]          │
│  Change Name:   [____________]          │
│                                         │
│  [Save Changes]                         │
│                                         │
└─────────────────────────────────────────┘
```

**What You Can Do:**
- View current QR code
- Upload new QR code image
- Change UPI ID
- Change account holder name
- Save changes

---

## BUTTON 2: REVENUE (Teal/Emerald Glow)

**Click Action:** Navigate to Revenue Dashboard

**From:** `/admin-dashboard`
**To:** `/admin/revenue`

**What You'll See:**
```
┌─────────────────────────────────────────┐
│       REVENUE DASHBOARD PAGE            │
├─────────────────────────────────────────┤
│                                         │
│  Total Revenue:        ₹0               │
│  Platform Earnings:    ₹0 (5%)          │
│  Organizer Payouts:    ₹0 (95%)         │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  Revenue by Tournament          │    │
│  ├─────────────────────────────────┤    │
│  │  Tournament Name | Amount       │    │
│  │  --------------- | ------       │    │
│  │  (No data yet)                  │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  Pending Payouts                │    │
│  ├─────────────────────────────────┤    │
│  │  Organizer | Amount | Status    │    │
│  │  --------- | ------ | ------    │    │
│  │  (No pending payouts)           │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

**What You Can Do:**
- View total revenue collected
- See platform earnings (5% of all fees)
- See organizer payouts (95% split 50/50)
- Track pending payouts
- View revenue by tournament
- Export data

---

## BUTTON 3: MANAGE USERS (Blue/Cyan Glow)

**Click Action:** Navigate to User Management

**From:** `/admin-dashboard`
**To:** `/admin/users`

**What You'll See:**
```
┌─────────────────────────────────────────┐
│       USER MANAGEMENT PAGE              │
├─────────────────────────────────────────┤
│                                         │
│  Search: [_______________] 🔍           │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  All Users (3)                  │    │
│  ├─────────────────────────────────┤    │
│  │                                 │    │
│  │  👤 John Doe                    │    │
│  │     john@example.com            │    │
│  │     Roles: PLAYER, ORGANIZER    │    │
│  │     Status: Active              │    │
│  │     [View] [Block] [Login as]   │    │
│  │  ─────────────────────────────  │    │
│  │                                 │    │
│  │  👤 Jane Smith                  │    │
│  │     jane@example.com            │    │
│  │     Roles: PLAYER, UMPIRE       │    │
│  │     Status: Active              │    │
│  │     [View] [Block] [Login as]   │    │
│  │  ─────────────────────────────  │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

**What You Can Do:**
- Search users by name/email
- View user details
- Block/Unblock users
- Login as user (impersonation)
- See user roles and status

---

## BUTTON 4: VIEW TOURNAMENTS (Purple/Pink Glow)

**Click Action:** Navigate to Public Tournaments Page

**From:** `/admin-dashboard`
**To:** `/tournaments`

**What You'll See:**
```
┌─────────────────────────────────────────┐
│       TOURNAMENTS PAGE (PUBLIC)         │
├─────────────────────────────────────────┤
│                                         │
│  🏆 All Tournaments                     │
│                                         │
│  Filters: [All] [Upcoming] [Live]       │
│           [Completed]                   │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  Tournament Name                │    │
│  │  Location: City, State          │    │
│  │  Date: Jan 20-22, 2026          │    │
│  │  Status: Upcoming               │    │
│  │  [View Details]                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  (List of all tournaments)              │
│                                         │
└─────────────────────────────────────────┘
```

**What You Can Do:**
- View all tournaments
- Filter by status
- See tournament details
- Click on tournament to see full info

---

## BUTTON 5: PAYMENTS (Amber/Orange Glow)

**Click Action:** Navigate to Payment Verification

**From:** `/admin-dashboard`
**To:** `/admin/payment-verifications`

**What You'll See:**
```
┌─────────────────────────────────────────┐
│    PAYMENT VERIFICATION PAGE            │
├─────────────────────────────────────────┤
│                                         │
│  Pending Payment Verifications (0)      │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  Player: John Doe               │    │
│  │  Tournament: City Championship  │    │
│  │  Category: Men's Singles        │    │
│  │  Amount: ₹500                   │    │
│  │  Date: Jan 19, 2026 10:30 PM    │    │
│  │                                 │    │
│  │  Payment Screenshot:            │    │
│  │  ┌─────────────┐                │    │
│  │  │             │                │    │
│  │  │  [Image]    │ [View Full]    │    │
│  │  │             │                │    │
│  │  └─────────────┘                │    │
│  │                                 │    │
│  │  [✓ Approve] [✗ Reject]         │    │
│  └─────────────────────────────────┘    │
│                                         │
│  (No pending verifications)             │
│                                         │
└─────────────────────────────────────────┘
```

**What You Can Do:**
- View pending payment verifications
- See payment screenshots
- View full-size images
- Approve payments (player can participate)
- Reject payments (with reason)
- Player gets notification of decision

---

## BUTTON 6: ACADEMIES (Green/Emerald Glow)

**Click Action:** Navigate to Academy Approvals

**From:** `/admin-dashboard`
**To:** `/admin/academies`

**What You'll See:**
```
┌─────────────────────────────────────────┐
│      ACADEMY APPROVALS PAGE             │
├─────────────────────────────────────────┤
│                                         │
│  Pending Academy Submissions (0)        │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  🏢 Elite Badminton Academy     │    │
│  │                                 │    │
│  │  Owner: John Doe                │    │
│  │  Email: john@academy.com        │    │
│  │  Phone: 9876543210              │    │
│  │                                 │    │
│  │  Location:                      │    │
│  │  City: Bangalore                │    │
│  │  State: Karnataka               │    │
│  │  Address: 123 Main St           │    │
│  │                                 │    │
│  │  Facilities:                    │    │
│  │  - 4 Indoor Courts              │    │
│  │  - Coaching Available           │    │
│  │  - Equipment Rental             │    │
│  │                                 │    │
│  │  Submitted: Jan 19, 2026        │    │
│  │                                 │    │
│  │  [View Details]                 │    │
│  │  [✓ Approve] [✗ Reject]         │    │
│  └─────────────────────────────────┘    │
│                                         │
│  (No pending submissions)               │
│                                         │
└─────────────────────────────────────────┘
```

**What You Can Do:**
- View pending academy submissions
- See academy details (name, owner, location, facilities)
- Approve academies (appears in public search)
- Reject academies (with reason)
- Owner gets notification of decision

---

## 🔔 NOTIFICATION BELL (Top Right)

**Click Action:** Opens notification dropdown

**What You'll See:**
```
┌─────────────────────────────────┐
│  Notifications (3)              │
├─────────────────────────────────┤
│                                 │
│  🔔 New Registration            │
│     John registered for City    │
│     Championship                │
│     2 mins ago                  │
│  ─────────────────────────────  │
│                                 │
│  💰 Payment Verification        │
│     Jane uploaded payment       │
│     screenshot                  │
│     5 mins ago                  │
│  ─────────────────────────────  │
│                                 │
│  🏢 Academy Submission          │
│     New academy pending         │
│     approval                    │
│     10 mins ago                 │
│                                 │
└─────────────────────────────────┘
```

---

## 🚪 LOGOUT BUTTON (Top Right)

**Click Action:** Logout and redirect to login page

**From:** `/admin-dashboard`
**To:** `/login`

**What Happens:**
- Clears session
- Removes token from localStorage
- Redirects to login page
- Cannot access admin pages without login

---

## 📍 COMPLETE NAVIGATION FLOW

```
                    ┌─────────────────────┐
                    │  ADMIN DASHBOARD    │
                    │  /admin-dashboard   │
                    └──────────┬──────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ QR Settings   │    │   Revenue     │    │ Manage Users  │
│ /admin/       │    │ /admin/       │    │ /admin/users  │
│ qr-settings   │    │ revenue       │    │               │
└───────────────┘    └───────────────┘    └───────────────┘
        │                      │                      │
        │                      │                      │
        ▼                      ▼                      ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ View          │    │   Payments    │    │  Academies    │
│ Tournaments   │    │ /admin/       │    │ /admin/       │
│ /tournaments  │    │ payment-      │    │ academies     │
│               │    │ verifications │    │               │
└───────────────┘    └───────────────┘    └───────────────┘
```

---

## 🎯 SUMMARY

**When you're logged in as admin at `/admin-dashboard`, you have:**

1. **6 Main Action Buttons** - Each navigates to a specific admin page
2. **5 Top Navigation Tabs** - Quick access to key sections
3. **4 Stats Cards** - Display-only, show current metrics
4. **1 Notification Bell** - Shows alerts and updates
5. **1 Logout Button** - Exit admin session

**All buttons work with `window.location.href` for reliable navigation!**

---

**Last Updated:** January 19, 2026
