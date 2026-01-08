# 🧪 DAY 58 TESTING GUIDE: Email Templates

**Complete testing guide for email templates**

---

## 🚀 QUICK START

### Prerequisites
- SendGrid API key configured
- Backend dependencies installed
- Test email address ready

### Setup
```bash
cd matchify/backend

# Install dependencies (if not done)
npm install handlebars juice

# Update test email
# Edit: tests/emailTemplates.test.js
# Line 6: const testEmail = 'your-email@example.com';
```

---

## 📧 RUN ALL TESTS

```bash
node tests/emailTemplates.test.js
```

### Expected Output
```
🧪 Testing all email templates...
============================================================

1️⃣  Sending Registration Confirmation...
   ✅ Email sent to test@example.com (1 total)
   ✅ Sent!

2️⃣  Sending Partner Invitation...
   ✅ Email sent to test@example.com (2 total)
   ✅ Sent!

3️⃣  Sending Tournament Cancellation...
   ✅ Email sent to test@example.com (3 total)
   ✅ Sent!

4️⃣  Sending Draw Published...
   ✅ Email sent to test@example.com (4 total)
   ✅ Sent!

5️⃣  Sending Match Assignment...
   ✅ Email sent to test@example.com (5 total)
   ✅ Sent!

6️⃣  Sending Admin Invite...
   ✅ Email sent to test@example.com (6 total)
   ✅ Sent!

7️⃣  Sending Suspension Notice...
   ✅ Email sent to test@example.com (7 total)
   ✅ Sent!

============================================================
🎉 All emails sent! Check your inbox at: test@example.com

📊 Email Stats:
{ sent: 7, failed: 0, queued: 0 }
```

---

## ✅ VISUAL TESTING CHECKLIST

### Gmail (Web)
- [ ] All 7 emails received
- [ ] Headers display correctly
- [ ] Gradient backgrounds render
- [ ] Buttons are clickable
- [ ] Links work correctly
- [ ] Footer displays properly
- [ ] No broken layouts

### Gmail (Mobile App)
- [ ] Responsive layout works
- [ ] Text is readable
- [ ] Buttons are tappable
- [ ] Images scale properly
- [ ] No horizontal scrolling

### Outlook (Web)
- [ ] Emails render correctly
- [ ] CSS styles applied
- [ ] Buttons display
- [ ] Links functional
- [ ] No layout issues

### Outlook (Desktop)
- [ ] Basic layout preserved
- [ ] Text readable
- [ ] Links work
- [ ] Fallback styles applied

### Apple Mail (iOS)
- [ ] Responsive design works
- [ ] Touch targets adequate
- [ ] Fonts render correctly
- [ ] Colors accurate

### Apple Mail (macOS)
- [ ] Desktop layout correct
- [ ] All elements visible
- [ ] Interactions work
- [ ] Print preview acceptable

---

## 📋 CONTENT TESTING

### Variable Substitution
- [ ] {{playerName}} renders correctly
- [ ] {{tournamentName}} displays
- [ ] {{location}} formatted properly
- [ ] {{dates}} show correctly
- [ ] {{amounts}} display with ₹
- [ ] No {{undefined}} visible
- [ ] No empty fields

