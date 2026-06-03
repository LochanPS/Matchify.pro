import express from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  verifyAccessToken
} from '../utils/jwt.js';
import { generateMatchifyCode } from '../utils/matchifyCode.js';

const WELCOME_MESSAGE = `👋 Welcome to Matchify.pro!

You're now part of India's largest badminton platform. Thank you for joining us — we're glad to have you here! 🏸

This is your notification centre. Everything you need is right here:
• Tournament results & registration updates
• Live match alerts as a player or umpire
• Payment & activity updates as an organiser

🏆 Ready to connect with thousands of badminton players across India?

Join our WhatsApp community — India's biggest badminton network. Find doubles partners, discover tournaments near you, get early alerts & never miss a game. Tap below to join now 👇`;

const router = express.Router();

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const {
      email,
      password,
      roles, // Now accepts array of roles
      name,
      phone,
      dateOfBirth,
      city,
      state,
      gender
    } = req.body;

    // Validation — require name + password + at least one of email/phone
    if (!password || !name) {
      return res.status(400).json({
        error: 'Missing required fields: name, password'
      });
    }
    if (!email && !phone) {
      return res.status(400).json({
        error: 'Please provide either email or phone number'
      });
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'Invalid email format'
        });
      }
    }

    // Validate phone format if provided
    if (phone) {
      let cleanedPhoneCheck = phone.replace(/[\s\-\+]/g, '');
      // Only strip 91 country code prefix if number is 12 digits (91 + 10 digits)
      if (cleanedPhoneCheck.length === 12 && cleanedPhoneCheck.startsWith('91')) {
        cleanedPhoneCheck = cleanedPhoneCheck.slice(2);
      }
      if (!/^[0-9]{10}$/.test(cleanedPhoneCheck)) {
        return res.status(400).json({
          error: 'Invalid phone number. Enter 10-digit number without country code.'
        });
      }
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long'
      });
    }

    // Process roles - Default to all three roles
    const validRoles = ['PLAYER', 'ORGANIZER', 'UMPIRE'];
    let userRoles = ['PLAYER', 'ORGANIZER', 'UMPIRE']; // Default to all roles
    
    if (roles && Array.isArray(roles)) {
      userRoles = roles.filter(r => validRoles.includes(r));
      if (userRoles.length === 0) {
        userRoles = ['PLAYER', 'ORGANIZER', 'UMPIRE']; // Fallback to all roles
      }
    } else if (roles && typeof roles === 'string') {
      // Handle single role as string (backward compatibility)
      if (validRoles.includes(roles)) {
        userRoles = [roles];
      }
    }

    // Validate gender if provided
    if (gender && !['MALE', 'FEMALE', 'OTHER'].includes(gender)) {
      return res.status(400).json({
        error: 'Invalid gender. Must be MALE, FEMALE, or OTHER'
      });
    }

    // Clean phone number for storage
    const cleanedPhone = phone ? phone.replace(/[\s\-\+]/g, '').replace(/^91/, '') : null;

    // If no email provided (phone-only), generate unique internal placeholder
    const finalEmail = email || `phone.${cleanedPhone}.${Date.now()}@noemail.matchify.internal`;

    // Run bcrypt + matchifyCode generation in parallel to save time
    const [hashedPassword, matchifyCode] = await Promise.all([
      bcrypt.hash(password, 10), // cost 10 — fast enough, still secure
      generateMatchifyCode()
    ]);

    // Determine initial wallet balance based on roles
    const initialBalance = userRoles.includes('ORGANIZER') ? 25 : 0;

    // Create user — DB unique constraints handle duplicates (P2002 caught below)
    const user = await prisma.user.create({
      data: {
        email: finalEmail,
        ...(cleanedPhone ? { phone: cleanedPhone } : {}),
        password: hashedPassword,
        roles: userRoles.join(','),
        name,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        city,
        state,
        gender,
        matchifyCode,
        walletBalance: initialBalance
      }
    });

    // Generate tokens and persist refresh token in one update
    const accessToken  = generateAccessToken(user.id, user.roles);
    const refreshToken = generateRefreshToken(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    // Remove password, refresh token, and internal placeholder email from response
    const { password: _, refreshToken: __, ...userWithoutPassword } = user;
    if (userWithoutPassword.email?.endsWith('@noemail.matchify.internal')) {
      userWithoutPassword.email = null;
    }

    // Send welcome notification (fire-and-forget — don't block response)
    prisma.notification.create({
      data: {
        userId: user.id,
        type: 'WELCOME',
        title: '👋 Welcome to Matchify.pro!',
        message: WELCOME_MESSAGE,
      }
    }).catch(err => console.error('Welcome notification error:', err));

    res.status(201).json({
      message: 'User registered successfully',
      user: userWithoutPassword,
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // More detailed error logging for debugging
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'User with this email or phone already exists',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Duplicate entry'
      });
    }
    
    res.status(500).json({
      error: 'Registration failed',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Check if database is configured
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not configured');
      return res.status(503).json({
        error: 'Service temporarily unavailable',
        message: 'Database not configured. Please contact support.',
        code: 'DATABASE_NOT_CONFIGURED'
      });
    }

    // Detect if credential is email or phone
    const isEmail = email.includes('@');
    let cleanedCredential = isEmail ? email.trim().toLowerCase() : email;
    if (!isEmail) {
      // Clean phone: remove spaces, dashes, +
      cleanedCredential = email.replace(/[\s\-\+]/g, '');
      // Only strip 91 country code prefix if number is 12 digits (91 + 10 digits)
      if (cleanedCredential.length === 12 && cleanedCredential.startsWith('91')) {
        cleanedCredential = cleanedCredential.slice(2);
      }
    }
    const isPhone = /^[0-9]{10}$/.test(cleanedCredential);

    if (!isEmail && !isPhone) {
      return res.status(400).json({
        error: 'Invalid credential format. Please enter a valid email or 10-digit phone number.'
      });
    }

    // Find user by email (case-insensitive) OR phone
    let user = isEmail
      ? await prisma.user.findFirst({ where: { email: { equals: cleanedCredential, mode: 'insensitive' } } })
      : await prisma.user.findUnique({ where: { phone: cleanedCredential } });

    // Fallback: try original (uncleaned) phone format for backward compatibility
    if (!user && isPhone && cleanedCredential !== email) {
      user = await prisma.user.findUnique({ where: { phone: email } });
      // Migrate to cleaned format
      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { phone: cleanedCredential }
        });
      }
    }

    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        error: 'Account is deactivated. Please contact support.'
      });
    }

    // Check if account is suspended
    if (user.isSuspended) {
      const suspendedMessage = user.suspendedUntil
        ? `Account suspended until ${user.suspendedUntil.toISOString()}`
        : 'Account is permanently suspended';
        
      return res.status(403).json({
        error: suspendedMessage
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Check if JWT secrets are configured
    if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
      console.error('❌ JWT secrets not configured');
      return res.status(503).json({
        error: 'Service temporarily unavailable',
        message: 'Authentication system not configured. Please contact support.',
        code: 'JWT_NOT_CONFIGURED'
      });
    }

    // CRITICAL: Ensure user has a matchifyCode (MANDATORY)
    if (!user.matchifyCode) {
      console.log(`⚠️ User ${user.email} missing matchifyCode - generating now...`);
      const matchifyCode = await generateMatchifyCode();
      
      await prisma.user.update({
        where: { id: user.id },
        data: { matchifyCode }
      });
      
      user.matchifyCode = matchifyCode;
      console.log(`✅ Generated matchifyCode for ${user.email}: ${matchifyCode}`);
    }

    // Parse roles - handle both 'roles' and 'role' fields
    let userRoles = ['PLAYER']; // Default
    if (user.roles) {
      userRoles = user.roles.split(',').map(r => r.trim());
    } else if (user.role) {
      userRoles = [user.role];
    }
    
    const primaryRole = userRoles[0];
    const isAdmin = userRoles.includes('ADMIN');

    // Give 25 free credits to organizers on first login if they have 0 balance
    if (userRoles.includes('ORGANIZER') && user.walletBalance === 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: { walletBalance: 25 }
      });
      user.walletBalance = 25;
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, userRoles);
    const refreshToken = generateRefreshToken(user.id);

    // Update refresh token in database
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    // Remove sensitive data from response and fix roles field
    const { password: _, refreshToken: __, roles: ___, ...userWithoutPassword } = user;

    // Strip internal placeholder email (phone-only users)
    if (userWithoutPassword.email?.endsWith('@noemail.matchify.internal')) {
      userWithoutPassword.email = null;
    }

    // CRITICAL FIX: Ensure roles is always an array in response
    res.json({
      message: 'Login successful',
      user: {
        ...userWithoutPassword,
        roles: userRoles,
        currentRole: primaryRole,
        isAdmin: isAdmin
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    
    // Check for specific database errors
    if (error.code === 'P1001') {
      return res.status(503).json({
        error: 'Database connection failed',
        message: 'Unable to connect to database. Please try again later.',
        code: 'DATABASE_CONNECTION_ERROR'
      });
    }
    
    if (error.code === 'P2021') {
      return res.status(503).json({
        error: 'Database table not found',
        message: 'Database schema not initialized. Please contact support.',
        code: 'DATABASE_SCHEMA_ERROR'
      });
    }
    
    res.status(500).json({
      error: 'Login failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred. Please try again.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
});

// ── P2024 helpers (local to this file) ────────────────────────────────────
const _rtSleep = ms => new Promise(r => setTimeout(r, ms));
function _rtIsP2024(err) {
  return err?.code === 'P2024' || (err?.message || '').includes('connection pool');
}
async function _rtWithDbRetry(fn) {
  try { return await fn(); }
  catch (err) {
    if (_rtIsP2024(err)) { await _rtSleep(350); return await fn(); }
    throw err;
  }
}

// POST /auth/refresh-token
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Find user and verify stored refresh token matches (retry once on P2024)
    const user = await _rtWithDbRetry(() => prisma.user.findUnique({
      where: { id: decoded.userId }
    }));

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        error: 'Invalid refresh token'
      });
    }

    // Check if account is active
    if (!user.isActive || user.isSuspended) {
      return res.status(403).json({
        error: 'Account is not active'
      });
    }

    // Generate new tokens — parse roles string to array to keep JWT payload consistent
    const newAccessToken = generateAccessToken(user.id, typeof user.roles === 'string' ? user.roles.split(',').filter(Boolean) : (user.roles || []));
    const newRefreshToken = generateRefreshToken(user.id);

    // Update refresh token in database
    await _rtWithDbRetry(() => prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken }
    }));

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    // P2024 = DB connection pool exhausted — NOT a real auth failure.
    // Return 503 so the frontend interceptor does NOT call doLogout().
    if (_rtIsP2024(error)) {
      return res.status(503).json({ error: 'Server busy, please retry' });
    }
    res.status(401).json({
      error: 'Invalid or expired refresh token'
    });
  }
});

