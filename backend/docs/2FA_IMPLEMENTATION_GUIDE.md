# Two-Factor Authentication (2FA) Implementation Guide

**Status:** 🚧 Planned for Future Release  
**Priority:** High  
**Estimated Effort:** 2-3 days

---

## Overview

Two-Factor Authentication (2FA) adds an extra layer of security to admin accounts by requiring a second form of verification beyond just a password.

---

## Proposed Implementation

### 1. Database Schema

Add to `prisma/schema.prisma`:

```prisma
model TwoFactorAuth {
  id          String   @id @default(uuid())
  userId      String   @unique
  secret      String   // TOTP secret (encrypted)
  backupCodes String[] // Recovery codes (hashed)
  enabled     Boolean  @default(false)
  enabledAt   DateTime?
  lastUsedAt  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("two_factor_auth")
}

model User {
  // ... existing fields
  twoFactorAuth TwoFactorAuth?
  require2FA    Boolean @default(false) // Force 2FA for admins
}
```

### 2. Backend Implementation

**Dependencies:**
```bash
npm install speakeasy qrcode
```

**Service:** `src/services/twoFactorAuth.service.js`

```javascript
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

class TwoFactorAuthService {
  /**
   * Generate 2FA secret and QR code
   */
  static async enable2FA(userId) {
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Matchify.pro (${user.email})`,
      length: 32
    });

    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      backupCodes.push(code);
    }

    // Hash backup codes
    const hashedCodes = await Promise.all(
      backupCodes.map(code => bcrypt.hash(code, 10))
    );

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    // Save to database (not enabled yet)
    await prisma.twoFactorAuth.create({
      data: {
        userId,
        secret: secret.base32, // Should be encrypted in production
        backupCodes: hashedCodes,
        enabled: false
      }
    });

    return {
      secret: secret.base32,
      qrCode,
      backupCodes // Show once, never again
    };
  }

  /**
   * Verify 2FA token and enable
   */
  static async verify2FA(userId, token) {
    const twoFA = await prisma.twoFactorAuth.findUnique({
      where: { userId }
    });

    if (!twoFA) {
      throw new Error('2FA not initialized');
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: twoFA.secret,
      encoding: 'base32',
      token,
      window: 2 // Allow 2 time steps (60 seconds)
    });

    if (!verified) {
      throw new Error('Invalid 2FA token');
    }

    // Enable 2FA
    await prisma.twoFactorAuth.update({
      where: { userId },
      data: {
        enabled: true,
        enabledAt: new Date()
      }
    });

    return true;
  }

  /**
   * Verify 2FA token during login
   */
  static async verifyLogin(userId, token) {
    const twoFA = await prisma.twoFactorAuth.findUnique({
      where: { userId }
    });

    if (!twoFA || !twoFA.enabled) {
      return false;
    }

    // Try TOTP token
    const verified = speakeasy.totp.verify({
      secret: twoFA.secret,
      encoding: 'base32',
      token,
      window: 2
    });

    if (verified) {
      // Update last used
      await prisma.twoFactorAuth.update({
        where: { userId },
        data: { lastUsedAt: new Date() }
      });
      return true;
    }

    // Try backup codes
    for (const hashedCode of twoFA.backupCodes) {
      const match = await bcrypt.compare(token, hashedCode);
      if (match) {
        // Remove used backup code
        await prisma.twoFactorAuth.update({
          where: { userId },
          data: {
            backupCodes: twoFA.backupCodes.filter(c => c !== hashedCode),
            lastUsedAt: new Date()
          }
        });
        return true;
      }
    }

    return false;
  }

  /**
   * Disable 2FA
   */
  static async disable2FA(userId, password) {
    // Verify password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      throw new Error('Invalid password');
    }

    // Delete 2FA
    await prisma.twoFactorAuth.delete({
      where: { userId }
    });

    return true;
  }
}

