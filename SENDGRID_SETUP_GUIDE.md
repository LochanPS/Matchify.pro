# SendGrid Email OTP Setup Guide

## Overview
SendGrid is used to automatically send OTP via email to organizers during KYC phone verification. If SendGrid fails, the system falls back to manual OTP sending via WhatsApp/SMS.

## Why SendGrid?
- ✅ **FREE**: 100 emails/day forever
- ✅ **Reliable**: 99.9% delivery rate
- ✅ **Fast**: Instant email delivery
- ✅ **Easy**: Simple API integration
- ✅ **Professional**: Branded emails

## Setup Steps

### Step 1: Create SendGrid Account

1. Go to https://sendgrid.com/
2. Click "Start for Free"
3. Fill in your details:
   - Email
   - Password
   - Company name (Matchify.pro)
4. Verify your email address
5. Complete the onboarding questionnaire

### Step 2: Get API Key

1. Login to SendGrid dashboard
2. Go to **Settings** → **API Keys**
3. Click "Create API Key"
4. Name: `Matchify KYC OTP`
5. Permissions: Select **Full Access** (or at minimum **Mail Send**)
6. Click "Create & View"
7. **COPY THE API KEY** (you won't see it again!)
8. Save it securely

### Step 3: Verify Sender Email

**Important**: SendGrid requires sender verification before sending emails.

#### Option A: Single Sender Verification (Recommended for testing)

1. Go to **Settings** → **Sender Authentication**
2. Click "Verify a Single Sender"
3. Fill in details:
   - **From Name**: Matchify.pro
   - **From Email**: noreply@matchify.pro (or your email)
   - **Reply To**: support@matchify.pro
   - **Company Address**: Your address
4. Click "Create"
5. Check your email and click verification link
6. Once verified, you can send from this email

#### Option B: Domain Authentication (Recommended for production)

1. Go to **Settings** → **Sender Authentication**
2. Click "Authenticate Your Domain"
3. Enter your domain: `matchify.pro`
4. Follow DNS setup instructions
5. Add DNS records to your domain provider
6. Wait for verification (can take up to 48 hours)

### Step 4: Add to Environment Variables

Add to your `.env` file:

```env
# SendGrid Configuration
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@matchify.pro
```

**Important**: 
- Replace `SG.xxx...` with your actual API key
- Use the email you verified in Step 3

### Step 5: Test Email Sending

Run this test in your backend:

```javascript
// Test SendGrid
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: 'your-email@example.com', // Your test email
  from: process.env.SENDGRID_FROM_EMAIL,
  subject: 'Test Email from Matchify',
  text: 'If you receive this, SendGrid is working!',
  html: '<strong>If you receive this, SendGrid is working!</strong>'
};

sgMail.send(msg)
  .then(() => console.log('Email sent successfully!'))
  .catch(error => console.error('Error:', error));
```

## How It Works in Matchify

### Automatic Email OTP Flow

1. **Organizer submits phone + Aadhaar**
   - System generates 6-digit OTP
   - Saves OTP to database

2. **System tries to send email**
   - Uses SendGrid API
   - Sends OTP to organizer's email
   - Beautiful HTML email template

3. **If email succeeds**
   - Organizer receives: "✅ OTP sent to your email!"
   - Organizer checks inbox/spam
   - Enters OTP
   - Phone verified!

4. **If email fails**
   - Organizer receives: "📱 Admin will send OTP to your phone"
   - Admin sees pending verification
   - Admin manually sends OTP via WhatsApp/SMS
   - Organizer enters OTP
   - Phone verified!

### Email Template

The OTP email includes:
- Professional Matchify.pro branding
- Large, clear OTP display
- 10-minute validity warning
- Security notice
- Contact information

## Free Tier Limits

SendGrid Free Plan:
- **100 emails/day** - Forever free
- **2,000 contacts**
- **Single sender verification**
- **Email API access**
- **Email activity tracking**

**For Matchify**: 100 emails/day = 100 organizers can verify per day. More than enough for initial launch!

## Troubleshooting

### Error: "The from email does not match a verified Sender Identity"

**Solution**: You haven't verified your sender email.
- Go to Settings → Sender Authentication
- Verify a single sender
- Use that exact email in `SENDGRID_FROM_EMAIL`

### Error: "Unauthorized"

**Solution**: API key is invalid or not set.
- Check `.env` file has correct API key
- Restart backend server
- Regenerate API key if needed

### Emails going to spam

**Solution**: 
- Set up domain authentication (Option B above)
- Add SPF and DKIM records
- Use professional email content
- Avoid spam trigger words

### Emails not received

**Solution**:
- Check spam/junk folder
- Verify sender email is verified
- Check SendGrid activity log
- Test with different email provider

## Monitoring

### Check Email Delivery

1. Login to SendGrid dashboard
2. Go to **Activity**
3. See all sent emails
4. Check delivery status
5. View bounce/spam reports

### Email Statistics

- **Delivered**: Successfully sent
- **Opens**: Organizer opened email
- **Clicks**: Organizer clicked links
- **Bounces**: Email address invalid
- **Spam Reports**: Marked as spam

## Upgrade Options (If Needed)

If you exceed 100 emails/day:

### Essentials Plan - $19.95/month
- **50,000 emails/month**
- **2x daily sending limit**
- **Email support**

### Pro Plan - $89.95/month
- **100,000 emails/month**
- **Dedicated IP**
- **Phone support**

**For Matchify**: Start with free plan. Upgrade only if you get 100+ organizers/day!

## Security Best Practices

1. **Never commit API key to Git**
   - Use `.env` file
   - Add `.env` to `.gitignore`

2. **Rotate API keys regularly**
   - Every 3-6 months
   - If compromised immediately

3. **Use environment-specific keys**
   - Different keys for dev/staging/production

4. **Monitor usage**
   - Check SendGrid dashboard weekly
   - Watch for unusual activity

## Alternative: Manual OTP Only

If you don't want to use SendGrid:

1. Remove SendGrid from `.env`
2. System automatically falls back to manual OTP
3. Admin sends all OTPs via WhatsApp/SMS
4. Still works perfectly!

## Support

- **SendGrid Docs**: https://docs.sendgrid.com/
- **SendGrid Support**: https://support.sendgrid.com/
- **Matchify Support**: support@matchify.pro

## Summary

✅ **Primary**: SendGrid sends OTP via email (automatic, free, fast)
✅ **Fallback**: Admin sends OTP via WhatsApp/SMS (manual, free, reliable)
✅ **Best of both worlds**: Automatic when possible, manual when needed!
