# Partner Confirmation System - Quick Guide

**Feature:** Day 26 - Partner Confirmation with Email Notifications

---

## 🎯 Overview

The Partner Confirmation System allows players to invite partners for doubles tournaments via email. Partners receive invitation emails with accept/decline links, and players get notified of their partner's response.

---

## 🔄 How It Works

### For Players (Inviting Partner):

1. **Register for Doubles Tournament**
   - Go to tournament details page
   - Click "Register Now"
   - Select a doubles category
   - Enter partner's email address
   - Complete registration

2. **Partner Invitation Sent**
   - System automatically sends email to partner
   - Email contains accept/decline links
   - You receive confirmation of registration

3. **Wait for Partner Response**
   - Check notifications dropdown (bell icon)
   - Receive notification when partner responds
   - View registration status in "My Registrations"

### For Partners (Receiving Invitation):

1. **Receive Email**
   - Check your email inbox
   - Look for "Partner Invitation" email from Matchify
   - Email contains tournament and category details

2. **Review Invitation**
   - Click link in email
   - Opens partner confirmation page
   - Review player, tournament, and category info

3. **Accept or Decline**
   - **Accept:** Must login/register first
   - **Decline:** No login required
   - Confirmation sent to player

---

## 📧 Email Templates

### Partner Invitation Email

**Subject:** Partner Invitation - {Tournament Name}

**Content:**
- Player name and details
- Tournament information
- Category details
- Accept button (green)
- Decline button (red)
- Note about account requirement

### Partner Accepted Email

**Subject:** Partner Accepted - {Tournament Name}

**Content:**
- Partner name
- Tournament and category
- Registration confirmed message
- Good luck message

### Partner Declined Email

**Subject:** Partner Declined - {Tournament Name}

**Content:**
- Partner name
- Tournament and category
- Decline notification
- Options: invite different partner or cancel

---

## 🔔 Notifications

### In-App Notifications:

**Bell Icon in Navbar:**
- Shows unread count (red badge)
- Click to open dropdown
- View all notifications
- Mark as read on click
- Auto-refresh every 30 seconds

**Notification Types:**
- 🎯 Partner Invitation (for partner)
- ✅ Partner Accepted (for player)
- ❌ Partner Declined (for player)

---

## 🖥️ Frontend Pages

### Partner Confirmation Page
**URL:** `/partner/confirm/{token}`

**Features:**
- Public page (no login required to view)
- Display player information
- Show tournament details
- Show category information
- Accept button (requires login)
- Decline button (no login required)
- Success/error messages
- Auto-redirect after confirmation

### Notification Dropdown
**Location:** Navbar (bell icon)

**Features:**
- Unread count badge
- List of notifications
- Time formatting (5m ago, 2h ago)
- Mark as read on click
- Mark all as read button
- Empty state
- Click outside to close

---

## 🔧 Configuration

### Email Service Setup (Optional)

**For Development:**
- No configuration needed
- Emails log to console
- Perfect for testing

**For Production:**

1. **Gmail Setup:**
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password  # Generate in Google Account settings
EMAIL_FROM="Matchify <noreply@matchify.com>"
```

2. **SendGrid Setup:**
```bash
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
EMAIL_FROM="Matchify <noreply@matchify.com>"
```

3. **Restart Backend:**
```bash
cd matchify/backend
npm start
```

---

## 🧪 Testing

### Test the Complete Flow:

1. **Start Servers:**
```bash
# Backend
cd matchify/backend
npm start

# Frontend
cd matchify/frontend
npm run dev
```

2. **Register for Doubles:**
   - Login as player: testplayer@matchify.com / password123
   - Go to any tournament
   - Click "Register Now"
   - Select doubles category
   - Enter partner email: partner@example.com
   - Complete registration

3. **Check Email Log:**
   - Look at backend console
   - Find email log with partner invitation
   - Copy the token from the URL

4. **Test Confirmation:**
   - Visit: `http://localhost:5173/partner/confirm/{token}`
   - Review invitation details
   - Click Accept or Decline
   - Check notifications

5. **Verify Notifications:**
   - Click bell icon in navbar
   - See notification about partner response
   - Click notification to mark as read

---

## 📊 API Endpoints

### Partner Endpoints:

**GET /api/partner/confirm/:token**
- Get invitation details
- Public endpoint
- Returns: player, tournament, category

**POST /api/partner/confirm/:token**
- Accept or decline invitation
- Body: `{ action: "accept" | "decline" }`
- Accept requires authentication
- Decline is public

### Notification Endpoints:

**GET /api/notifications**
- Get user notifications
- Query: `?unreadOnly=true&limit=50`
- Returns: notifications array, unread count

**PUT /api/notifications/:id/read**
- Mark notification as read
- Requires authentication

**PUT /api/notifications/read-all**
- Mark all notifications as read
- Requires authentication

---

## 🎨 UI Components

### NotificationDropdown Component

**Location:** `frontend/src/components/NotificationDropdown.jsx`

**Features:**
- Bell icon with badge
- Dropdown menu
- Notification list
- Time formatting
- Mark as read
- Auto-refresh

**Usage:**
```jsx
import NotificationDropdown from './components/NotificationDropdown';

// In Navbar
<NotificationDropdown />
```

### PartnerConfirmationPage Component

**Location:** `frontend/src/pages/PartnerConfirmationPage.jsx`

**Features:**
- Token validation
- Invitation display
- Accept/decline actions
- Success/error handling
- Auto-redirect

**Route:**
```jsx
<Route path="/partner/confirm/:token" element={<PartnerConfirmationPage />} />
```

---

## 🔐 Security

### Token Security:
- 32-byte random hex tokens
- Cryptographically secure
- Unique per registration
- Stored in database
- Validated on confirmation

### Authentication:
- Accept requires login
- Decline is public
- Email verification
- User validation

---

## 💡 Tips & Best Practices

### For Players:
1. ✅ Use correct partner email
2. ✅ Verify email before submitting
3. ✅ Check notifications for response
4. ✅ Contact partner if no response

### For Partners:
1. ✅ Check spam folder for invitation
2. ✅ Review details before accepting
3. ✅ Create account if needed
4. ✅ Respond promptly

### For Developers:
1. ✅ Configure email service for production
2. ✅ Monitor email logs
3. ✅ Test with real email addresses
4. ✅ Add token expiry (future enhancement)

---

## 🐛 Troubleshooting

### Email Not Received:
- Check spam folder
- Verify email address
- Check backend console logs
- Verify SMTP configuration

### Cannot Accept Invitation:
- Must be logged in
- Email must match invitation
- Token must be valid
- Tournament must not be ended

### Notifications Not Showing:
- Check if logged in
- Refresh page
- Check browser console
- Verify API connection

---

## 📝 Future Enhancements

### Potential Improvements:
1. Token expiry (24-48 hours)
2. Resend invitation feature
3. Change partner before tournament
4. SMS notifications
5. Push notifications
6. Email preferences
7. Notification preferences
8. WebSocket for real-time updates

---

## 📚 Related Documentation

- `DAY_26_COMPLETE.md` - Complete implementation details
- `DAY_26_SUMMARY.md` - Day 26 summary
- `test-partner-confirmation.js` - Test suite
- `.env.example` - Configuration template

---

## 🎉 Success!

The Partner Confirmation System is fully functional and ready to use. Players can invite partners, partners can confirm participation, and everyone stays informed through email and in-app notifications.

**Enjoy the seamless partner invitation experience!** 🏸

---

*Last Updated: December 27, 2025*