### Conditional Content
- [ ] {{#if endDate}} works
- [ ] {{#if appealUrl}} displays correctly
- [ ] Empty conditionals hidden
- [ ] Proper fallbacks shown

### Formatting
- [ ] Dates: MM/DD/YYYY format
- [ ] Currency: ₹1,200 format
- [ ] Times: 12-hour format
- [ ] Lists: Proper bullets
- [ ] Paragraphs: Proper spacing

---

## 🔗 FUNCTIONAL TESTING

### Link Testing
Test each link in emails:

#### Registration Confirmation
- [ ] "View Tournament Details" → `/tournaments/{id}`

#### Partner Invitation
- [ ] "Accept Invitation" → `/partner/confirm/{token}`
- [ ] "Decline" → `/partner/decline/{token}`

#### Tournament Cancellation
- [ ] "Check Wallet Balance" → `/wallet`
- [ ] "Browse Tournaments" → `/tournaments`

#### Draw Published
- [ ] "View Full Draw" → `/tournaments/{id}/draws/{categoryId}`

#### Match Assignment
- [ ] "Open Scoring Console" → `/scoring/{matchId}`

#### Admin Invite
- [ ] "Accept Invitation" → `/invite/accept/{token}`

#### All Emails
- [ ] "Unsubscribe" → `/unsubscribe?email={email}`
- [ ] "support@matchify.pro" → Opens email client

---

## 🎨 DESIGN TESTING

### Colors
- [ ] Header gradient: Purple (#667eea to #764ba2)
- [ ] Buttons: Purple (#667eea)
- [ ] Success: Green (#10b981)
- [ ] Error: Red (#ef4444)
- [ ] Warning: Orange (#f59e0b)
- [ ] Text: Dark gray (#333)

### Typography
- [ ] Headers: Bold, readable
- [ ] Body text: 16px minimum
- [ ] Links: Underlined or colored
- [ ] Buttons: Clear labels
- [ ] Monospace: OTP codes

### Layout
- [ ] Max width: 600px
- [ ] Padding: Consistent
- [ ] Margins: Proper spacing
- [ ] Borders: Rounded corners
- [ ] Shadows: Subtle depth

---

## 🐛 COMMON ISSUES & FIXES

### Issue: Emails Not Sending
**Check:**
```bash
# Verify SendGrid API key
echo $SENDGRID_API_KEY

# Check .env file
cat backend/.env | grep SENDGRID
```

**Fix:**
- Ensure API key is correct
- Verify sender email verified in SendGrid
- Check daily limit (100 emails/day free)

### Issue: Template Not Found
**Check:**
```bash
# Verify template files exist
ls backend/templates/emails/

# Check template service path
node -e "import ts from './src/services/templateService.js'; console.log(ts.basePath)"
```

**Fix:**
- Ensure all .hbs files created
- Check file permissions
- Verify path in templateService.js

### Issue: CSS Not Inlining
**Check:**
```bash
# Verify juice installed
npm list juice
```

**Fix:**
```bash
npm install juice --save
```

### Issue: Variables Not Rendering
**Check:**
- Variable names match template
- Data passed to template
- No typos in variable names

**Fix:**
```javascript
// Log data before sending
console.log('Template data:', data);
```

### Issue: Queue Not Processing
**Check:**
```javascript
// Check queue stats
const stats = emailService.getStats();
console.log(stats);
```

**Fix:**
```javascript
// Manually trigger processing
emailService.processQueue();
```

---

## 📊 PERFORMANCE TESTING

### Load Testing
```javascript
// Send 10 emails rapidly
for (let i = 0; i < 10; i++) {
  await emailService.sendRegistrationConfirmation(user, tournament, registration);
}

// Check stats
console.log(emailService.getStats());
// Should show: queued: 10, then gradually sent
```

### Memory Testing
```javascript
// Send 100 emails
for (let i = 0; i < 100; i++) {
  await emailService.sendRegistrationConfirmation(user, tournament, registration);
}

// Check memory usage
console.log(process.memoryUsage());
```

---

## 🔐 SECURITY TESTING

### XSS Prevention
```javascript
// Test with malicious input
const maliciousData = {
  playerName: '<script>alert("XSS")</script>',
  tournamentName: '<img src=x onerror=alert(1)>'
};

// Should be escaped in email
await emailService.sendRegistrationConfirmation(
  { email: testEmail, name: maliciousData.playerName },
  { name: maliciousData.tournamentName, ...tournament },
  registration
);

// Check email: Should show escaped HTML, not execute
```

### SQL Injection Prevention
```javascript
// Test with SQL injection
const sqlData = {
  playerName: "'; DROP TABLE users; --",
  tournamentName: "1' OR '1'='1"
};

// Should be safely handled
await emailService.sendRegistrationConfirmation(
  { email: testEmail, name: sqlData.playerName },
  { name: sqlData.tournamentName, ...tournament },
  registration
);
```

---

## 📱 MOBILE TESTING

### iOS Testing
1. Forward email to iPhone
2. Open in Mail app
3. Check:
   - [ ] Responsive layout
   - [ ] Touch targets (44x44px minimum)
   - [ ] Readable text (16px+)
   - [ ] Buttons tappable
   - [ ] Links work

### Android Testing
1. Forward email to Android device
2. Open in Gmail app
3. Check:
   - [ ] Layout adapts
   - [ ] Text readable
   - [ ] Buttons work
   - [ ] No overflow

---

## 🎯 ACCEPTANCE CRITERIA

### Must Pass
✅ All 7 emails send successfully  
✅ No errors in console  
✅ All variables render correctly  
✅ Links work in all emails  
✅ Mobile responsive  
✅ No broken layouts  
✅ Plain text version readable  
✅ Queue processes correctly

### Should Pass
✅ Renders in Gmail, Outlook, Apple Mail  
✅ No spam folder delivery  
✅ Images load (if any)  
✅ Unsubscribe link works  
✅ Stats tracking accurate

---

## 📝 TEST REPORT TEMPLATE

```markdown
# Email Template Test Report

**Date:** [Date]
**Tester:** [Name]
**Environment:** [Dev/Staging/Prod]

## Test Results

### Emails Sent
- Registration Confirmation: ✅/❌
- Partner Invitation: ✅/❌
- Tournament Cancellation: ✅/❌
- Draw Published: ✅/❌
- Match Assignment: ✅/❌
- Admin Invite: ✅/❌
- Suspension Notice: ✅/❌

### Visual Testing
- Gmail (Web): ✅/❌
- Gmail (Mobile): ✅/❌
- Outlook (Web): ✅/❌
- Outlook (Desktop): ✅/❌
- Apple Mail (iOS): ✅/❌
- Apple Mail (macOS): ✅/❌

### Functional Testing
- All links work: ✅/❌
- Variables render: ✅/❌
- Conditionals work: ✅/❌
- Queue processes: ✅/❌

### Issues Found
1. [Issue description]
2. [Issue description]

### Recommendations
1. [Recommendation]
2. [Recommendation]

## Conclusion
[Pass/Fail] - [Summary]
```

---

## 🚀 NEXT STEPS

After successful testing:
1. ✅ Verify all emails working
2. ✅ Test on multiple devices
3. ✅ Check spam folder status
4. ✅ Monitor SendGrid dashboard
5. 🔜 Integrate into API endpoints (Day 59)

---

**Testing Complete!** 🎉  
**Ready for production deployment**
