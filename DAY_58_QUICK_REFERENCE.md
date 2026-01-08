# 📧 DAY 58 QUICK REFERENCE: Email Templates

**Quick reference for using templated emails**

---

## 🚀 IMPORT SERVICES

```javascript
import emailService from '../services/emailService.js';
import templateService from '../services/templateService.js';
```

---

## 📧 TEMPLATED EMAIL METHODS

### 1. Registration Confirmation

```javascript
await emailService.sendRegistrationConfirmation(
  user,           // { email, name }
  tournament,     // { id, name, city, state, startDate, endDate }
  registration    // { categories: [{name}], totalAmount }
);
```

### 2. Partner Invitation

```javascript
await emailService.sendPartnerInvitation(
  playerName,     // String
  playerEmail,    // String
  partnerEmail,   // String
  tournament,     // { id, name, city, state, startDate, endDate }
  category,       // { name, registrationFee }
  registrationId  // String/Number
);
```

### 3. Tournament Cancellation

```javascript
await emailService.sendTournamentCancellation(
  user,           // { email, name }
  tournament,     // { id, name }
  refundDetails,  // { total, walletAmount, razorpayAmount, cancelledBy }
  reason          // String
);
```

### 4. Draw Published

```javascript
await emailService.sendDrawPublished(
  user,           // { email, name, matchifyPoints }
  tournament,     // { id, name }
  category,       // { id, name }
  seedInfo        // { seed, firstMatch }
);
```

### 5. Match Assignment

```javascript
await emailService.sendMatchAssignment(
  umpire,         // { email, name }
  match,          // { id, courtNumber, scheduledTime, player1Name, player2Name, categoryName }
  tournament      // { id, name }
);
```

### 6. Admin Invite

```javascript
await emailService.sendAdminInvite(
  inviteeEmail,   // String
  invitedBy,      // String
  token,          // String
  oneTimePassword,// String
  expiryHours     // Number
);
```

### 7. Suspension Notice

```javascript
await emailService.sendSuspensionNotice(
  user,           // { email, name }
  suspensionDetails // { reason, duration, endDate, canAppeal }
);
```

---

## 📊 EMAIL STATISTICS

```javascript
// Get current stats
const stats = emailService.getStats();
console.log(stats);
// { sent: 10, failed: 0, queued: 2 }
```

---

## 🎨 TEMPLATE SERVICE (Advanced)

### Render Template Manually

```javascript
// Render HTML only
const html = await templateService.renderEmail('registrationConfirmation', {
  playerName: 'John Doe',
  tournamentName: 'Mumbai Open',
  // ... other variables
});

// Render both HTML and text
const { html, text } = await templateService.renderBoth('registrationConfirmation', {
  playerName: 'John Doe',
  // ... other variables
});

// Convert HTML to plain text
const text = templateService.htmlToText(html);
```

---

## 🔧 QUEUE MANAGEMENT

```javascript
// Add email to queue
await emailService.addToQueue({
  to: 'user@example.com',
  from: emailService.from,
  subject: 'Test Email',
  html: '<p>Test</p>',
  text: 'Test'
});

// Process queue manually (usually automatic)
emailService.processQueue();

// Check queue status
const stats = emailService.getStats();
console.log(`Queued: ${stats.queued}`);
```

---

## 🧪 TESTING

### Test Single Email

```javascript
import emailService from './src/services/emailService.js';

await emailService.sendRegistrationConfirmation(
  { email: 'test@example.com', name: 'Test User' },
  {
    id: 1,
    name: 'Test Tournament',
    city: 'Mumbai',
    state: 'Maharashtra',
    startDate: new Date('2025-02-15'),
    endDate: new Date('2025-02-17')
  },
  {
    categories: [{ name: 'Men Singles' }],
    totalAmount: 500
  }
);
```

### Test All Templates

```bash
cd matchify/backend
node tests/emailTemplates.test.js
```

---

## 🎯 TEMPLATE VARIABLES

### Common Variables
- `email` - Recipient email (auto-added)
- `playerName` / `userName` / `umpireName` - User name
- `tournamentName` - Tournament name
- `location` - City, State
- `startDate` / `endDate` - Formatted dates

### Template-Specific Variables

**registrationConfirmation.hbs:**
- categories, amountPaid, tournamentUrl

**partnerInvitation.hbs:**
- partnerName, playerEmail, categoryName, entryFee, acceptUrl, declineUrl

**tournamentCancellation.hbs:**
- cancellationReason, cancelledBy, refundAmount, walletRefund, gatewayRefund, walletUrl

**drawPublished.hbs:**
- categoryName, seedNumber, firstMatchInfo, currentPoints, drawUrl

**matchAssignment.hbs:**
- courtNumber, matchTime, player1, player2, categoryName, scoringConsoleUrl

**adminInvite.hbs:**
- invitedBy, oneTimePassword, expiryDate, expiryHours, acceptUrl

**suspensionNotice.hbs:**
- reason, duration, effectiveDate, endDate, appealUrl

---

## 🔗 FRONTEND URLS

All emails link to frontend:

```javascript
// Set in .env
FRONTEND_URL=http://localhost:5173

// Used in templates
${this.frontendUrl}/tournaments/${id}
${this.frontendUrl}/partner/confirm/${token}
${this.frontendUrl}/wallet
${this.frontendUrl}/tournaments/${id}/draws/${categoryId}
${this.frontendUrl}/scoring/${matchId}
${this.frontendUrl}/invite/accept/${token}
${this.frontendUrl}/unsubscribe?email=${email}
```

---

## 🐛 DEBUGGING

### Enable Verbose Logging

```javascript
// In emailService.js
console.log('Sending email to:', to);
console.log('Template data:', data);
console.log('Rendered HTML length:', html.length);
```

### Check Template Compilation

```javascript
// Test template loading
const template = await templateService.loadTemplate('registrationConfirmation');
console.log('Template loaded:', !!template);
```

### Verify Queue Processing

```javascript
// Log queue activity
console.log('Queue length:', emailService.queue.length);
console.log('Is processing:', emailService.isProcessing);
```

---

## ⚠️ COMMON ERRORS

### "Template not found"
**Fix:** Check file exists at `backend/templates/emails/{name}.hbs`

### "SendGrid API key invalid"
**Fix:** Verify `SENDGRID_API_KEY` in `.env`

### "Rate limit exceeded"
**Fix:** Queue automatically retries, or upgrade SendGrid plan

### "CSS not inlining"
**Fix:** Ensure `juice` package installed

### "Variables not rendering"
**Fix:** Check variable names match template exactly

---

## 📝 BEST PRACTICES

✅ Always use templated methods for consistency  
✅ Check email stats after bulk sends  
✅ Test templates before production  
✅ Keep template variables simple  
✅ Use queue for bulk operations  
✅ Monitor SendGrid dashboard  
✅ Handle errors gracefully  
✅ Log important email events

---

## 🚀 PRODUCTION CHECKLIST

- [ ] All templates tested
- [ ] SendGrid API key configured
- [ ] Sender email verified
- [ ] Frontend URL updated
- [ ] Error handling in place
- [ ] Logging configured
- [ ] Queue working correctly
- [ ] Stats tracking enabled
- [ ] Unsubscribe links working
- [ ] Mobile responsive verified

---

**Quick Reference Complete!** 📧
