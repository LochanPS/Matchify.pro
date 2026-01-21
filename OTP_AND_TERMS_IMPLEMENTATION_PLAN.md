# OTP Verification & Terms Acceptance Implementation Plan

## Overview
Implement two features before KYC verification:
1. **Phone OTP Verification** - Verify organizer's phone number
2. **Terms & Conditions** - Accept T&C before starting KYC

## Flow Diagram

```
Organizer Dashboard
    ↓
Click "Complete KYC"
    ↓
KYC Info Page (What is KYC)
    ↓
Click "Start KYC Verification"
    ↓
[NEW] Terms & Conditions Modal → Accept/Decline
    ↓ (Accept)
[NEW] Phone Verification Page → Enter Phone → Send OTP → Verify OTP
    ↓ (Verified)
Payment Page (₹50)
    ↓
KYC Submission (Aadhaar Upload)
    ↓
Video Call Verification
    ↓
Approved → Can Create Tournaments
```

## 1. Phone OTP Verification

### SMS Service Options (India)

#### Option A: Twilio (Recommended)
- **Cost**: $0.0079 per SMS (~₹0.65)
- **Reliability**: Very high
- **Setup**: Easy
- **Indian Numbers**: Supported
- **Free Trial**: $15 credit

#### Option B: MSG91
- **Cost**: ₹0.15-0.25 per SMS
- **Reliability**: High
- **Setup**: Easy
- **Indian Numbers**: Native support
- **Free Trial**: 100 SMS

#### Option C: Fast2SMS
- **Cost**: ₹0.10-0.20 per SMS
- **Reliability**: Medium
- **Setup**: Very easy
- **Indian Numbers**: Native support
- **Free Trial**: Available

#### Option D: AWS SNS
- **Cost**: $0.00645 per SMS (~₹0.54)
- **Reliability**: Very high
- **Setup**: Medium complexity
- **Indian Numbers**: Supported

**Recommendation**: Use **MSG91** or **Fast2SMS** for Indian market (cheaper, native support)

### Database Schema Changes

```prisma
model User {
  // Existing fields...
  phone                String?             @unique
  phoneVerified        Boolean             @default(false)
  phoneVerifiedAt      DateTime?
  
  // Add OTP tracking
  otpVerifications     OTPVerification[]
}

model OTPVerification {
  id            String   @id @default(uuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  phone         String
  otp           String   // Hashed OTP
  purpose       String   // "PHONE_VERIFICATION", "PASSWORD_RESET", etc.
  expiresAt     DateTime
  verified      Boolean  @default(false)
  verifiedAt    DateTime?
  attempts      Int      @default(0)
  maxAttempts   Int      @default(3)
  createdAt     DateTime @default(now())
  
  @@index([userId])
  @@index([phone])
  @@index([expiresAt])
}
```

### Backend Implementation

#### 1. OTP Controller (`backend/src/controllers/otp.controller.js`)

```javascript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import axios from 'axios';

const prisma = new PrismaClient();

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via SMS (MSG91 example)
const sendSMS = async (phone, otp) => {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;
  
  const url = `https://api.msg91.com/api/v5/otp`;
  
  try {
    await axios.post(url, {
      template_id: templateId,
      mobile: phone,
      authkey: authKey,
      otp: otp
    });
    return true;
  } catch (error) {
    console.error('SMS send error:', error);
    return false;
  }
};