export default TwoFactorAuthService;
```

### 3. API Endpoints

**Routes:** `src/routes/auth.routes.js`

```javascript
// Enable 2FA (step 1: generate secret)
router.post('/2fa/enable', authenticate, async (req, res) => {
  try {
    const result = await TwoFactorAuthService.enable2FA(req.user.id);
    res.json({
      success: true,
      qrCode: result.qrCode,
      backupCodes: result.backupCodes,
      message: 'Scan QR code with authenticator app'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify and activate 2FA (step 2: verify token)
router.post('/2fa/verify', authenticate, async (req, res) => {
  try {
    const { token } = req.body;
    await TwoFactorAuthService.verify2FA(req.user.id, token);
    res.json({
      success: true,
      message: '2FA enabled successfully'
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Disable 2FA
router.post('/2fa/disable', authenticate, async (req, res) => {
  try {
    const { password } = req.body;
    await TwoFactorAuthService.disable2FA(req.user.id, password);
    res.json({
      success: true,
      message: '2FA disabled successfully'
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
```

### 4. Login Flow Update

**Update:** `src/controllers/auth.controller.js`

```javascript
const login = async (req, res) => {
  const { email, password, twoFactorToken } = req.body;

  // ... existing password verification ...

  // Check if 2FA is enabled
  const twoFA = await prisma.twoFactorAuth.findUnique({
    where: { userId: user.id }
  });

  if (twoFA && twoFA.enabled) {
    if (!twoFactorToken) {
      return res.status(200).json({
        requires2FA: true,
        message: 'Please provide 2FA token'
      });
    }

    const verified = await TwoFactorAuthService.verifyLogin(
      user.id,
      twoFactorToken
    );

    if (!verified) {
      return res.status(401).json({
        error: 'Invalid 2FA token'
      });
    }
  }

  // ... generate JWT and return ...
};
```

### 5. Frontend Implementation

**Component:** `src/pages/admin/AdminSettings.jsx`

```jsx
const Enable2FA = () => {
  const [step, setStep] = useState(1); // 1: generate, 2: verify
  const [qrCode, setQrCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [token, setToken] = useState('');

  const handleEnable = async () => {
    const res = await axios.post('/api/auth/2fa/enable');
    setQrCode(res.data.qrCode);
    setBackupCodes(res.data.backupCodes);
    setStep(2);
  };

  const handleVerify = async () => {
    await axios.post('/api/auth/2fa/verify', { token });
    alert('2FA enabled successfully!');
  };

  return (
    <div>
      {step === 1 && (
        <button onClick={handleEnable}>Enable 2FA</button>
      )}
      {step === 2 && (
        <div>
          <img src={qrCode} alt="QR Code" />
          <p>Scan with Google Authenticator or Authy</p>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter 6-digit code"
          />
          <button onClick={handleVerify}>Verify & Enable</button>
          <div>
            <h4>Backup Codes (save these!):</h4>
            {backupCodes.map(code => <div key={code}>{code}</div>)}
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## Security Considerations

### 1. Secret Storage
- Encrypt TOTP secrets in database
- Use environment variable for encryption key
- Never log secrets

### 2. Backup Codes
- Hash backup codes (bcrypt)
- Show only once during setup
- Remove after use
- Generate 10 codes minimum

### 3. Rate Limiting
- Limit 2FA attempts (5 per 15 minutes)
- Lock account after 10 failed attempts
- Log all failed attempts

### 4. Recovery Process
- Require email verification
- Admin approval for 2FA reset
- Audit log all resets

---

## Testing Checklist

- [ ] Generate 2FA secret
- [ ] Scan QR code with authenticator app
- [ ] Verify token enables 2FA
- [ ] Login requires 2FA token
- [ ] Backup codes work
- [ ] Backup codes removed after use
- [ ] Invalid tokens rejected
- [ ] Rate limiting works
- [ ] Disable 2FA requires password
- [ ] Audit logs all 2FA actions

---

## Recommended Apps

- Google Authenticator (iOS/Android)
- Authy (iOS/Android/Desktop)
- Microsoft Authenticator (iOS/Android)
- 1Password (with TOTP support)

---

## Migration Plan

### Phase 1: Optional 2FA
- Implement for all users
- Encourage admins to enable
- No enforcement

### Phase 2: Required for Admins
- Force 2FA for all admin accounts
- 30-day grace period
- Email reminders

### Phase 3: Required for Organizers
- Extend to organizers (optional)
- Protect payment accounts

---

## Future Enhancements

- SMS 2FA (backup method)
- Hardware key support (YubiKey)
- Biometric authentication
- Trusted devices
- Remember device for 30 days

---

**Status:** Ready for implementation when prioritized

**Dependencies:** speakeasy, qrcode, bcryptjs

**Estimated Time:** 2-3 days (backend + frontend + testing)

---

**🔒 Security is a journey, not a destination 🔒**
