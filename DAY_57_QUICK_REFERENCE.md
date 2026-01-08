# 📧 DAY 57 QUICK REFERENCE: Email Templates

**Quick reference for using email templates in your code**

---

## 🚀 IMPORT EMAIL SERVICE

```javascript
import emailService from '../services/emailService.js';
```

---

## 📧 EMAIL TEMPLATES

### 1. Registration Confirmation

```javascript
await emailService.sendRegistrationConfirmation({
  name: 'John Doe',
  email: 'john@example.com',
  role: 'PLAYER' // or 'ORGANIZER', 'UMPIRE', 'ADMIN'
});
```

---

### 2. Tournament Registration

```javascript
await emailService.sendTournamentRegistration({
  user: { 
    name: 'John Doe', 
    email: 'john@example.com' 
  },
  tournament: {
    id: 1,
    name: 'Mumbai Open 2025',
    city: 'Mumbai',
    state: 'Maharashtra',
    venue: 'Sports Complex',
    startDate: new Date('2025-02-15'),
    endDate: new Date('2025-02-17'),
    registrationDeadline: new Date('2025-02-10')
  },
  categories: [
    { 
      name: 'Men Singles', 
      gender: 'MALE', 
      type: 'SINGLES', 
      registrationFee: 500 
    }
  ],
  totalAmount: 500,
  paymentMethod: 'Wallet'
});
```

---

### 3. Partner Invitation

```javascript
await emailService.sendPartnerInvitation({
  inviterName: 'John Doe',
  inviterEmail: 'john@example.com',
  partnerEmail: 'partner@example.com',
  registrationId: 123,
  token: 'unique-token-here',
  tournament: {
    id: 1,
    name: 'Mumbai Open 2025',
    city: 'Mumbai',
    state: 'Maharashtra',
    startDate: new Date('2025-02-15'),
    endDate: new Date('2025-02-17')
  },
  category: {
    name: 'Men Doubles',
    gender: 'MALE',
    type: 'DOUBLES',
    registrationFee: 800
  }
});
```

---

### 4. Tournament Cancellation

```javascript
await emailService.sendTournamentCancellation({
  user: { 
    name: 'John Doe', 
    email: 'john@example.com' 
  },
  tournament: {
    name: 'Mumbai Open 2025',
    city: 'Mumbai',
    state: 'Maharashtra',
    startDate: new Date('2025-02-15'),
    endDate: new Date('2025-02-17'),
    cancellationReason: 'Insufficient registrations'
  },
  refundAmount: 500,
  categories: [
    { name: 'Men Singles', registrationFee: 500 }
  ]
});
```

---

### 5. Draw Published

```javascript
await emailService.sendDrawPublished({
  user: { 
    name: 'John Doe', 
    email: 'john@example.com' 
  },
  tournament: {
    id: 1,
    name: 'Mumbai Open 2025'
  },
  categories: [
    { 
      name: 'Men Singles', 
      seed: 3, 
      firstMatchDate: new Date('2025-02-15T10:00:00') 
    }
  ]
});
```

---

### 6. Match Assignment

```javascript
await emailService.sendMatchAssignment({
  umpire: { 
    name: 'Jane Smith', 
    email: 'jane@example.com' 
  },
  match: {
    id: 456,
    player1Name: 'John Doe',
    player2Name: 'Mike Johnson',
    categoryName: 'Men Singles (Open)',
    round: 'QUARTER_FINALS',
    courtNumber: 2,
    scheduledTime: new Date('2025-02-16T11:00:00')
  },
  tournament: { 
    name: 'Mumbai Open 2025' 
  }
});
```

---

### 7. Admin Invite

```javascript
await emailService.sendAdminInvite({
  email: 'newadmin@example.com',
  token: 'unique-invite-token',
  oneTimePassword: 'MATCH2025',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  invitedBy: 'Super Admin'
});
```

---

### 8. Suspension Notice

```javascript
await emailService.sendSuspensionNotice({
  user: { 
    name: 'John Doe', 
    email: 'john@example.com' 
  },
  reason: 'Violation of Terms of Service',
  duration: '30 days',
  suspendedBy: 'Admin Team'
});
```

---

## 🔧 ERROR HANDLING

```javascript
try {
  const result = await emailService.sendRegistrationConfirmation(userData);
  
  if (result.success) {
    console.log('Email sent successfully');
  } else {
    console.error('Email failed:', result.error);
  }
} catch (error) {
  console.error('Email error:', error);
}
```

---

## 📊 RESPONSE FORMAT

```javascript
{
  success: true,  // or false
  result: {...},  // SendGrid response (if success)
  error: 'Error message' // (if failed)
}
```

---

## 🎯 INTEGRATION POINTS (DAY 58)

### Auth Controller
```javascript
// After user registration
await emailService.sendRegistrationConfirmation(user);
```

### Registration Controller
```javascript
// After successful registration
await emailService.sendTournamentRegistration({
  user, tournament, categories, totalAmount, paymentMethod
});
```

### Partner Controller
```javascript
// When sending partner invite
await emailService.sendPartnerInvitation({
  inviterName, inviterEmail, partnerEmail, 
  tournament, category, token, registrationId
});
```

### Tournament Controller
```javascript
// When cancelling tournament
await emailService.sendTournamentCancellation({
  user, tournament, refundAmount, categories
});
```

### Draw Controller
```javascript
// After publishing draw
await emailService.sendDrawPublished({
  user, tournament, categories
});
```

### Match Controller
```javascript
// When assigning umpire
await emailService.sendMatchAssignment({
  umpire, match, tournament
});
```

### Admin Controller
```javascript
// When generating invite
await emailService.sendAdminInvite({
  email, token, oneTimePassword, expiresAt, invitedBy
});

// When suspending user
await emailService.sendSuspensionNotice({
  user, reason, duration, suspendedBy
});
```

---

## 🔗 USEFUL LINKS

- SendGrid Dashboard: https://app.sendgrid.com
- Email Activity: https://app.sendgrid.com/email_activity
- API Keys: https://app.sendgrid.com/settings/api_keys
- Documentation: https://docs.sendgrid.com

---

## 📝 NOTES

- All emails are HTML formatted
- Mobile responsive design
- Brand colors and styling included
- Links point to `FRONTEND_URL` from .env
- Error handling built-in
- Logging to console for debugging

---

**Quick Reference Complete!** 📧
