# 📱 DAY 59 QUICK REFERENCE: SMS System

**Quick reference for using SMS service**

---

## 🚀 IMPORT SMS SERVICE

```javascript
import smsService from '../services/smsService.js';
```

---

## 📱 SEND SMS

### Basic Send
```javascript
await smsService.send(
  '+919876543210',  // Phone number
  'REGISTRATION_CONFIRMATION',  // Template name
  {
    tournamentName: 'Bangalore Open 2025',
    categoryName: 'Men Singles',
    amount: 500
  }
);
```

### Send with Retry
```javascript
await smsService.sendWithRetry(
  '+919876543210',
  'MATCH_STARTING_SOON',
  {
    courtNumber: '3',
    opponentName: 'Rahul Sharma'
  },
  3  // Retry attempts (optional, default: 3)
);
```

---

## 📧 SMS TEMPLATES

### 1. Registration Confirmation
```javascript
await smsService.send(phone, 'REGISTRATION_CONFIRMATION', {
  tournamentName: 'Bangalore Open 2025',
  categoryName: 'Men Singles',
  amount: 500
});
```

### 2. Match Starting Soon
```javascript
await smsService.send(phone, 'MATCH_STARTING_SOON', {
  courtNumber: '3',
  opponentName: 'Rahul Sharma'
});
```

### 3. Tournament Reminder
```javascript
await smsService.send(phone, 'TOURNAMENT_REMINDER', {
  tournamentName: 'Mumbai Open 2025',
  time: '9:00 AM',
  venue: 'Sports Complex'
});
```

### 4. Draw Published
```javascript
await smsService.send(phone, 'DRAW_PUBLISHED', {
  tournamentName: 'Bangalore Open 2025',
  matchDate: 'Feb 15, 2025 at 10:00 AM'
});
```

### 5. Partner Invitation
```javascript
await smsService.send(phone, 'PARTNER_INVITATION', {
  playerName: 'John Doe',
  tournamentName: 'Mumbai Open 2025'
});
```

### 6. Tournament Cancelled
```javascript
await smsService.send(phone, 'TOURNAMENT_CANCELLED', {
  tournamentName: 'Bangalore Open 2025',
  refundAmount: 500
});
```

### 7. Match Completed
```javascript
await smsService.send(phone, 'MATCH_COMPLETED', {
  result: 'Won 21-19, 21-17',
  pointsEarned: 10
});
```

---

## 📞 PHONE NUMBER FORMATTING

```javascript
// Format phone number to E.164
const formatted = smsService.formatPhoneNumber('9876543210');
// Returns: +919876543210

// Supported formats:
'9876543210'        → '+919876543210'
'+919876543210'     → '+919876543210'
'919876543210'      → '+919876543210'
'+91 98765 43210'   → '+919876543210'
```

---

## 📊 BULK SMS

```javascript
const recipients = [
  { phoneNumber: '+919876543210', name: 'John' },
  { phoneNumber: '+919876543211', name: 'Jane' }
];

const results = await smsService.sendBulk(
  recipients,
  'TOURNAMENT_REMINDER',
  (recipient) => ({
    tournamentName: 'Mumbai Open 2025',
    time: '9:00 AM',
    venue: 'Sports Complex'
  })
);

// Results: [{ recipient, success, result/error }, ...]
```

---

## 🔍 CHECK DELIVERY STATUS

```javascript
const status = await smsService.getStatus('SM1234567890abcdef');
console.log(status);
// {
//   status: 'delivered',
//   errorCode: null,
//   errorMessage: null
// }
```

---

## 🔧 INTEGRATION EXAMPLES

### Registration Controller
```javascript
import smsService from '../services/smsService.js';

// After successful registration
if (user.phone) {
  await smsService.sendWithRetry(
    user.phone,
    'REGISTRATION_CONFIRMATION',
    {
      tournamentName: tournament.name,
      categoryName: category.name,
      amount: totalAmount
    }
  ).catch(err => console.error('SMS failed:', err));
}
```

