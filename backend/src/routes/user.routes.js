import express from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Live dashboard stats for the signed-in user, computed from real data so the
// Player / Organizer / Umpire tiles always reflect actual activity — not stale
// stored counters that only some paths update (and never for guests/organizer/
// umpire). Defined before '/:userId' so 'me' is never treated as an id.
router.get('/me/dashboard-stats', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    const [
      matchesWon, matchesPlayed, playerRegs,
      orgTournaments, umpMatches, userRow,
    ] = await Promise.all([
      // Player — wins and games played (covers singles player slots + doubles team slots)
      prisma.match.count({ where: { winnerId: userId, status: 'COMPLETED' } }),
      prisma.match.count({ where: { status: 'COMPLETED', OR: [
        { player1Id: userId }, { player2Id: userId },
        { team1Player1Id: userId }, { team1Player2Id: userId },
        { team2Player1Id: userId }, { team2Player2Id: userId },
      ] } }),
      prisma.registration.findMany({ where: { userId }, select: { tournamentId: true } }),
      // Organizer — tournaments run + total participants across them
      prisma.tournament.findMany({ where: { organizerId: userId }, select: { _count: { select: { registrations: true } } } }),
      // Umpire — completed matches scored + distinct tournaments
      prisma.match.findMany({ where: { umpireId: userId, status: 'COMPLETED' }, select: { tournamentId: true } }),
      prisma.user.findUnique({ where: { id: userId }, select: { totalPoints: true } }),
    ]);

    const tournamentsPlayed  = new Set(playerRegs.map(r => r.tournamentId)).size;
    const winRate            = matchesPlayed > 0 ? Math.round((matchesWon / matchesPlayed) * 100) : 0;
    const totalParticipants  = orgTournaments.reduce((s, t) => s + (t._count?.registrations || 0), 0);
    const tournamentsUmpired = new Set(umpMatches.map(m => m.tournamentId)).size;

    res.json({
      success: true,
      stats: {
        player:    { totalPoints: userRow?.totalPoints || 0, tournamentsPlayed, matchesWon, matchesPlayed, winRate },
        organizer: { tournamentsOrganized: orgTournaments.length, totalParticipants },
        umpire:    { matchesUmpired: umpMatches.length, tournamentsUmpired },
      },
    });
  } catch (err) {
    console.error('dashboard-stats error:', err);
    res.status(500).json({ success: false, error: 'Failed to load dashboard stats' });
  }
});

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
