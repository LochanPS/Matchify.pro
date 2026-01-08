# 🚀 MATCHIFY.PRO - QUICK REFERENCE GUIDE

**One-page reference for developers**

---

## 🔗 QUICK LINKS

| Resource | URL |
|----------|-----|
| Frontend | http://localhost:5173/ |
| Backend | http://localhost:5000/ |
| Health Check | http://localhost:5000/health |
| API Docs | http://localhost:5000/api |

---

## 👤 DEMO ACCOUNTS

```javascript
// Player
Email: testplayer@matchify.com
Password: password123

// Organizer
Email: testorganizer@matchify.com
Password: password123

// Admin
Email: admin@matchify.com
Password: password123
```

---

## 🚀 START SERVERS

```bash
# Backend
cd matchify/backend && npm run dev

# Frontend (new terminal)
cd matchify/frontend && npm run dev
```

---

## 🔔 NOTIFICATION SYSTEM

### Create Notification (Backend)
```javascript
import notificationService from './services/notificationService.js';

// With email
await notificationService.notifyPartnerAccepted(
  userId,
  'Tournament Name',
  'Partner Name',
  tournamentId
);

// Without email
await notificationService.createNotification({
  userId,
  type: 'DRAW_PUBLISHED',
  title: 'Draw Published',
  message: 'Check your bracket!',
  sendEmail: false
});
```

### Use Notifications (Frontend)
```javascript
import { useNotifications } from '../contexts/NotificationContext';

function MyComponent() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    deleteNotification
  } = useNotifications();
  
  return <div>Unread: {unreadCount}</div>;
}
```

---

## 📧 EMAIL SYSTEM

### Send Email
```javascript
import emailService from './services/emailService.js';

// Urgent email
await emailService.sendMatchStartingSoon(
  player,
  match,
  courtNumber,
  opponentName
);

// Quick notification
await emailService.sendQuickNotification(
  user,
  'Your partner accepted!',
  '/tournaments/123'
);
```

---

## 🗄️ DATABASE

### Run Migrations
```bash
cd matchify/backend
npx prisma migrate dev
npx prisma generate
```

### Reset Database
```bash
npx prisma migrate reset
```

### View Database
```bash
npx prisma studio
```

---

## 🔐 AUTHENTICATION

### Get JWT Token (Frontend)
```javascript
const token = localStorage.getItem('token');
```

### API Request with Auth
```javascript
const response = await axios.get('/api/endpoint', {
  headers: { Authorization: `Bearer ${token}` }
});
```

---

## 🎯 API ENDPOINTS

### Notifications
```
GET    /api/notifications
GET    /api/notifications/unread-count
PUT    /api/notifications/:id/read
PUT    /api/notifications/read-all
DELETE /api/notifications/:id
POST   /api/notifications/test
```

### Tournaments
```
GET    /api/tournaments
POST   /api/tournaments
GET    /api/tournaments/:id
PUT    /api/tournaments/:id
DELETE /api/tournaments/:id
```

### Registration
```
POST   /api/registrations
GET    /api/registrations/my
GET    /api/registrations/:id
```

---

## 🧪 TESTING

### Test Notification
```bash
curl -X POST http://localhost:5000/api/notifications/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Email
```bash
cd matchify/backend
node tests/urgentEmails.test.js
```

---

## 🐛 DEBUGGING

### Check Logs
```bash
# Backend logs (terminal where backend is running)
# Frontend logs (browser console F12)
```

### Common Issues
```javascript
// Issue: Notifications not showing
// Fix: Refresh page, check if logged in

// Issue: Email not sending
// Fix: Check SendGrid API key in .env

// Issue: Backend crash
// Fix: Check terminal logs, restart server
```

---

## 📁 FILE LOCATIONS

```
Backend:
- Services: backend/src/services/
- Routes: backend/src/routes/
- Controllers: backend/src/controllers/
- Email Templates: backend/templates/emails/

Frontend:
- Components: frontend/src/components/
- Pages: frontend/src/pages/
- Contexts: frontend/src/contexts/
```

---

## 🔧 ENVIRONMENT VARIABLES

### Backend (.env)
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret"
SENDGRID_API_KEY="your-key"
FRONTEND_URL="http://localhost:5173"
```

