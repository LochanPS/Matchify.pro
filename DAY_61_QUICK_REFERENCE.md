# 🚀 DAY 61 QUICK REFERENCE: NOTIFICATIONS

Quick reference for using the notification system in Matchify.pro.

---

## 📦 BACKEND - CREATE NOTIFICATIONS

### Method 1: Direct Creation
```javascript
import notificationService from '../services/notificationService.js';

await notificationService.createNotification({
  userId: 'user-id',
  type: 'REGISTRATION_CONFIRMED',
  title: 'Registration Confirmed',
  message: 'Your registration has been confirmed!',
  data: { tournamentId: 'abc123' } // Optional JSON data
});
```

### Method 2: Helper Methods (Recommended)
```javascript
// Registration confirmed
await notificationService.notifyRegistrationConfirmed(
  userId, 'Tournament Name', ['Category 1', 'Category 2']
);

// Partner invitation
await notificationService.notifyPartnerInvitation(
  userId, 'Tournament Name', 'Inviter Name', registrationId
);

// Partner accepted
await notificationService.notifyPartnerAccepted(
  userId, 'Tournament Name', 'Partner Name'
);

// Partner declined
await notificationService.notifyPartnerDeclined(
  userId, 'Tournament Name', 'Partner Name'
);

// Draw published
await notificationService.notifyDrawPublished(
  userId, 'Tournament Name', 'Category Name', tournamentId
);

// Match assigned (umpire)
await notificationService.notifyMatchAssigned(userId, {
  player1: 'Player 1',
  player2: 'Player 2',
  courtNumber: 5,
  matchTime: new Date()
});

// Match starting soon
await notificationService.notifyMatchStartingSoon(userId, {
  courtNumber: 5,
  opponentName: 'Opponent',
  matchTime: new Date()
});

// Tournament cancelled
await notificationService.notifyTournamentCancelled(
  userId, 'Tournament Name', 500 // refund amount
);

// Refund processed
await notificationService.notifyRefundProcessed(
  userId, 'Tournament Name', 500
);

// Tournament reminder
await notificationService.notifyTournamentReminder(
  userId, 'Tournament Name', new Date()
);

// Points awarded
await notificationService.notifyPointsAwarded(
  userId, 100, 'Tournament Name', 'Winner'
);

// Account suspended
await notificationService.notifyAccountSuspended(
  userId, 'Violation of terms', '7 days'
);
```

### Bulk Notifications
```javascript
await notificationService.createBulkNotifications([
  {
    userId: 'user1',
    type: 'DRAW_PUBLISHED',
    title: 'Draw Published',
    message: 'The draw has been published',
    data: { tournamentId: 'abc123' }
  },
  {
    userId: 'user2',
    type: 'DRAW_PUBLISHED',
    title: 'Draw Published',
    message: 'The draw has been published',
    data: { tournamentId: 'abc123' }
  }
]);
```

---

## 🎨 FRONTEND - USE NOTIFICATIONS

### In Any Component
```jsx
import { useNotifications } from '../contexts/NotificationContext';

function MyComponent() {
  const {
    notifications,      // Array of notifications
    unreadCount,        // Number of unread notifications
    loading,            // Loading state
    fetchNotifications, // Fetch notifications
    markAsRead,         // Mark notification as read
    markAllAsRead,      // Mark all as read
    deleteNotification  // Delete notification
  } = useNotifications();

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div>
      <h2>You have {unreadCount} unread notifications</h2>
      {notifications.map(notif => (
        <div
          key={notif.id}
          onClick={() => markAsRead(notif.id)}
          style={{ background: notif.read ? 'white' : 'lightblue' }}
        >
          <h3>{notif.title}</h3>
          <p>{notif.message}</p>
          <button onClick={() => deleteNotification(notif.id)}>
            Delete
          </button>
        </div>
      ))}
      <button onClick={markAllAsRead}>Mark All Read</button>
    </div>
  );
}
```

---

## 🔔 NOTIFICATION TYPES

```javascript
const NotificationType = {
  REGISTRATION_CONFIRMED: 'REGISTRATION_CONFIRMED',
  PARTNER_INVITATION: 'PARTNER_INVITATION',
  PARTNER_ACCEPTED: 'PARTNER_ACCEPTED',
  PARTNER_DECLINED: 'PARTNER_DECLINED',
  DRAW_PUBLISHED: 'DRAW_PUBLISHED',
  MATCH_ASSIGNED: 'MATCH_ASSIGNED',
  MATCH_STARTING_SOON: 'MATCH_STARTING_SOON',
  TOURNAMENT_CANCELLED: 'TOURNAMENT_CANCELLED',
  REFUND_PROCESSED: 'REFUND_PROCESSED',
  TOURNAMENT_REMINDER: 'TOURNAMENT_REMINDER',
  POINTS_AWARDED: 'POINTS_AWARDED',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
};
```

---

## 🌐 API ENDPOINTS

### Get Notifications
```bash
GET /api/notifications?page=1&limit=20&unreadOnly=false
Authorization: Bearer JWT_TOKEN
```

