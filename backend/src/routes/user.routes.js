import express from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get user by ID
router.get('/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const isSelf = req.user.id === userId || req.user.userId === userId;
    const isAdmin = (req.user.roles || []).includes('ADMIN');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        // phone and dateOfBirth only returned to self or admin
        phone: isSelf || isAdmin,
        profilePhoto: true,
        city: true,
        state: true,
        country: true,
        dateOfBirth: isSelf || isAdmin,
        gender: true,
        // roles string is internal — return computed flags instead
        roles: isSelf || isAdmin,
        playerCode: true,
        umpireCode: isSelf || isAdmin,
        totalPoints: true,
        tournamentsPlayed: true,
        matchesWon: true,
        matchesLost: true,
        isActive: true,
        isVerified: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Strip internal placeholder email for phone-only users
    let responseUser = { ...user };
    if (responseUser.email?.endsWith('@noemail.matchify.internal')) {
      responseUser = { ...responseUser, email: null };
    }

    res.json({
      success: true,
      user: responseUser
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
});

export default router;