### Frontend (.env)
```env
VITE_API_URL="http://localhost:5000"
```

---

## 💡 QUICK COMMANDS

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name
```

---

## 🎯 NOTIFICATION TYPES

```javascript
const types = {
  REGISTRATION_CONFIRMED: 'Registration successful',
  PARTNER_INVITATION: 'Partner invite received',
  PARTNER_ACCEPTED: 'Partner accepted',
  PARTNER_DECLINED: 'Partner declined',
  DRAW_PUBLISHED: 'Draw is ready',
  MATCH_ASSIGNED: 'Umpire assignment',
  MATCH_STARTING_SOON: 'Match in 15 min',
  TOURNAMENT_CANCELLED: 'Tournament cancelled',
  REFUND_PROCESSED: 'Refund credited',
  TOURNAMENT_REMINDER: 'Tournament tomorrow',
  POINTS_AWARDED: 'Points earned',
  ACCOUNT_SUSPENDED: 'Account suspended'
};
```

---

## 📊 USEFUL QUERIES

### Get User Notifications
```javascript
const result = await notificationService.getUserNotifications(
  userId,
  { page: 1, limit: 20, unreadOnly: false }
);
```

### Mark All as Read
```javascript
await notificationService.markAllAsRead(userId);
```

### Get Unread Count
```javascript
const count = await notificationService.getUnreadCount(userId);
```

---

## 🎨 UI COMPONENTS

### Notification Bell
```jsx
import NotificationBell from './components/NotificationBell';

<NotificationBell />
```

### Protected Route
```jsx
import ProtectedRoute from './components/ProtectedRoute';

<ProtectedRoute>
  <YourComponent />
</ProtectedRoute>
```

### Role Route
```jsx
import RoleRoute from './components/RoleRoute';

<RoleRoute allowedRoles={['PLAYER']}>
  <PlayerDashboard />
</RoleRoute>
```

---

## 🔍 SEARCH & FILTER

### Search Tournaments
```javascript
const tournaments = await axios.get('/api/tournaments', {
  params: {
    city: 'Bangalore',
    status: 'UPCOMING',
    search: 'Open'
  }
});
```

---

## 💰 PAYMENT

### Top-up Wallet
```javascript
const order = await axios.post('/api/wallet/create-order', {
  amount: 1000
});

// Use Razorpay checkout
```

### Pay Registration Fee
```javascript
await axios.post('/api/registrations', {
  tournamentId,
  categoryIds,
  paymentMethod: 'WALLET' // or 'RAZORPAY' or 'BOTH'
});
```

---

## 📈 ANALYTICS

### Get Dashboard Stats
```javascript
// Organizer
const stats = await axios.get('/api/organizer/dashboard');

// Admin
const stats = await axios.get('/api/admin/dashboard');
```

---

## 🎯 BEST PRACTICES

1. **Always authenticate requests** - Include JWT token
2. **Handle errors gracefully** - Try-catch blocks
3. **Validate input** - Check data before sending
4. **Use TypeScript** - For better type safety (future)
5. **Test thoroughly** - Use demo accounts
6. **Check logs** - Monitor backend terminal
7. **Clear cache** - If UI issues persist
8. **Use contexts** - For global state
9. **Optimize queries** - Use pagination
10. **Document code** - Add comments

---

## 🚨 EMERGENCY FIXES

### Server Won't Start
```bash
# Kill process on port
npx kill-port 5000  # or 5173

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Database Corrupted
```bash
cd matchify/backend
rm dev.db
npx prisma migrate reset
npx prisma generate
```

### Frontend Build Issues
```bash
cd matchify/frontend
rm -rf node_modules .vite
npm install
npm run dev
```

---

## 📞 SUPPORT

- **Documentation:** Check `/matchify/*.md` files
- **Logs:** Backend terminal + Browser console
- **Database:** `npx prisma studio`
- **API:** Test with Postman/curl

---

**Last Updated:** December 31, 2025  
**Version:** Day 62  
**Status:** ✅ Operational