// Send OTP
export const sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    const userId = req.user.id;
    
    // Validate phone number (Indian format)
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        error: 'INVALID_PHONE',
        message: 'Please enter a valid 10-digit Indian phone number'
      });
    }
    
    // Check if phone already verified by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        phone,
        phoneVerified: true,
        id: { not: userId }
      }
    });
    
    if (existingUser) {
      return res.status(400).json({
        error: 'PHONE_TAKEN',
        message: 'This phone number is already verified by another user'
      });
    }
    
    // Check rate limiting (max 3 OTPs per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentOTPs = await prisma.oTPVerification.count({
      where: {
        userId,
        phone,
        createdAt: { gte: oneHourAgo }
      }
    });
    
    if (recentOTPs >= 3) {
      return res.status(429).json({
        error: 'RATE_LIMIT',
        message: 'Too many OTP requests. Please try again after 1 hour.'
      });
    }
    
    // Generate OTP
    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);
    
    // Save OTP to database
    const otpRecord = await prisma.oTPVerification.create({
      data: {
        userId,
        phone,
        otp: hashedOTP,
        purpose: 'PHONE_VERIFICATION',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      }
    });
    
    // Send SMS
    const smsSent = await sendSMS(phone, otp);
    
    if (!smsSent) {
      return res.status(500).json({
        error: 'SMS_FAILED',
        message: 'Failed to send OTP. Please try again.'
      });
    }
    
    res.json({
      success: true,
      message: 'OTP sent successfully',
      otpId: otpRecord.id,
      expiresIn: 600 // seconds
    });
    
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      error: 'SEND_FAILED',
      message: 'Failed to send OTP'
    });
  }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
  try {
    const { otpId, otp } = req.body;
    const userId = req.user.id;
    
    if (!otp || otp.length !== 6) {
      return res.status(400).json({
        error: 'INVALID_OTP',
        message: 'Please enter a valid 6-digit OTP'
      });
    }
    
    // Find OTP record
    const otpRecord = await prisma.oTPVerification.findFirst({
      where: {
        id: otpId,
        userId,
        verified: false
      }
    });
    
    if (!otpRecord) {
      return res.status(404).json({
        error: 'OTP_NOT_FOUND',
        message: 'OTP not found or already verified'
      });
    }
    
    // Check expiry
    if (new Date() > otpRecord.expiresAt) {
      return res.status(400).json({
        error: 'OTP_EXPIRED',
        message: 'OTP has expired. Please request a new one.'
      });
    }
    
    // Check max attempts
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      return res.status(400).json({
        error: 'MAX_ATTEMPTS',
        message: 'Maximum verification attempts exceeded. Please request a new OTP.'
      });
    }
    
    // Verify OTP
    const isValid = await bcrypt.compare(otp, otpRecord.otp);
    
    // Increment attempts
    await prisma.oTPVerification.update({
      where: { id: otpId },
      data: { attempts: otpRecord.attempts + 1 }
    });
    
    if (!isValid) {
      const remainingAttempts = otpRecord.maxAttempts - (otpRecord.attempts + 1);
      return res.status(400).json({
        error: 'INVALID_OTP',
        message: `Invalid OTP. ${remainingAttempts} attempts remaining.`
      });
    }
    
    // Mark OTP as verified
    await prisma.oTPVerification.update({
      where: { id: otpId },
      data: {
        verified: true,
        verifiedAt: new Date()
      }
    });
    
    // Update user phone verification
    await prisma.user.update({
      where: { id: userId },
      data: {
        phone: otpRecord.phone,
        phoneVerified: true,
        phoneVerifiedAt: new Date()
      }
    });
    
    res.json({
      success: true,
      message: 'Phone number verified successfully'
    });
    
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      error: 'VERIFY_FAILED',
      message: 'Failed to verify OTP'
    });
  }
};

// Resend OTP
export const resendOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    const userId = req.user.id;
    
    // Same logic as sendOTP
    return sendOTP(req, res);
    
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      error: 'RESEND_FAILED',
      message: 'Failed to resend OTP'
    });
  }
};
```

#### 2. OTP Routes (`backend/src/routes/otp.routes.js`)

```javascript
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { sendOTP, verifyOTP, resendOTP } from '../controllers/otp.controller.js';

const router = express.Router();

router.use(authenticate);

router.post('/send', sendOTP);
router.post('/verify', verifyOTP);
router.post('/resend', resendOTP);

export default router;
```

### Frontend Implementation

#### 1. Phone Verification Page (`frontend/src/pages/organizer/PhoneVerificationPage.jsx`)

```jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../utils/api';

