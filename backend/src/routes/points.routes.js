import express from 'express';
import { authenticate } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = express.Router();

// GET /api/points/my - Get current user's points history
router.get('/points/my', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's total points and rank
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        matchify_points: true,
        registrations: {
          where: { status: 'CONFIRMED' },
          select: { id: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate rank
    const higherRankedCount = await prisma.user.count({
      where: {
        matchify_points: { gt: user.matchify_points },
        role: 'PLAYER'
      }
    });

    const rank = higherRankedCount + 1;

    // Get points history (mock data for now - will be real when points system is implemented)
    const logs = await prisma.pointsLog.findMany({
      where: { userId },
      include: {
        tournament: {
          select: {
            name: true
          }
        },
        category: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        earned_at: 'desc'
      }
    }).catch(() => []); // Return empty array if PointsLog table doesn't exist yet

    const formattedLogs = logs.map(log => ({
      id: log.id,
      tournament_name: log.tournament?.name || 'Unknown Tournament',
      category_name: log.category?.name || 'Unknown Category',
      points: log.points,
      reason: log.reason,
      multiplier: log.multiplier || 1.0,
      earned_at: log.earned_at,
      description: log.description
    }));

    res.json({
      total_points: user.matchify_points,
      rank,
      tournaments_played: user.registrations.length,
      logs: formattedLogs
    });
  } catch (error) {
    console.error('My points error:', error);
    res.status(500).json({ error: 'Failed to fetch points history' });
  }
});

// GET /api/points/user/:userId - Get specific user's points (public)
router.get('/points/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        name: true,
        matchify_points: true,
        registrations: {
          where: { status: 'CONFIRMED' },
          select: { id: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate rank
    const higherRankedCount = await prisma.user.count({
      where: {
        matchify_points: { gt: user.matchify_points },
        role: 'PLAYER'
      }
    });

    const rank = higherRankedCount + 1;

    // Get points history
    const logs = await prisma.pointsLog.findMany({
      where: { userId: parseInt(userId) },
      include: {
        tournament: {
          select: {
            name: true
          }
        },
        category: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        earned_at: 'desc'
      }
    }).catch(() => []);

    const formattedLogs = logs.map(log => ({
      id: log.id,
      tournament_name: log.tournament?.name || 'Unknown Tournament',
      category_name: log.category?.name || 'Unknown Category',
      points: log.points,
      reason: log.reason,
      multiplier: log.multiplier || 1.0,
      earned_at: log.earned_at,
      description: log.description
    }));

    res.json({
      user: {
        id: user.id,
        name: user.name
      },
      total_points: user.matchify_points,
      rank,
      tournaments_played: user.registrations.length,
      logs: formattedLogs
    });
  } catch (error) {
    console.error('User points error:', error);
    res.status(500).json({ error: 'Failed to fetch user points' });
  }
});

export default router;
