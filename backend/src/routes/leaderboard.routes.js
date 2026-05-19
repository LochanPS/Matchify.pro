import express from 'express';
import tournamentPointsService from '../services/tournamentPoints.service.js';
import { authenticate } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = express.Router();

/**
 * Get leaderboard with geographical filters
 * GET /api/leaderboard?scope=country&city=Mumbai&state=Maharashtra&limit=100
 */
router.get('/', async (req, res) => {
  console.log('🎯 LEADERBOARD ROUTE HIT!');
  console.log('Query params:', req.query);
  
  try {
    const { limit = 100, scope = 'country', city, state } = req.query;
    
    console.log('Calling getLeaderboard with:', { limit, scope, city, state });
    
    const leaderboard = await tournamentPointsService.getLeaderboard(
      parseInt(limit),
      scope,
      city,
      state
    );
    
    console.log(`✅ Leaderboard fetched: ${leaderboard.length} players`);
    
    res.json({
      success: true,
      leaderboard,
      total: leaderboard.length,
      scope,
      filters: { city, state }
    });
  } catch (error) {
    console.error('❌ Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard'
    });
  }
});

/**
 * Get player's rank and stats with geographical context
 * GET /api/leaderboard/my-rank
 */
router.get('/my-rank', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    
    const playerRanks = await tournamentPointsService.getPlayerRankWithGeo(userId);
    
    if (!playerRanks) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }
    
    res.json({
      success: true,
      ranks: playerRanks // Returns city, state, and country ranks
    });
  } catch (error) {
    console.error('Get player rank error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch player rank'
    });
  }
});

/**
 * Get specific player's rank
 * GET /api/leaderboard/player/:userId
 */
router.get('/player/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const playerRank = await tournamentPointsService.getPlayerRank(userId);
    
    if (!playerRank) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }
    
    res.json({
      success: true,
      rank: playerRank
    });
  } catch (error) {
    console.error('Get player rank error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch player rank'
    });
  }
});

/**
 * Public platform stats (no auth required)
 * GET /api/leaderboard/platform-stats
 */
router.get('/platform-stats', async (req, res) => {
  try {
    const [playerCount, tournamentCount, cityCount] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.tournament.count({ where: { status: { not: 'draft' } } }),
      prisma.tournament.findMany({
        where: { status: { not: 'draft' }, city: { not: null } },
        select: { city: true },
        distinct: ['city'],
      }),
    ]);

    res.json({
      success: true,
      stats: {
        players: playerCount,
        tournaments: tournamentCount,
        cities: cityCount.length,
      },
    });
  } catch (error) {
    console.error('Platform stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

export default router;