### Draw Controller
```javascript
// After draw generation
const participants = await prisma.registration.findMany({
  where: { categoryId, status: 'CONFIRMED' },
  include: { user: true }
});

for (const participant of participants) {
  if (participant.user.phone) {
    await smsService.sendWithRetry(
      participant.user.phone,
      'DRAW_PUBLISHED',
      {
        tournamentName: tournament.name,
        matchDate: firstMatch.scheduledTime.toLocaleString()
      }
    ).catch(err => console.error('SMS failed:', err));
  }
}
```

### Match Reminders
```javascript
import { sendMatchReminders } from '../utils/matchReminders.js';

// Run every 5 minutes
setInterval(async () => {
  await sendMatchReminders();
}, 5 * 60 * 1000);
```

---

## 🧪 TESTING

### Test Single SMS
```bash
curl -X POST http://localhost:5000/api/sms/test \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+919876543210",
    "templateName": "REGISTRATION_CONFIRMATION",
    "data": {
      "tournamentName": "Bangalore Open 2025",
      "categoryName": "Men Singles",
      "amount": 500
    }
  }'
```

### View SMS Logs
```bash
curl -X GET "http://localhost:5000/api/sms/logs?page=1&limit=20" \
  -H "Authorization: Bearer <admin_token>"
```

### Check SMS Status
```bash
curl -X GET "http://localhost:5000/api/sms/status/SM1234567890abcdef" \
  -H "Authorization: Bearer <admin_token>"
```

---

## ⚙️ CONFIGURATION

### Enable/Disable SMS
```env
# Disable for development
TWILIO_ENABLED=false

# Enable for production
TWILIO_ENABLED=true
```

### Rate Limiting
```env
# Max SMS per minute per user
SMS_RATE_LIMIT=5
```

### Retry Attempts
```env
# Number of retry attempts
SMS_RETRY_ATTEMPTS=3
```

---

## 🐛 ERROR HANDLING

### Graceful Error Handling
```javascript
try {
  await smsService.send(phone, 'REGISTRATION_CONFIRMATION', data);
} catch (error) {
  if (error.message.includes('rate limit')) {
    console.log('Rate limit exceeded, will retry later');
  } else if (error.message.includes('Invalid phone')) {
    console.log('Invalid phone number format');
  } else {
    console.error('SMS failed:', error.message);
  }
}
```

### Silent Failure (Don't Block User Flow)
```javascript
// Don't let SMS failure break registration
await smsService.sendWithRetry(phone, template, data)
  .catch(err => console.error('SMS failed:', err));
```

---

## 📊 MONITORING

### Check SMS Logs
```javascript
const logs = await prisma.smsLog.findMany({
  where: { status: 'failed' },
  orderBy: { createdAt: 'desc' },
  take: 10
});
```

### Count SMS by Status
```javascript
const stats = await prisma.smsLog.groupBy({
  by: ['status'],
  _count: true
});
```

---

## 💰 COST TRACKING

### Calculate SMS Cost
```javascript
const totalSMS = await prisma.smsLog.count({
  where: { status: 'sent' }
});

const costPerSMS = 0.0645; // ₹ for India
const totalCost = totalSMS * costPerSMS;

console.log(`Total SMS: ${totalSMS}`);
console.log(`Total Cost: ₹${totalCost.toFixed(2)}`);
```

---

## 🔐 SECURITY

### Rate Limit Check
```javascript
const canSend = await smsService.checkRateLimit('+919876543210');
if (!canSend) {
  throw new Error('Rate limit exceeded');
}
```

### Phone Validation
```javascript
const formatted = smsService.formatPhoneNumber(userInput);
if (!formatted) {
  throw new Error('Invalid phone number');
}
```

---

## 📝 BEST PRACTICES

✅ Always use `sendWithRetry()` for important SMS  
✅ Handle errors gracefully (don't block user flow)  
✅ Log all SMS attempts  
✅ Monitor delivery rates  
✅ Respect rate limits  
✅ Format phone numbers before sending  
✅ Use templates for consistency  
✅ Test with real numbers before production

---

**Quick Reference Complete!** 📱