// POST /auth/logout
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      try {
        // Find user and clear refresh token
        const decoded = verifyRefreshToken(refreshToken);
        await prisma.user.update({
          where: { id: decoded.userId },
          data: { refreshToken: null }
        });
      } catch (error) {
        // Token might be invalid, but logout should still succeed
        console.log('Invalid refresh token during logout:', error.message);
      }
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    // Even if something goes wrong, logout succeeds
    console.error('Logout error:', error);
    res.json({ message: 'Logged out successfully' });
  }
});

// GET /auth/me - Get current user info
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access token required'
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        roles: true,
        matchifyCode: true,
        playerCode: true,
        umpireCode: true,
        city: true,
        state: true,
        country: true,
        dateOfBirth: true,
        gender: true,
        profilePhoto: true,
        totalPoints: true,
        tournamentsPlayed: true,
        matchesWon: true,
        matchesLost: true,
        walletBalance: true,
        isActive: true,
        isVerified: true,
        isSuspended: true,
        birthYear: true,
        isVerifiedOrganizer: true,
        isVerifiedPlayer: true,
        isVerifiedUmpire: true,
        tournamentsRegistered: true,
        matchesUmpired: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Strip internal placeholder email (phone-only users)
    const userResponse = { ...user };
    if (userResponse.email?.endsWith('@noemail.matchify.internal')) {
      userResponse.email = null;
    }

    res.json({
      user: userResponse
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({
      error: 'Invalid or expired token'
    });
  }
});

