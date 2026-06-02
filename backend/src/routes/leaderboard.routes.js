import express from 'express';
import tournamentPointsService from '../services/tournamentPoints.service.js';
import { authenticate } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { cacheGet, cacheSet } from '../services/redisService.js';

const router = express.Router();

/**
 * Get leaderboard with geographical filters
 * GET /api/leaderboard?scope=country&city=Mumbai&state=Maharashtra&limit=100
 * Cached 2 minutes — leaderboard doesn't need to be real-time
 */
router.get('/', async (req, res) => {
  try {
    const { limit = 100, scope = 'country', city, state } = req.query;
    const cacheKey = `leaderboard:${scope}:${city || ''}:${state || ''}:${limit}`;

    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    const leaderboard = await tournamentPointsService.getLeaderboard(
      parseInt(limit), scope, city, state
    );

    const result = { success: true, leaderboard, total: leaderboard.length, scope, filters: { city, state } };
    await cacheSet(cacheKey, result, 120); // 2 min TTL

    res.json(result);
  } catch (error) {
    console.error('❌ Get leaderboard error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch leaderboard' });
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
    const cached = await cacheGet('platform-stats');
    if (cached) return res.json({ ...cached, cached: true });

    const [playerCount, tournamentCount, cityCount] = await Promise.all([
      prisma.user.count({ where: { isActive: true, NOT: { roles: { contains: 'ADMIN' } } } }),
      prisma.tournament.count({ where: { status: { not: 'draft' } } }),
      prisma.tournament.findMany({
        where: { status: { not: 'draft' }, city: { not: null } },
        select: { city: true },
        distinct: ['city'],
      }),
    ]);

    const result = {
      success: true,
      stats: { players: playerCount, tournaments: tournamentCount, cities: cityCount.length },
    };
    await cacheSet('platform-stats', result, 300); // 5 min TTL
    res.json(result);
  } catch (error) {
    console.error('Platform stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

export default router;