### Get Unread Count
```bash
GET /api/notifications/unread-count
Authorization: Bearer JWT_TOKEN
```

### Mark as Read
```bash
PUT /api/notifications/:id/read
Authorization: Bearer JWT_TOKEN
```

### Mark All as Read
```bash
PUT /api/notifications/read-all
Authorization: Bearer JWT_TOKEN
```

### Delete Notification
```bash
DELETE /api/notifications/:id
Authorization: Bearer JWT_TOKEN
```

### Create Test Notification
```bash
POST /api/notifications/test
Authorization: Bearer JWT_TOKEN
```

---

## 🧪 TESTING

### Backend Test
```bash
cd matchify/backend
# Update userId in tests/notifications.test.js
node tests/notifications.test.js
```

### Frontend Test
1. Start backend: `cd matchify/backend && npm run dev`
2. Start frontend: `cd matchify/frontend && npm run dev`
3. Log in to your account
4. Create test notification via API
5. Check bell icon in navbar
6. Click bell to see dropdown

### Quick API Test
```bash
# Create test notification
curl -X POST http://localhost:5000/api/notifications/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get notifications
curl http://localhost:5000/api/notifications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🎯 COMMON USE CASES

### 1. After Tournament Registration
```javascript
// In registration controller
await notificationService.notifyRegistrationConfirmed(
  req.user.id,
  tournament.name,
  categories.map(c => c.name)
);
```

### 2. When Partner Accepts Invitation
```javascript
// In partner controller
await notificationService.notifyPartnerAccepted(
  inviterUserId,
  tournament.name,
  partnerName
);
```

### 3. When Draw is Published
```javascript
// In draw controller
const registrations = await getRegistrations(categoryId);
for (const reg of registrations) {
  await notificationService.notifyDrawPublished(
    reg.userId,
    tournament.name,
    category.name,
    tournament.id
  );
}
```

### 4. Match Reminder (15 min before)
```javascript
// In match scheduler (cron job)
await notificationService.notifyMatchStartingSoon(
  playerId,
  {
    courtNumber: match.courtNumber,
    opponentName: opponent.name,
    matchTime: match.scheduledTime
  }
);
```

### 5. When Points are Awarded
```javascript
// In points controller
await notificationService.notifyPointsAwarded(
  winnerId,
  pointsEarned,
  tournament.name,
  'Winner'
);
```

---

## 🎨 NOTIFICATION ICONS

| Type | Icon | Color |
|------|------|-------|
| REGISTRATION_CONFIRMED | ✅ | Green |
| PARTNER_INVITATION | 🤝 | Blue |
| PARTNER_ACCEPTED | 👍 | Green |
| PARTNER_DECLINED | 👎 | Red |
| DRAW_PUBLISHED | 📊 | Purple |
| MATCH_ASSIGNED | ⚖️ | Orange |
| MATCH_STARTING_SOON | ⏰ | Red |
| TOURNAMENT_CANCELLED | ❌ | Red |
| REFUND_PROCESSED | 💰 | Green |
| TOURNAMENT_REMINDER | 📅 | Blue |
| POINTS_AWARDED | 🏆 | Gold |
| ACCOUNT_SUSPENDED | ⚠️ | Red |

---

## 📊 NOTIFICATION DATA STRUCTURE

```javascript
{
  id: 'uuid',
  userId: 'user-uuid',
  type: 'REGISTRATION_CONFIRMED',
  title: 'Registration Confirmed',
  message: 'Your registration has been confirmed!',
  data: '{"tournamentId":"abc123","categories":["Singles"]}', // JSON string
  read: false,
  createdAt: '2025-12-31T10:00:00.000Z',
  readAt: null
}
```

---

## 🔧 TROUBLESHOOTING

### Notifications not showing?
1. Check if user is logged in
2. Verify JWT token is valid
3. Check browser console for errors
4. Ensure NotificationProvider wraps App

### Unread count not updating?
1. Check if polling is working (every 30s)
2. Verify API endpoint is accessible
3. Check network tab for failed requests
4. Try refreshing the page

### Dropdown not closing?
1. Check if click outside handler is working
2. Verify ref is properly attached
3. Check for z-index conflicts

---

## 💡 BEST PRACTICES

1. **Use Helper Methods** - They're easier and more consistent
2. **Include Context Data** - Add tournamentId, matchId, etc. in data field
3. **Bulk Create** - Use bulk creation for multiple users
4. **Clean Up** - Run cleanup job to delete old notifications
5. **Test Thoroughly** - Test each notification type
6. **Handle Errors** - Wrap in try-catch blocks
7. **Log Actions** - Log notification creation for debugging

---

## 🚀 QUICK START

### 1. Create a notification
```javascript
await notificationService.notifyRegistrationConfirmed(
  userId,
  'Bangalore Open 2025',
  ['Men\'s Singles']
);
```

### 2. View in frontend
- Log in to your account
- Look for bell icon in navbar
- Click to see notifications

### 3. Test it
```bash
curl -X POST http://localhost:5000/api/notifications/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

That's it! You're ready to use the notification system! 🎉