// GET /auth/verification-status - Get verification status
router.get('/verification-status', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access token required'
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        isVerifiedPlayer: true,
        isVerifiedOrganizer: true,
        isVerifiedUmpire: true,
        tournamentsRegistered: true,
        matchesUmpired: true,
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const verificationStatus = {
      player: {
        isVerified: user.isVerifiedPlayer,
        progress: user.tournamentsRegistered,
        required: 12,
        percentage: Math.min((user.tournamentsRegistered / 12) * 100, 100),
        remaining: Math.max(12 - user.tournamentsRegistered, 0)
      },
      organizer: {
        isVerified: user.isVerifiedOrganizer,
        requiresAdminApproval: true,
        message: 'Organizer verification requires manual admin approval'
      },
      umpire: {
        isVerified: user.isVerifiedUmpire,
        progress: user.matchesUmpired,
        required: 10,
        percentage: Math.min((user.matchesUmpired / 10) * 100, 100),
        remaining: Math.max(10 - user.matchesUmpired, 0)
      }
    };

    res.json({
      success: true,
      verification: verificationStatus
    });
  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(401).json({
      error: 'Invalid or expired token'
    });
  }
});

// POST /auth/forgot-password — sends 6-digit OTP to registered email
router.post('/forgot-password', async (req, res) => {
  const SUCCESS_MSG = 'If an account exists, an OTP has been sent to the registered email.';
  try {
    const rawCredential = req.body.credential;
    if (!rawCredential) {
      return res.status(400).json({ error: 'Email or phone number is required.' });
    }
    const credential = rawCredential.trim();

    const isEmail = credential.includes('@');
    const normalizedEmail = isEmail ? credential.toLowerCase() : null;
    let cleanedPhone = null;
    if (!isEmail) {
      cleanedPhone = credential.replace(/[\s\-\+]/g, '');
      if (cleanedPhone.length === 12 && cleanedPhone.startsWith('91')) cleanedPhone = cleanedPhone.slice(2);
      if (!/^[0-9]{10}$/.test(cleanedPhone)) {
        return res.status(400).json({ error: 'Enter a valid email or 10-digit phone number.' });
      }
    }

    const user = isEmail
      ? await prisma.user.findFirst({
          where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
          select: { id: true, email: true, name: true }
        })
      : await prisma.user.findUnique({
          where: { phone: cleanedPhone },
          select: { id: true, email: true, name: true }
        });

    if (!user) return res.json({ message: SUCCESS_MSG });

    const realEmail = user.email && !user.email.endsWith('@noemail.matchify.internal') ? user.email : null;
    if (!realEmail) return res.json({ message: SUCCESS_MSG });

    // Generate 6-digit OTP — store as "otp:attempts" to track wrong guesses without schema change
    const otp    = String(Math.floor(100000 + Math.random() * 900000));
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken:  `${otp}:0`,
        passwordResetExpiry: expiry
      }
    });

    const firstName = user.name?.split(' ')[0] || 'there';
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#040810;color:#fff;border-radius:16px;overflow:hidden;border:1px solid rgba(245,158,11,0.2);">
        <div style="background:linear-gradient(135deg,#F59E0B,#D97706);padding:24px 28px;">
          <h1 style="margin:0;font-size:22px;font-weight:900;color:#0C0900;">Matchify.pro</h1>
          <p style="margin:4px 0 0;font-size:13px;color:rgba(0,0,0,0.6);">Password Reset OTP</p>
        </div>
        <div style="padding:28px;">
          <p style="font-size:15px;margin:0 0 16px;">Hi <strong>${firstName}</strong>,</p>
          <p style="font-size:14px;color:rgba(255,255,255,0.75);margin:0 0 24px;line-height:1.6;">
            Use the OTP below to reset your Matchify password. It expires in <strong>10 minutes</strong>.
          </p>
          <div style="background:rgba(245,158,11,0.08);border:2px dashed rgba(245,158,11,0.35);border-radius:14px;padding:24px;text-align:center;margin:0 0 24px;">
            <p style="margin:0 0 8px;font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:3px;font-weight:700;">Your OTP</p>
            <p style="margin:0;font-size:44px;font-weight:900;color:#F59E0B;letter-spacing:10px;">${otp}</p>
          </div>
          <p style="font-size:13px;color:rgba(255,255,255,0.5);margin:0 0 8px;">Enter this OTP in the Matchify app to set a new password.</p>
          <p style="font-size:12px;color:rgba(255,255,255,0.3);margin:0;line-height:1.6;">
            If you didn't request this, ignore this email — your password won't change.<br>
            OTP expires: ${expiry.toUTCString()}
          </p>
        </div>
      </div>
    `;

    const { default: emailService } = await import('../services/emailService.js');
    await emailService.send(realEmail, 'Your Matchify OTP — Reset Password', html, null, true);

    return res.json({ message: SUCCESS_MSG });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.json({ message: 'If an account exists, an OTP has been sent to the registered email.' });
  }
});

// POST /auth/verify-reset-otp — verify OTP, return secure reset token
router.post('/verify-reset-otp', async (req, res) => {
  try {
    const { otp } = req.body;
    const rawCredential = req.body.credential;
    if (!rawCredential || !otp) {
      return res.status(400).json({ error: 'Credential and OTP are required.' });
    }
    const credential = rawCredential.trim();

    const isEmail = credential.includes('@');
    const normalizedEmail = isEmail ? credential.toLowerCase() : null;
    let cleanedPhone = null;
    if (!isEmail) {
      cleanedPhone = credential.replace(/[\s\-\+]/g, '');
      if (cleanedPhone.length === 12 && cleanedPhone.startsWith('91')) cleanedPhone = cleanedPhone.slice(2);
    }

    const user = isEmail
      ? await prisma.user.findFirst({
          where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
          select: { id: true, passwordResetToken: true, passwordResetExpiry: true }
        })
      : await prisma.user.findUnique({
          where: { phone: cleanedPhone },
          select: { id: true, passwordResetToken: true, passwordResetExpiry: true }
        });

    if (!user || !user.passwordResetToken || !user.passwordResetExpiry) {
      return res.status(400).json({ error: 'No OTP request found. Please request a new OTP.' });
    }

    // Token format: "otp:attempts" — no extra DB field needed
    const [storedOtp, attemptsStr] = user.passwordResetToken.split(':');
    const attempts = parseInt(attemptsStr || '0', 10);

    // Check expiry
    if (new Date() > user.passwordResetExpiry) {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordResetToken: null, passwordResetExpiry: null }
      });
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    // Max 3 attempts
    if (attempts >= 3) {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordResetToken: null, passwordResetExpiry: null }
      });
      return res.status(400).json({ error: 'Too many incorrect attempts. Please request a new OTP.' });
    }

    // Verify OTP
    if (storedOtp !== otp.trim()) {
      const newAttempts = attempts + 1;
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordResetToken: `${storedOtp}:${newAttempts}` }
      });
      const remaining = 3 - newAttempts;
      if (remaining <= 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordResetToken: null, passwordResetExpiry: null }
        });
        return res.status(400).json({ error: 'Too many incorrect attempts. Please request a new OTP.' });
      }
      return res.status(400).json({
        error: `Incorrect OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
      });
    }

    // OTP correct — swap in a secure reset token (30-min window to set new password)
    const { randomBytes } = await import('crypto');
    const resetToken  = randomBytes(32).toString('hex');
    const resetExpiry = new Date(Date.now() + 30 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken:  resetToken,
        passwordResetExpiry: resetExpiry
      }
    });

    return res.json({ resetToken });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
});

// POST /auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiry: { gt: new Date() } // not expired
      },
      select: { id: true }
    });

    if (!user) {
      return res.status(400).json({ error: 'Reset link is invalid or has expired. Please request a new one.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiry: null,
        refreshToken: null // force re-login on all devices
      }
    });

    return res.json({ success: true, message: 'Password reset successfully. Please log in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Password reset failed. Please try again.' });
  }
});

export default router;
