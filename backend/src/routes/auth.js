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

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Missing required fields: email, password, name'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
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

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User with this email already exists'
      });
    }

    // Check phone uniqueness if provided
    if (phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone }
      });
      
      if (existingPhone) {
        return res.status(409).json({
          error: 'User with this phone number already exists'
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate matchify code
    const matchifyCode = await generateMatchifyCode();

    // Determine initial wallet balance based on roles
    const initialBalance = userRoles.includes('ORGANIZER') ? 25 : 0;

    // Create user with all roles as comma-separated string
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        roles: userRoles.join(','), // Store as comma-separated string
        name,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        city,
        state,
        gender,
        matchifyCode, // Add matchify code
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

    // Remove password from response
    const { password: _, refreshToken: __, ...userWithoutPassword } = user;

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

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

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

    // CRITICAL FIX: Ensure roles is always an array in response
    res.json({
      message: 'Login successful',
      user: {
        ...userWithoutPassword,
        roles: userRoles, // Array of roles (not the string from DB)
        currentRole: primaryRole, // Primary role string
        isAdmin: isAdmin // Boolean flag
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

    // Find user and verify stored refresh token matches
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

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
    const newAccessToken = generateAccessToken(user.id, user.role);
    const newRefreshToken = generateRefreshToken(user.id);

    // Update refresh token in database
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken }
    });

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
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
