import express from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  verifyAccessToken
} from '../utils/jwt.js';

const router = express.Router();
const prisma = new PrismaClient();

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

    // Process roles
    const validRoles = ['PLAYER', 'ORGANIZER', 'UMPIRE'];
    let userRoles = ['PLAYER']; // Default
    
    if (roles && Array.isArray(roles)) {
      userRoles = roles.filter(r => validRoles.includes(r));
      if (userRoles.length === 0) {
        userRoles = ['PLAYER']; // Fallback to PLAYER if no valid roles
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

    // Determine initial wallet balance based on role
    const initialBalance = role === 'ORGANIZER' ? 25 : 0;

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
        name,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        city,
        state,
        gender,
        walletBalance: initialBalance
      }
    });

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.role);
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

    // Give 25 free credits to organizers on first login if they have 0 balance
    if (user.role === 'ORGANIZER' && user.walletBalance === 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: { walletBalance: 25 }
      });
      user.walletBalance = 25;
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    // Update refresh token in database
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    // Remove sensitive data from response
    const { password: _, refreshToken: __, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
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
        role: true,
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

export default router;