export default function PhoneVerificationPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [phone, setPhone] = useState('');
  const [otp, setOTP] = useState('');
  const [otpId, setOtpId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);
  
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(t => t - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);
  
  const handleSendOTP = async () => {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/otp/send', { phone });
      setOtpId(response.data.otpId);
      setStep('otp');
      setTimer(600); // 10 minutes
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };
  
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await api.post('/otp/verify', { otpId, otp });
      // Navigate to payment page
      navigate('/organizer/kyc/payment');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };
  
  const handleResend = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/otp/resend', { phone });
      setOtpId(response.data.otpId);
      setTimer(600);
      setOTP('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group mb-6"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back</span>
        </button>
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Phone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Verify Phone Number</h1>
          <p className="text-gray-300">We'll send you an OTP to verify your number</p>
        </div>
        
        {/* Phone Input Step */}
        {step === 'phone' && (
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
            <label className="block text-gray-300 mb-2">Phone Number</label>
            <div className="flex gap-2 mb-4">
              <div className="px-4 py-3 bg-slate-700/50 text-white rounded-xl border border-white/10 font-medium">
                +91
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter 10-digit number"
                maxLength={10}
                className="flex-1 px-4 py-3 bg-slate-700/50 text-white rounded-xl border border-white/10 focus:outline-none focus:border-purple-500"
              />
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}
            
            <button
              onClick={handleSendOTP}
              disabled={loading || phone.length !== 10}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                'Send OTP'
              )}
            </button>
          </div>
        )}
        
        {/* OTP Verification Step */}
        {step === 'otp' && (
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
            <p className="text-gray-300 mb-4 text-center">
              Enter the 6-digit OTP sent to <strong className="text-white">+91 {phone}</strong>
            </p>
            
            <input
              type="text"
              value={otp}
              onChange={(e) => setOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              className="w-full px-4 py-3 bg-slate-700/50 text-white rounded-xl border border-white/10 focus:outline-none focus:border-purple-500 text-center text-2xl tracking-widest mb-4"
            />
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}
            
            <button
              onClick={handleVerifyOTP}
              disabled={loading || otp.length !== 6}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2 mb-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Verify OTP
                </>
              )}
            </button>
            
            <div className="text-center">
              {timer > 0 ? (
                <p className="text-gray-400 text-sm">
                  Resend OTP in {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                </p>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={loading}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

## 2. Terms & Conditions

### Implementation

#### 1. Terms & Conditions Modal Component

```jsx
// frontend/src/components/TermsAndConditionsModal.jsx
import { X, CheckCircle } from 'lucide-react';

export default function TermsAndConditionsModal({ isOpen, onAccept, onDecline }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl border border-white/10 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Terms & Conditions</h2>
          <button
            onClick={onDecline}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="prose prose-invert max-w-none">
            <h3>KYC Verification Terms</h3>
            <p>By proceeding with KYC verification, you agree to the following terms:</p>
            
            <h4>1. Identity Verification</h4>
            <ul>
              <li>You will provide accurate and truthful information</li>
              <li>You will upload a valid government-issued Aadhaar card</li>
              <li>You will participate in a video verification call</li>
              <li>You understand that false information may result in account suspension</li>
            </ul>
            
            <h4>2. Data Privacy</h4>
            <ul>
              <li>Your Aadhaar details will be encrypted and stored securely</li>
              <li>We will not share your information with third parties</li>
              <li>Data is used solely for verification purposes</li>
              <li>You can request data deletion by contacting support</li>
            </ul>
            
            <h4>3. Organizer Responsibilities</h4>
            <ul>
              <li>You will conduct tournaments fairly and professionally</li>
              <li>You will handle player registrations and payments responsibly</li>
              <li>You will provide accurate tournament information</li>
              <li>You will resolve disputes in good faith</li>
            </ul>
            
            <h4>4. Platform Rules</h4>
            <ul>
              <li>You will comply with all platform policies</li>
              <li>You will not engage in fraudulent activities</li>
              <li>You understand that violations may result in account termination</li>
              <li>You agree to maintain professional conduct</li>
            </ul>
            
            <h4>5. Payment Terms</h4>
            <ul>
              <li>KYC verification requires a one-time ₹50 fee</li>
              <li>This fee is non-refundable</li>
              <li>Payment must be completed before KYC submission</li>
            </ul>
            
            <h4>6. Verification Process</h4>
            <ul>
              <li>Verification typically takes 5-10 minutes</li>
              <li>Admin may reject KYC if documents are unclear or invalid</li>
              <li>You can resubmit KYC if rejected</li>
              <li>Approval is at the discretion of Matchify.pro admin</li>
            </ul>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex gap-4">
          <button
            onClick={onDecline}
            className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
          >
            Decline
          </button>
          <button
            onClick={onAccept}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Accept & Continue
          </button>
        </div>
      </div>
    </div>
  );
}
```

#### 2. Update KYC Info Page

```jsx
// Add state for terms modal
const [showTermsModal, setShowTermsModal] = useState(false);

// Update button click
<button
  onClick={() => setShowTermsModal(true)}
  className="flex-1 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600..."
>
  Start KYC Verification
</button>

// Add modal
<TermsAndConditionsModal
  isOpen={showTermsModal}
  onAccept={() => {
    setShowTermsModal(false);
    navigate('/organizer/kyc/phone-verify');
  }}
  onDecline={() => setShowTermsModal(false)}
/>
```

## Environment Variables

Add to `.env`:

```env
# SMS Service (MSG91)
MSG91_AUTH_KEY=your_auth_key_here
MSG91_TEMPLATE_ID=your_template_id_here

# OR Fast2SMS
FAST2SMS_API_KEY=your_api_key_here

# OR Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

## Testing

### Test Flow
1. Login as organizer
2. Click KYC banner
3. Read KYC info
4. Click "Start KYC"
5. Accept Terms & Conditions
6. Enter phone number
7. Receive OTP (check phone)
8. Enter OTP
9. Verify success
10. Proceed to payment

## Cost Estimate

- **MSG91**: ₹0.20 per OTP × 1000 organizers = ₹200
- **Fast2SMS**: ₹0.15 per OTP × 1000 organizers = ₹150
- **Twilio**: ₹0.65 per OTP × 1000 organizers = ₹650

**Recommendation**: Start with MSG91 or Fast2SMS for cost-effectiveness.

## Next Steps

1. Choose SMS provider (MSG91 recommended)
2. Create account and get API keys
3. Implement database migration
4. Implement backend OTP controller
5. Implement frontend phone verification page
6. Implement terms & conditions modal
7. Update KYC flow
8. Test thoroughly
9. Deploy

Would you like me to proceed with the implementation?
