import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

console.log('✅ Admin routes loaded - return-to-admin endpoint registered');

// Simple test route
router.get('/test', authenticate, requireAdmin, (req, res) => {
  res.json({ success: true, message: 'Admin routes working!' });
});

// Get all users with pagination, search, and filters
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Max 100 per page
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const role = req.query.role || '';
    const status = req.query.status || '';

    // Build where clause for filtering
    const where = {};

    // Search by name, email, or phone
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } }
      ];
    }

    // Filter by role
    if (role) {
      where.roles = { contains: role };
    }

    // Filter by status
    if (status === 'active') {
      where.isActive = true;
      where.isSuspended = false;
    } else if (status === 'suspended') {
      where.isSuspended = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    // Get total count with filters
    const totalUsers = await prisma.user.count({ where });

    // Get users with pagination and filters
    const users = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: [
        { roles: 'desc' }, // Admin users first (ADMIN comes before PLAYER alphabetically when reversed)
        { createdAt: 'desc' }
      ],
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        roles: true,
        city: true,
        state: true,
        country: true,
        walletBalance: true,
        totalPoints: true,
        tournamentsPlayed: true,
        matchesWon: true,
        matchesLost: true,
        isActive: true,
        isVerified: true,
        isSuspended: true,
        suspendedUntil: true,
        suspensionReason: true,
        isVerifiedOrganizer: true,
        isVerifiedPlayer: true,
        isVerifiedUmpire: true,
        tournamentsRegistered: true,
        matchesUmpired: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            registrations: true,
            tournaments: true,
            walletTransactions: true
          }
        }
      }
    });

    // Sort to ensure admin is always first
    const sortedUsers = users.sort((a, b) => {
      const aIsAdmin = a.roles?.includes('ADMIN');
      const bIsAdmin = b.roles?.includes('ADMIN');
      if (aIsAdmin && !bIsAdmin) return -1;
      if (!aIsAdmin && bIsAdmin) return 1;
      return 0;
    });

    res.json({
      success: true,
      users: sortedUsers,
      pagination: {
        page,
        limit,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
        hasMore: skip + sortedUsers.length < totalUsers
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

// Get single user by ID
router.get('/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        alternateEmail: true,
        name: true,
        phone: true,
        roles: true,
        playerCode: true,
        umpireCode: true,
        profilePhoto: true,
        city: true,
        state: true,
        country: true,
        dateOfBirth: true,
        gender: true,
        walletBalance: true,
        totalPoints: true,
        tournamentsPlayed: true,
        matchesWon: true,
        matchesLost: true,
        isActive: true,
        isVerified: true,
        isSuspended: true,
        suspendedUntil: true,
        suspensionReason: true,
        isVerifiedOrganizer: true,
        isVerifiedPlayer: true,
        isVerifiedUmpire: true,
        tournamentsRegistered: true,
        matchesUmpired: true,
        availableForKYC: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            registrations: true,
            tournaments: true,
            walletTransactions: true,
            notifications: true,
            umpiredMatches: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user details'
    });
  }
});

// Login as user (impersonation)
router.post('/users/:id/login-as', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.userId; // Use userId from token, not id

    console.log('🔐 Admin impersonation request:', { adminId, targetUserId: id });

    // Get the user
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Cannot impersonate other admins
    if (user.roles?.includes('ADMIN')) {
      return res.status(403).json({
        success: false,
        error: 'Cannot impersonate admin users'
      });
    }

    // Parse roles
    let userRoles = ['PLAYER'];
    if (user.roles) {
      if (typeof user.roles === 'string') {
        userRoles = user.roles.split(',');
      } else if (Array.isArray(user.roles)) {
        userRoles = user.roles;
      }
    }

    // Generate JWT token for the user with admin impersonation flag
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        roles: userRoles,
        isImpersonating: true,
        adminId: adminId
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log(`🔐 Admin ${req.user.email} logged in as ${user.email}`);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: userRoles
      }
    });
  } catch (error) {
    console.error('Error in login-as:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to login as user'
    });
  }
});

// Return to admin from impersonation
router.post('/return-to-admin', authenticate, async (req, res) => {
  console.log('🔄 Return to admin endpoint hit!');
  console.log('User data:', req.user);
  try {
    // Check if user is impersonating
    if (!req.user.isImpersonating) {
      console.log('❌ Not in impersonation mode');
      return res.status(400).json({
        success: false,
        error: 'Not in impersonation mode'
      });
    }

    // Get the admin user - try by ID first, then by email as fallback
    let admin = null;
    
    if (req.user.adminId && req.user.adminId !== 'admin') {
      admin = await prisma.user.findUnique({
        where: { id: req.user.adminId },
        select: {
          id: true,
          email: true,
          name: true,
          roles: true
        }
      });
    }
    
    // Fallback: find admin by email
    if (!admin) {
      console.log('Admin ID not found, searching by email ADMIN@gmail.com');
      admin = await prisma.user.findFirst({
        where: { 
          email: 'ADMIN@gmail.com'
        },
        select: {
          id: true,
          email: true,
          name: true,
          roles: true
        }
      });
    }

    console.log('Admin found:', admin);

    if (!admin) {
      console.log('❌ Admin account not found');
      return res.status(404).json({
        success: false,
        error: 'Admin account not found'
      });
    }

    // Parse admin roles
    let adminRoles = ['ADMIN'];
    if (admin.roles) {
      if (typeof admin.roles === 'string') {
        adminRoles = admin.roles.split(',');
      } else if (Array.isArray(admin.roles)) {
        adminRoles = admin.roles;
      }
    }

    // Generate new JWT token for admin
    const token = jwt.sign(
      { 
        userId: admin.id, 
        email: admin.email, 
        roles: adminRoles
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log(`🔙 Admin ${admin.email} returned from impersonation`);

    res.json({
      success: true,
      token,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        roles: adminRoles,
        isAdmin: true // Add this flag so frontend recognizes admin status
      }
    });
  } catch (error) {
    console.error('Error in return-to-admin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to return to admin account'
    });
  }
});

/**
 * Manually award tournament points (Admin only)
 * POST /api/admin/award-points/:tournamentId/:categoryId
 */
router.post('/award-points/:tournamentId/:categoryId', authenticate, async (req, res) => {
  try {
    const { tournamentId, categoryId } = req.params;
    const userId = req.user.userId || req.user.id;

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true }
    });

    if (!user || !user.roles.includes('ADMIN')) {
      return res.status(403).json({
        success: false,
        error: 'Only admins can manually award points'
      });
    }

    // Award points
    const tournamentPointsService = await import('../services/tournamentPoints.service.js');
    const pointsAwarded = await tournamentPointsService.default.awardTournamentPoints(tournamentId, categoryId);

    res.json({
      success: true,
      message: 'Tournament points awarded successfully',
      pointsAwarded
    });

  } catch (error) {
    console.error('Award points error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to award points'
    });
  }
});

export default router;
