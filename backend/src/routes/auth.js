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

    // Check email uniqueness if a REAL email is provided
    if (email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ error: 'User with this email already exists' });
      }
    }

    // Check phone uniqueness if provided
    if (cleanedPhone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone: cleanedPhone } });
      if (existingPhone) {
        return res.status(409).json({ error: 'User with this phone number already exists' });
      }
    }

    // If no email provided (phone-only registration), generate a unique internal placeholder.
    // This satisfies the NOT NULL constraint on the email column without requiring a DB migration.
    // The placeholder is never exposed to users and is never used for login.
    const finalEmail = email || `phone.${cleanedPhone}.${Date.now()}@noemail.matchify.internal`;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate matchify code
    const matchifyCode = await generateMatchifyCode();

    // Determine initial wallet balance based on roles
    const initialBalance = userRoles.includes('ORGANIZER') ? 25 : 0;

    // Create user
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

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.roles);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token in database
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    // Remove password, refresh token, and internal placeholder email from response
    const { password: _, refreshToken: __, ...userWithoutPassword } = user;
    if (userWithoutPassword.email?.endsWith('@noemail.matchify.internal')) {
      userWithoutPassword.email = null;
    }

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
    let cleanedCredential = email;
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

    // Find user by email OR phone
    let user = await prisma.user.findUnique({
      where: isEmail ? { email: cleanedCredential } : { phone: cleanedCredential }
    });

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
    const accessToken = generateAccessToken(user.id, primaryRole);
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
      code: 'INTERNAL_SERVER_ERROR',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
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

    // Generate new tokens
    const newAccessToken = generateAccessToken(user.id, user.roles);
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
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      user
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

export default router;
